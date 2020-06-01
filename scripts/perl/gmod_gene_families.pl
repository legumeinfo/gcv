#!/usr/bin/env perl


use strict;
use warnings;
use Getopt::Long; # get the command line options
use Pod::Usage; # so the user knows what's going on
use DBI; # our DataBase Interface
use Cwd 'abs_path'; # for executing the indexing script


=head1 NAME

gmod_gene_families.pl - Adds an entry in the featureprop table in a chado database for each each family a gene belongs to.

=head1 SYNOPSIS

  gmod_gene_families.pl [options]

  --nuke        Delete all previous gene family entries in featureprop
  --dbname      The name of the chado database (default=chado)
  --username    The username to access the database with (default=chado)
  --password    The password to log into the database with
  --host        The host the database is on (default=localhost)
  --port        The port the database is on
  --family_name The prefix used to identify the families of interest

=head1 DESCRIPTION

This script will finds all the phylogenetic trees (families) each gene in the database is associate with and creates an entry for each in the featureprop table.

If the --nuke flag is provided all previous gene family entries in the featureprop table wilol be removed before new ones are inserted.

If an entry already exists in the featureprop table for a gene and a tree a new entry will not be made.

=head1 AUTHOR

Alan Cleary

Copyright (c) 2014
This library is free software; you can redistribute it and/or modify it under the same terms as Perl itself.

=cut



# get the command line options and environment variables
my ($port);
$port = $ENV{CHADO_DB_PORT} if ($ENV{CHADO_DB_PORT});
my $dbname = "chado";
$dbname = $ENV{CHADO_DB_NAME} if ($ENV{CHADO_DB_NAME});
my $username = "chado";
$username = $ENV{CHADO_DB_USER} if ($ENV{CHADO_DB_USER});
my $password = "";
$password = $ENV{CHADO_DB_PASS} if ($ENV{CHADO_DB_USER});
my $host = "localhost";
$host = $ENV{CHADO_DB_HOST} if ($ENV{CHADO_DB_HOST});
my $nuke = 0;
my $family_name;

# see if the user needs help
my $man = 0;
my $help = 0;

GetOptions("nuke"             => \$nuke,
           "family_name=s"      => \$family_name,
           "dbname=s"           => \$dbname,
           "username=s"         => \$username,
           "password=s"         => \$password,
           "host=s"             => \$host,
           "port=i"             => \$port,
           "help|?"             => \$help,
           "man"                => \$man,
           ) or pod2usage(2);

pod2usage(1) if $help;
pod2usage(-exitval => 0, -verbose => 2) if $man;



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
if( !$conn->do("CREATE TABLE IF NOT EXISTS gene_family_assignment(gene_family_assignment_id SERIAL PRIMARY KEY, gene_id INTEGER NOT NULL REFERENCES feature(feature_id), family_label TEXT NOT NULL)") ) {
    Retreat("Failed to verify or create the gene_family_assignment table\n");
}
#thanks to stackoverflow
if( !$conn->do(q[
DO $$
BEGIN

IF NOT EXISTS (
    SELECT 1
    FROM   pg_class c
    JOIN   pg_namespace n ON n.oid = c.relnamespace
    WHERE  c.relname = 'gene_family_assignment_idx1'
    AND    n.nspname = 'public' -- 'public' by default
    ) THEN

    CREATE INDEX gene_family_assignment_idx1 ON gene_family_assignment(family_label);
END IF;

END$$;
]
) ) {
    Retreat("Failed to verify or create the gene_family_assignment index\n");
}

print "Fetching preliminaries\n";

my $query_string;
# get the app-specific GCV_properties cv from the database
my $cv_id = $conn->selectrow_array("SELECT cv_id FROM cv WHERE name='GCV_properties' LIMIT 1;");
# does it exist?
if( !$cv_id ) {
    $query_string = "INSERT INTO cv (name) VALUES ('GCV_properties');";
    if ( !$conn->do($query_string) ) {
        Retreat("Failed to add an entry into the cv table  for GCV_properties\n");
    }
    $cv_id = $conn->selectrow_array("SELECT cv_id FROM cv WHERE name='GCV_properties' LIMIT 1;");
}

# does the db entry for local exist?
my $db_id = $conn->selectrow_array("SELECT db_id FROM db WHERE name ilike 'null' LIMIT 1;");
#recreate if necessary
if( !$db_id ) {
    $query_string = "INSERT INTO db (name, description) VALUES ('null', 'a fake database for local items');";
    if ( !$conn->do($query_string) ) {
        Retreat("Failed to add an entry into the db table for the null db\n");
    }
    $db_id = $conn->selectrow_array("SELECT db_id FROM db WHERE name='null' LIMIT 1;");
}


