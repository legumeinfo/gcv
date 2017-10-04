#!/usr/bin/env perl


use strict;
use warnings;
use Getopt::Long; # get the command line options
use Pod::Usage; # so the user knows what's going on
use DBI; # our DataBase Interface
use Bio::TreeIO; # for reading our trees
use IO::String; # for loading our file contents into TreeIO as a string
use Cwd 'abs_path'; # for executing the indexing script


=head1 NAME

gmod_load_tree.pl - Loads a phylogentic tree with its left and right index into a chado database from a file.

FINAL TREE LOADING SCRIPT 

=head1 SYNOPSIS

  gmod_load_tree_with_index.pl <filename> [options]

  --xref_db        The name of the db to link dbxrefs for the trees
  --xref_accession        The accession to use for dbxrefs for the trees (assumed same as name unless otherwise specified)
  --name        The name given to the phylotree entry in the database (default=<filename>)
  --dbname      The name of the chado database (default=chado)
  --username    The username to access the database with (default=chado)
  --password    The password to log into the database with
  --host        The host the database is on (default=localhost)
  --port        The port the database is on
  --errorfile   The file that errors should be written to (default=gmod_load_tree_errors.txt)

=head1 DESCRIPTION

The --xref_db flag is required.

This script WILL NOT load a tree into the database unless all the polypeptides in the tree are represented as features in the database. Polypeptides that are not in the database will be written to the errorfile, as specified by the --errorfile flag.

When trees are first added to the database their nodes' left_idx and right_idx fields are given unique, with respect to the tree, positive values that reflect the tree structure. So, there is no need to run gmod_index_trees.pl script for indexing after this script.

Key points:
1. Indexing is done within this script while loading the tree, so there is absolutely no need to run other script gmod_index_trees.pl.
2. Suffix  _pep is not required to be checked as this code is for standard polypeptide names.
3. 'name' of a polypeptide feature with type_id of 'polypeptide' is checked instead of its 'uniquename' to avoid discrepancy as same name is preserved for both mRNA and polypeptide in chado database and also because feature name (not uniquename) matches with the fasta header ID for our data.

Chado tables affected or populated with data are:

= phylotree
= phylonode
= dbxref

=head1 AUTHOR

Alan Cleary

Copyright (c) 2013
This library is free software; you can redistribute it and/or modify it under the same terms as Perl itself.

=cut


# see if the user needs help
my $man = 0;
my $help = 0;

pod2usage(1) if $help;
pod2usage(-exitval => 0, -verbose => 2) if $man;


# get the command line options and environment variables
my ($port, $xref_db, $xref_accession, $name);
$port = $ENV{CHADO_DB_PORT} if ($ENV{CHADO_DB_PORT});
my $dbname = "chado";
$dbname = $ENV{CHADO_DB_NAME} if ($ENV{CHADO_DB_NAME});
my $username = "chado";
$username = $ENV{CHADO_DB_USER} if ($ENV{CHADO_DB_USER});
my $password = "";
$password = $ENV{CHADO_DB_PASS} if ($ENV{CHADO_DB_USER});
my $host = "localhost";
$host = $ENV{CHADO_DB_HOST} if ($ENV{CHADO_DB_HOST});
my $errorfile = "gmod_load_tree_errors.txt";

GetOptions("xref_db=s"             => \$xref_db,
           "xref_accession=s"             => \$xref_accession,
           "name=s"             => \$name,
           "dbname=s"           => \$dbname,
           "username=s"         => \$username,
           "password=s"         => \$password,
           "host=s"             => \$host,
           "port=i"             => \$port,
           "errorfile=s"        => \$errorfile) || die("Error in command line arguments\n");

if (!defined $xref_db) {
    die("The --xref_db flag is required\n");
}


# make sure we have our tree file
if (@ARGV != 1) {
    pod2usage(2);
}
$name = $ARGV[0] if (!$name);
$xref_accession = $name if (! defined $xref_accession);


# open the tree file and assign the name
print "Opening the input file\n";
open(FILE, $ARGV[0]) || die("Failed to read the input file\n");


