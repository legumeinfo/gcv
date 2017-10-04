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

gmod_load_ensembl_phyloxml_tree.pl - Loads a phylogentic tree into a chado database from an xml file provided by Ensembl.

=head1 SYNOPSIS

  gmod_load_ensembl_phyloxml_tree.pl <filename> [options]

  --dbid        The db_id of the db dbxref for the trees should be create with
  --name        The name given to the phylotree entry in the database (default=<filename>)
  --rank        The rank of new featurelocs (default=0)
  --dbname      The name of the chado database (default=chado)
  --username    The username to access the database with (default=chado)
  --password    The password to log into the database with
  --host        The host the database is on (default=localhost)
  --port        The port the database is on

=head1 DESCRIPTION

The --dbid flag is required.

This script WILL load a tree into the database even if all the polypeptides in the tree are not represented as features in the database. Polypeptides and organisms that are not in the database will be added as.

A new multiple sequence alignment is made for each tree and an entry is made in the featureloc table for each feature in the alignment.

The left_idx and right_idx fields of the new phylonode entries are given the correct values when they are inserted. This means that the gmod_index_trees.pl script does not have to be used in conjunction with this script.

=head1 AUTHOR

Alan Cleary

Copyright (c) 2014
This library is free software; you can redistribute it and/or modify it under the same terms as Perl itself.

=cut



# see if the user needs help
my $man = 0;
my $help = 0;
#GetOptions('help|?' => \$help, man => \$man) or pod2usage(2);
pod2usage(1) if $help;
pod2usage(-exitval => 0, -verbose => 2) if $man;

# get the command line options and environment variables
my ($port, $dbid, $name);
$port = $ENV{CHADO_DB_PORT} if ($ENV{CHADO_DB_PORT});
my $dbname = "chado";
$dbname = $ENV{CHADO_DB_NAME} if ($ENV{CHADO_DB_NAME});
my $username = "chado";
$username = $ENV{CHADO_DB_USER} if ($ENV{CHADO_DB_USER});
my $password = "";
$password = $ENV{CHADO_DB_PASS} if ($ENV{CHADO_DB_USER});
my $host = "localhost";
$host = $ENV{CHADO_DB_HOST} if ($ENV{CHADO_DB_HOST});
my $rank = 0;

GetOptions("dbid=i"             => \$dbid,
           "name=s"             => \$name,
           "rank=i"             => \$rank,
           "dbname=s"           => \$dbname,
           "username=s"         => \$username,
           "password=s"         => \$password,
           "host=s"             => \$host,
           "port=i"             => \$port) || Retreat("Error in command line arguments\n");

if (!$dbid) {
    Retreat("The --dbid flag is required\n");
}

# make sure we have our tree file
if (@ARGV != 1) {
    pod2usage(2);
}
$name = $ARGV[0] if (!$name);



# create a data source name
print "Connecting to the database\n";
my $dsn = "dbi:Pg:dbname=$dbname;host=$host;";
$dsn .= "port=$port;" if $port;

# connect to the database
my $conn = DBI->connect($dsn, $username, $password, {AutoCommit => 0, RaiseError => 1});
my $query;



# a subroutine to call when things get ugly
sub Retreat {
    print "Something went wrong.\nRolling back changes\n";
    eval{ $conn->rollback() } or print "Failed to rollback changes\n";
    Disconnect();
    die( $_[0] );
}

# close the connection
sub Disconnect {
    undef($query);
    $conn->disconnect();
}



# make sure there's a polypeptide cvterm in the db
my $type_id = $conn->selectrow_array("SELECT cvterm_id FROM cvterm WHERE name='polypeptide' LIMIT 1;");
# does it exist?
if ( !$type_id ) {
    Retreat("Make sure there's a cvterm named 'polypeptide' in the database before running this script\n");
}

# get the phylo_root, phylo_interior, and phylo_leaf cvterms from the cvterm table
my $root_id = $conn->selectrow_array("SELECT cvterm_id FROM cvterm WHERE name SIMILAR TO 'phylo_root' LIMIT 1;");
my $interior_id = $conn->selectrow_array("SELECT cvterm_id FROM cvterm WHERE name SIMILAR TO 'phylo_interior' LIMIT 1;");
my $leaf_id = $conn->selectrow_array("SELECT cvterm_id FROM cvterm WHERE name SIMILAR TO 'phylo_leaf' LIMIT 1;");
# throw an error if one or more doesn't exist
if ( !$root_id || !$interior_id || !$leaf_id) {
    Retreat("Failed to retrieve phylo_root, phylo_interior, and phylo_leaf cvterms from database\n");
}