# check to see if there's a cvterm for gene families in the database
my $gene_family_id = $conn->selectrow_array("SELECT cvterm_id FROM cvterm WHERE name='gene family' LIMIT 1;");
# does it exist?
if ( !$gene_family_id ) {
    my $dbxref_id = $conn->selectrow_array("SELECT dbxref_id FROM dbxref WHERE accession='gcv:gene_family' LIMIT 1;");
    # does it exist?
    if( !$dbxref_id ) {
        $query_string = "INSERT INTO dbxref (db_id, accession) VALUES ($db_id, 'gcv:gene_family');";
        if ( !$conn->do($query_string) ) {
            Retreat("Failed to add an entry into the dbxref table for gcv:gene_family\n");
        }
        $dbxref_id = $conn->selectrow_array("SELECT dbxref_id FROM dbxref WHERE accession='gcv:gene_family' LIMIT 1;");
    }
    $query_string = "INSERT INTO cvterm (cv_id, name, definition, dbxref_id) VALUES ($cv_id, 'gene family', 'a group of genes presumed to be related by common ancestry', $dbxref_id);";
    if ( !$conn->do($query_string) ) {
        Retreat("Failed to add cvterm to database\n");
    }
    $gene_family_id = $conn->selectrow_array("SELECT cvterm_id FROM cvterm WHERE name='gene family' LIMIT 1;");
}
# check to see if there's a cvterm for family representatives in the database
my $family_representative_id = $conn->selectrow_array("SELECT cvterm_id FROM cvterm WHERE name='family representative' LIMIT 1;");
# does it exist?
if ( !$family_representative_id ) {
    my $dbxref_id = $conn->selectrow_array("SELECT dbxref_id FROM dbxref WHERE accession='gcv:family_representative' LIMIT 1;");
    # does it exist?
    if( !$dbxref_id ) {
        $query_string = "INSERT INTO dbxref (db_id, accession) VALUES ($db_id, 'gcv:family_representative');";
        if ( !$conn->do($query_string) ) {
            Retreat("Failed to add an entry into the dbxref table for gcv:family_representative\n");
        }
        $dbxref_id = $conn->selectrow_array("SELECT dbxref_id FROM dbxref WHERE accession='gcv:family_representative' LIMIT 1;");
    }
    $query_string = "INSERT INTO cvterm (cv_id, name, definition, dbxref_id) VALUES ($cv_id, 'family representative', 'indicates which of the derived entities (choice of isoform or polypeptide) represents the gene in the context of the tree', $dbxref_id);";
    if ( !$conn->do($query_string) ) {
        Retreat("Failed to add cvterm to database\n");
    }
    $family_representative_id = $conn->selectrow_array("SELECT cvterm_id FROM cvterm WHERE name='family representative' LIMIT 1;");
}