# create a data source name
print "Connecting to the database\n";
my $dsn = "dbi:Pg:dbname=$dbname;host=$host;";
$dsn .= "port=$port;" if $port;


# connect to the database
my $conn = DBI->connect($dsn, $username, $password, {'RaiseError' => 1});


# read each line of the file into a string
print "Reading tree file\n";
my $newick = "";
while (my $line = <FILE>) {
    chomp $line;
    $newick .= $line
}


# close the file
close(FILE);


# let the user know how many nodes we have
print "Inspecting trees\n";
my $io = IO::String->new($newick);
my $treeio = Bio::TreeIO->new(-fh => $io, -format => 'newick');
while( my $tree = $treeio->next_tree ) {
    # get a tree
    print "",scalar $tree->get_nodes, " nodes found\n";
}


# get all the ids
$io = IO::String->new($newick);
$treeio = Bio::TreeIO->new(-fh => $io, -format => 'newick');
# it seems our trees' internal nodes are ids, not bootstrap values, so we're going to treat them like ids
my %leafs = ();
my %nodes = ();
while( my $tree = $treeio->next_tree ) {
    for my $node ( $tree->get_nodes ) {
        my $branch_length = $node->branch_length;
	my $int_node = $node->internal_id;
	my $parent = $node->ancestor;
        # hash the node, give it a value of it's unique phylonode database identifier later
        $nodes{$node->internal_id} = 1; # 1 is a placeholder
        # hash the leaf nodes, given them values of their unique feature database identifiers later
        if ($node->is_Leaf) {
            my $leaf = $node->id;
            $leafs{$leaf} = 1;
        }
    }
}


# let the user know how many nodes are leafs and that we're checking the database for them
my $num_leafs = scalar(keys(%leafs));
print "$num_leafs nodes are leafs\nSearching database for leafs\n";

# get the cvterm for polypeptide  
print "Retrieving polypeptide cvterm\n";
my $peptide = $conn->selectrow_array("SELECT cvterm_id FROM cvterm WHERE name SIMILAR TO 'polypeptide';");


# get all the tree features in the db
my $query_string = "SELECT feature_id, name FROM feature WHERE";
my $i = 0;
for my $key (keys(%leafs)) {
    $i++;
    $query_string .= " name='$key' and type_id='$peptide'";
    $query_string .= " OR" if ($i != $num_leafs);
}
$query_string .= ";";
my $query = $conn->prepare($query_string);
$query->execute();
my $num_found = $query->rows();
print "$num_found present in databse\n";


# see if all the tree polypeptide features were found
if ($num_found != $num_leafs) {
    # open the error file
    print "Some polypeptides were missing\nOpening the error file\n";
    open(ERRORS, '>>'.$errorfile) || die("Failed to open the error file: $!\n");
    print "Writing errors\n";
    print ERRORS "Failed to find polypeptides with name:\n";
    # remove polypeptides that were found from the hash
    while (my @row = $query->fetchrow_array()) {
        my ($feature, $name) = @row;
        delete $leafs{$name};
    }
    # report polypeptides that weren't found
    for my $key (keys(%leafs)) {
        print ERRORS "", substr($key, 0, index($key, "_pep")), "\n"; 
	}
    # close file and connetion
    print "Closing error file\n";
    close(ERRORS);
    undef($query);
    $conn->disconnect();
    # die
    die("Exiting...\n");
}


# notify the user that we're creating a tree
print "All polypeptides found!\nCreating tree\n";


# associate feature_ids with their respective hashes
while (my @row = $query->fetchrow_array()) {
    my ($feature, $name) = @row;
    $leafs{$name} = $feature;
}