# make sure that there's a consensus organism
my $consensus_organism = $conn->selectrow_array("SELECT organism_id FROM organism WHERE genus='consensus' AND species='consensus';");
if ( !$consensus_organism ) {
    Retreat("Failed to retrieve the consensus organism\n");
}
# make sure there's a consensus cvterm
my $consensus_cvterm = $conn->selectrow_array("SELECT cvterm_id FROM cvterm WHERE name='consensus';");
if ( !$consensus_cvterm ) {
    Retreat("Failed to retrieve the consesnsus cvterm\n");
}



# iterate over all the trees in the input file
print "Inspecting trees\n";
my $treeio = Bio::TreeIO->new(-file => $ARGV[0], -format => 'phyloxml');
while( my $tree = $treeio->next_tree ) {
    # let the user know how many nodes are in the tree
    print "",scalar $tree->get_nodes, " nodes found\n";

    # it seems our trees' internal nodes are ids, not bootstrap values, so we're going to treat them like ids
    my %leafs = ();
    my %nodes = ();
    for my $node ( $tree->get_nodes(-order => 'depth') ) {
        my $branch_length = $node->branch_length();
        my $parent = $node->ancestor();
        # hash the node, give it a value of it's unique phylonode database identifier later
        $nodes{$node->internal_id} = 1; # 1 is a placeholder
        # hash the leaf nodes, given them values of their unique feature database identifiers later
        if ($node->is_Leaf) {
            my $key = lc( $node->id );
            $key .= "_pep" if (index($key, "_pep") == -1);
            $leafs{$key} = $node;
        }
    }
    
    
    # let the user know how many nodes are leafs and that we're checking the database for them
    my $num_leafs = scalar(keys(%leafs));
    print "$num_leafs nodes are leafs\nSearching database for leafs.\n";
    
    
    # get all the tree features in the db
    # probably not the best place to declare a subroutine...
    my $query_string = "SELECT feature_id, lower(uniquename) FROM feature WHERE lower(uniquename) IN ('" . join("','", keys( %leafs ) ) . "');";
    $query = $conn->prepare($query_string);
    $query->execute();
    
    my $num_found = $query->rows();
    print "$num_found present in database\n";
    my %feature_map = ();
    
    
    # see if all the tree polypeptide features were found
    if ($num_found != $num_leafs) {
        print "Adding missing polypeptides to database, and organisms if any\n";
        # make a hash of the missing features and associate the existing features with their respective leafs
        my %missing_leafs = %leafs;
        while (my @row = $query->fetchrow_array()) {
            my ($feature_id, $uniquename) = @row;
            $feature_map{$uniquename} = $feature_id;
            delete $missing_leafs{$uniquename};
        }

        # add the missing features to the db
        my %organisms = ();
        for my $key (keys(%missing_leafs)) {
            # get the node
            my $node = $missing_leafs{$key};

            # get the organism information
            my $annotation = $node->annotation();
            my @annotations = $annotation->get_Annotations('property');
            my @keys = $annotations[0]->get_all_annotation_keys();
            my @value = $annotations[0]->get_Annotations('_text');
            my ($genus, $species) = split('_', $value[0]->value);

            # check if we know this organism is in the db
            if ( !( exists $organisms{lc( $value[0]->value )} ) ) {
                # query the db for the organism
                my $organism_id = $conn->selectrow_array("SELECT organism_id FROM organism WHERE genus ILIKE '$genus' AND species ILIKE '$species' LIMIT 1;");
                # does it exist?
                if ( $organism_id ) {
                    $organisms{lc( $value[0]->value)} = $organism_id;
                } else {
                    # add the organism to the db
                    $query_string = "INSERT INTO organism (genus, species) VALUES ('";
                    $query_string .= ucfirst( lc( $genus ) );
                    $query_string .= "', '";
                    $query_string .= lc( $species );
                    $query_string .= "');";
                    if ( !$conn->do($query_string) ) {
                        Retreat("Failed to create a dbxref entry with db_id $dbid\n");
                    }
                    $organisms{lc( $value[0]->value )} = $conn->selectrow_array("SELECT organism_id FROM organism WHERE genus ILIKE '$genus' AND species ILIKE '$species' LIMIT 1;");
                }
            }

            # add a feature to the db for the leaf
            my $query_string = "INSERT INTO feature (organism_id, name, uniquename, type_id) VALUES (";
            $query_string .= $organisms{lc( $value[0]->value )};
            $query_string .= ", '" . ucfirst($key) . "', '" . ucfirst($key) . "', $type_id);";
            if ( !$conn->do($query_string) ) {
                Retreat("Failed to add feature to database\n");
            }

            # get the new feature's id
            $query_string = "SELECT feature_id FROM feature WHERE uniquename='" . ucfirst($key) . "';";
            $feature_map{$key} = $conn->selectrow_array($query_string);
        }
    } else {
        while (my @row = $query->fetchrow_array()) {
            my ($feature_id, $uniquename) = @row;
            $feature_map{$uniquename} = $feature_id;
        }
        # notify the user that we're creating a tree
        print "All polypeptides found!\n";
    }



    #print "feature_map:\n";
    #for my $key (keys(%feature_map)) {
    #    print "    $key\n";
    #}



    print "Creating tree\n";



    # give each feature a featureloc
    # create a consensus feature
    if ( !$conn->do("INSERT INTO feature (organism_id, name, uniquename, type_id) VALUES ($consensus_organism, '$name-consensus', '$name-consensus', $consensus_cvterm);") ) {
        Retreat("Failed to create a consesnsus feature for the features of the treen");
    }
    my $consensus_feature = $conn->selectrow_array("SELECT feature_id FROM feature WHERE uniquename='$name-consensus';");
    if ( !$consensus_feature ) {
        Retreat("Failed to retrieve the consensus feature\n");
    }



    # create a new dbxref for a phylotree
    if (!$conn->do("INSERT INTO dbxref (db_id, accession) VALUES ($dbid, '$name');")) {
        Retreat("Failed to create a dbxref entry with db_id $dbid\n");
    }
    my $dbxref = $conn->selectrow_array("SELECT dbxref_id FROM dbxref ORDER BY dbxref_id DESC LIMIT 1;");



    # create a new phylotree with our new dbxref
    if ( !$conn->do("INSERT INTO phylotree (name, dbxref_id) VALUES ('$name', $dbxref);")) {
        Retreat("Failed to create phylotree entry with name $name and dbxref $dbxref\n");
    }
    my $phylotree = $conn->selectrow_array("SELECT phylotree_id FROM phylotree ORDER BY phylotree_id DESC LIMIT 1;");
    #print "Created tree with id $phylotree\n";
    
    
    # make a tree and create a featureloc and phylonode for each node's feature
    my $root_phylonode;
    my $index = 1;
    my %indexes = ();
    for my $node ( $tree->get_nodes(-order => 'depth') ) {
        # get the next available index
        while ( exists $indexes{$index} ) {
            $index++;
        }
        $indexes{$index} = 0;
        # get the node's parent
        my $parent = $node->ancestor;
        # construct the insert commands
        my $fields = "(phylotree_id,left_idx,right_idx,distance,type_id";
        my $rindex = $index+2*($node->descendent_count())+1;
        $indexes{$rindex} = 0;
        my $values = "($phylotree,$index,$rindex,".$node->branch_length;
        # if a node has a parent
        if ($parent) {
            # and it's a leaf
            if ($node->is_Leaf) {
                # then it gets a label, feature, and type leaf
                $values .= ",".$leaf_id;
                $fields .= ",label,feature_id";
                my $id = lc($node->id);
                $values .= ",'".ucfirst($id);
                #$values .= "',".$leafs{$id."_pep"};
                $values .= "',".$feature_map{$id."_pep"};

                # make the feature loc entry
                my $sequence = '';
                if ( $node->sequence ) {
                    my $seq = $node->sequence;
                    $sequence = $seq->[0]->seq();
                }
                if ( !$conn->do("INSERT INTO featureloc (feature_id, srcfeature_id, residue_info, rank) VALUES (" . $feature_map{lc($node->id)."_pep"} . ",$consensus_feature,'$sequence',$rank);") ) {
                    Retreat("Failed to insert featureloc for " . $feature_map{$node->id."_pep"} . "\n");
                }
            }
            # and is internal
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
        #print "INSERT INTO phylonode ".$fields." VALUES ".$values.";\n";
        $query = "INSERT INTO phylonode ".$fields." VALUES ".$values.";";
        if (!$conn->do($query)) {
            Retreat("Failed to create entry in phylonode with fields $fields and values $values\n");
        }
        # get the id for the entry and hash it
        $nodes{$node->internal_id} = $conn->selectrow_array("SELECT phylonode_id FROM phylonode ORDER BY phylonode_id DESC LIMIT 1;");
        # here we're assuming the first phylonode to be created is the root, which should always be true ;)
        $root_phylonode = $nodes{$node->internal_id} if (!$root_phylonode);
        #$root_phylonode = 0;
    }
}

eval{ $conn->commit() } or Retreat("The commit failed\n");
Disconnect();