# nuke the old featureprop entries... if we're supposed to
if( $nuke ) {
    print "Deleting old entries\n";
    $query_string = "DELETE FROM featureprop WHERE type_id in ($gene_family_id, $family_representative_id)";
    $query = $conn->prepare($query_string);
    $query->execute();
    $query_string = "TRUNCATE TABLE gene_family_assignment;";
    $query = $conn->prepare($query_string);
    $query->execute();
}
my %gene2families;
my %id2family_representative;
# get all the phylotree from the database
$query_string = "SELECT phylotree_id, name FROM phylotree WHERE name!='NCBI taxonomy tree'";
if (defined $family_name) {
    $query_string .= " AND name like '$family_name%'"
}
$query = $conn->prepare($query_string);
$query->execute();
# get all the genes for each tree and add an entry into the featureprop table
while( my @tree = $query->fetchrow_array() ) {
    my ($tree_id, $tree_name) = @tree;
    print "Adding entries for tree $tree_id\n";
    # get the peptide ids
    $query_string = "SELECT DISTINCT feature_id, label FROM phylonode WHERE phylotree_id=$tree_id;";
    my $peptide_query = $conn->prepare($query_string);
    $peptide_query->execute();
    print "    num peptides: " . $peptide_query->rows() . "\n";
    if( $peptide_query->rows() == 0 ) {
        next;
    }
    # get the mrna ids
    $query_string = "SELECT DISTINCT object_id, subject_id FROM feature_relationship WHERE subject_id IN (";
    while( my @peptide = $peptide_query->fetchrow_array() ) {
        my ($peptide_id, $label) = @peptide;
        if ($peptide_id) {
            $id2family_representative{$peptide_id} = $label;
            $query_string .= $peptide_id . ",";
        }
    }
    $query_string = substr($query_string, 0, -1) . ");";
    my $mrna_query = $conn->prepare($query_string);
    $mrna_query->execute();
    if( $mrna_query->rows() == 0 ) {
        next;
    }
    # get the gene ids
    $query_string = "SELECT DISTINCT object_id, subject_id FROM feature_relationship WHERE subject_id IN (";
    while( my @mrna = $mrna_query->fetchrow_array() ) {
        my ($mrna_id, $peptide_id) = @mrna;
        $id2family_representative{$mrna_id} = $id2family_representative{$peptide_id};
        $query_string .= $mrna_id . ",";
    }
    $query_string = substr($query_string, 0, -1) . ");";
    my $gene_query = $conn->prepare($query_string);
    $gene_query->execute();
    if( $gene_query->rows() == 0 ) {
        next;
    }
    while( my @gene = $gene_query->fetchrow_array() ) {
        my ($gene_id, $mrna_id) = @gene;
        $id2family_representative{$gene_id} = $id2family_representative{$mrna_id};
	    $gene2families{$gene_id}->{$tree_name} = 1;
    }
}
my $insert_featureprop_gf = $conn->prepare("INSERT INTO featureprop (feature_id, type_id, value, rank) VALUES(?, $gene_family_id, ?, ?);");
my $insert_featureprop_fr = $conn->prepare("INSERT INTO featureprop (feature_id, type_id, value, rank) VALUES(?, $family_representative_id, ?, ?);");
my $insert_gene_family_assignment = $conn->prepare("INSERT INTO gene_family_assignment (gene_id, family_label) VALUES(?, ?);");
foreach my $gene_id (keys %gene2families) {
    my $families = join(" ", sort keys %{$gene2families{$gene_id}});
    my $family_representative = $id2family_representative{$gene_id};
    # add an entry to the featureprop table for each gene
    if ($nuke) {
        $insert_featureprop_gf->execute($gene_id, $families, 0);
        $insert_featureprop_fr->execute($gene_id, $family_representative, 0);
        foreach my $family (keys %{$gene2families{$gene_id}}) {
            $insert_gene_family_assignment->execute($gene_id, $family);
        }
    }
    else {
            my $gf_featureprop_id = $conn->selectrow_array("SELECT featureprop_id FROM featureprop WHERE feature_id=$gene_id AND value='$families' AND type_id=$gene_family_id LIMIT 1;");
            # does it exist?
            if ( !$gf_featureprop_id ) {
                my $max_rank = $conn->selectrow_array("SELECT max(rank) FROM featureprop WHERE feature_id=$gene_id AND type_id=$gene_family_id;");
                if( !( defined $max_rank ) ) {
                        $insert_featureprop_gf->execute($gene_id, $families, 0);
                } else {
                        $insert_featureprop_gf->execute($gene_id, $families, $max_rank+1);
                }
            }

            my $fr_featureprop_id = $conn->selectrow_array("SELECT featureprop_id FROM featureprop WHERE feature_id=$gene_id AND value='$families' AND type_id=$family_representative_id LIMIT 1;");
            # does it exist?
            if ( !$fr_featureprop_id ) {
                my $max_rank = $conn->selectrow_array("SELECT max(rank) FROM featureprop WHERE feature_id=$gene_id AND type_id=$family_representative_id;");
                if( !( defined $max_rank ) ) {
                        $insert_featureprop_fr->execute($gene_id, $families, 0);
                } else {
                        $insert_featureprop_fr->execute($gene_id, $families, $max_rank+1);
                }
            }
            foreach my $family (keys %{$gene2families{$gene_id}}) {
                my $gene_family_assignment_id = $conn->selectrow_array("SELECT gene_family_assignment_id FROM gene_family_assignment WHERE gene_id=$gene_id AND family_label='$family' LIMIT 1;");
                if ( !$gene_family_assignment_id ) {
                    $insert_gene_family_assignment->execute($gene_id, $family);
                }
            }
    }
}

print "Committing changes\n";
eval{ $conn->commit() } or Retreat("The commit failed\n");
Disconnect();