# get the phylo_root, phylo_interior, and phylo_leaf cvterms from the cvterm table
my $root_id = $conn->selectrow_array("SELECT cvterm_id FROM cvterm WHERE name SIMILAR TO 'phylo_root';");
my $interior_id = $conn->selectrow_array("SELECT cvterm_id FROM cvterm WHERE name SIMILAR TO 'phylo_interior';");
my $leaf_id = $conn->selectrow_array("SELECT cvterm_id FROM cvterm WHERE name SIMILAR TO 'phylo_leaf';");
# throw an error if one or more doesn't exist
if (!$root_id || ! $interior_id || !$leaf_id) {
    # close the connection
    undef($query);
    $conn->disconnect();
    # die
    die("Failed to retrieve phylo_root, phylo_interior, and phylo_leaf cvterms from database\nExiting...\n");
}

my $dbid = $conn->selectrow_array("SELECT db_id FROM db where name = '$xref_db';");
if (!$dbid) {
    $conn->disconnect();
    die("could not find db row for $xref_db\n");
}


# create a new dbxref for a phylotree
if (!$conn->do("INSERT INTO dbxref (db_id, accession) VALUES ($dbid, '$xref_accession');")) {
    # close the connection
    undef($query);
    $conn->disconnect();
    # die
    die("Failed to create a dbxref entry with db_id $dbid\n");
}
my $dbxref = $conn->selectrow_array("SELECT currval(pg_get_serial_sequence('dbxref','dbxref_id'))");


# create a new phylotree with our new dbxref
if(!$conn->do("INSERT INTO phylotree (name, dbxref_id, comment) VALUES ('$name', $dbxref, '$newick');")) {
    # close the connection
    undef($query);
    $conn->disconnect();
    # die
    die("Failed to create phylotree entry with name $name and dbxref $dbxref\n");
}
my $phylotree = $conn->selectrow_array("SELECT currval(pg_get_serial_sequence('phylotree','phylotree_id'))");
print "Created tree with id $phylotree\n";


# insert the tree nodes into the phylonode table
$io = IO::String->new($newick);
$treeio = Bio::TreeIO->new(-fh => $io, -format => 'newick');

while( my $tree = $treeio->next_tree ) {
    my $root_phylonode;
	my $index = 1;
	my %indexes = ();
    for my $node ( $tree->get_nodes ) {
        # get the next available index
        while ( exists $indexes{$index} ) {
            $index++;
        }
        $indexes{$index} = 0;
        # get the node's parent
        my $parent = $node->ancestor;
        # construct the insert commands
        my $rindex = $index+2*($node->descendent_count())+1; 
        $indexes{$rindex} = 0;
        my $fields = "(phylotree_id,left_idx,right_idx,distance,type_id";
	my $len_pu = $node->branch_length; 

	# insert  NULL value for undefined branch_length
	 my $values = "($phylotree,$index,$rindex,".(defined $len_pu? $len_pu : "NULL");

        
	# if a node has a parent
        if ($parent) {
            # and it's a leaf
            if ($node->is_Leaf) {
                # then it gets a label, feature, and type leaf
                $values .= ",".$leaf_id; # fix?
		
                $fields .= ",label,feature_id";
                my $id = $node->id;
                $values .= ",'".$id;   #fix is $id blank?
                $values .= "',".$leafs{$id};  
		}

            # and is not a leaf
            else {
                # it gets type interior
                $values .= ",".$interior_id;
            }
            $fields .= ",parent_phylonode_id";
            $values .= ",".$nodes{$parent->internal_id};
        }
        # it's the root
        else {
            $values .= ",".$root_id;
        }
        $fields .= ")";
        $values .= ")";
        # create the entry in the phylonode table
        if (!$conn->do("INSERT INTO phylonode ".$fields." VALUES ".$values.";")) {
            # close the connection
            undef($query);
            $conn->disconnect();
            # die
            die("Failed to create entry in phylonode with fields $fields and values $values\n");
        }
        # get the id for the entry and hash it
        $nodes{$node->internal_id} = $conn->selectrow_array("SELECT currval(pg_get_serial_sequence('phylonode','phylonode_id'))");
        # here we're assuming the first phylonode to be created is the root, which should always be true ;)
        $root_phylonode = $nodes{$node->internal_id} if (!$root_phylonode);
    }
}
print "populated nodes for tree with id $phylotree\n";


# close connection
undef($query);
$conn->disconnect();


