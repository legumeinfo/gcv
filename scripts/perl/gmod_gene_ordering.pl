#!/usr/bin/env perl


use strict;
use warnings;
use Getopt::Long; # get the command line options
use Pod::Usage; # so the user knows what's going on
use DBI; # our DataBase Interface
use Cwd 'abs_path'; # for executing the indexing script


=head1 NAME

gmod_gene_ordering.pl - Orders all the genes in the database by their order on their respective chromosomes in the gene_order table.

=head1 SYNOPSIS

  gmod_gene_ordering.pl [options]

  --nuke        Removes all previous gene ordering entries from gene_order
  --dbname      The name of the chado database (default=chado)
  --username    The username to access the database with (default=chado)
  --password    The password to log into the database with
  --host        The host the database is on (default=localhost)
  --port        The port the database is on

=head1 DESCRIPTION

Each gene on a chromosome will be given an entry in the gene_order table. The feature_id value will be that of the gene and the value will be the gene's ordering number.

If the --nuke flag is given all previous gene ordering entries in the gene_order table will be deleted.

A new entry will not be made in the gene_order table for a gene if an entry already exists for that gene and chromosome.

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

# see if the user needs help
my $man = 0;
my $help = 0;

GetOptions("nuke|?"             => \$nuke,
           "dbname=s"           => \$dbname,
           "username=s"         => \$username,
           "password=s"         => \$password,
           "host=s"             => \$host,
           "port=i"             => \$port,
           "help|?"             => \$help,
           "man"                => \$man,
           ) || pod2usage(2);
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

print "Fetching preliminaries\n";

# get the chromsome cvterm
my $chromosome_id = $conn->selectrow_array("SELECT cvterm_id FROM cvterm WHERE name='chromosome' and cv_id = (select cv_id from cv where name='sequence');");
# does it exist?
if( !$chromosome_id ) {
    Retreat("Failed to retrieve the chromosome cvterm entry\n");
}

# get the supercontig cvterm
my $supercontig_id = $conn->selectrow_array("SELECT cvterm_id FROM cvterm WHERE name='supercontig' and cv_id = (select cv_id from cv where name='sequence');");
# does it exist?
if( !$supercontig_id ) {
    Retreat("Failed to retrieve the supercontig cvterm entry\n");
}

# get the gene cvterm
my $gene_id = $conn->selectrow_array("SELECT cvterm_id FROM cvterm WHERE name='gene' and cv_id = (select cv_id from cv where name='sequence');");
# does it exist?
if( !$gene_id ) {
    Retreat("Failed to retrieve the gene cvterm entry\n");
}

# make sure the helper table exists
if( !$conn->do("CREATE TABLE IF NOT EXISTS gene_order(gene_order_id SERIAL PRIMARY KEY, chromosome_id INTEGER NOT NULL REFERENCES feature(feature_id), gene_id INTEGER UNIQUE NOT NULL REFERENCES feature(feature_id), number INTEGER NOT NULL, CONSTRAINT gene_order_c1 UNIQUE(chromosome_id, number), CONSTRAINT gene_order_gene_id_key UNIQUE(gene_id))") ) {
    Retreat("Failed to verify or create the gene_order table\n");
}


# nuke the old gene_order entries... if we're supposed to
if( $nuke ) {
    print "Deleting old entries\n";
    if( !$conn->do("DELETE FROM gene_order;") ) {
        Retreat("Failed to delete current entries in the gene_order table\n");
    }
}

# get all the chromosomes from the database
my $query_string = "SELECT feature_id FROM feature WHERE type_id in ($chromosome_id,$supercontig_id);";
$query = $conn->prepare($query_string);
$query->execute();
# get all the genes for each chromosome add give them an ordering via the gene_order table
while( my ($chromosome_id) = $query->fetchrow_array() ) {
    print "Ordering genes of chromsome $chromosome_id\n";
    # get the gene ids ordered by their position on the chromosome
    $query_string = "SELECT DISTINCT fl.feature_id, fl.fmin FROM featureloc fl, feature f WHERE fl.feature_id=f.feature_id AND f.type_id=$gene_id AND fl.srcfeature_id=$chromosome_id ORDER BY fmin ASC;";
    my $gene_query = $conn->prepare($query_string);
    $gene_query->execute();
    print "    num featurelocs: " . $gene_query->rows() . "\n";
    if( $gene_query->rows() == 0 ) {
        next;
    }
    # add an entry to the gene_order table for each gene
    my $insert_gene_order = $conn->prepare("INSERT INTO gene_order (chromosome_id, gene_id, number) VALUES(?, ?, ?);");
    my $pos = 1;
    while( my ($gene, $fmin) = $gene_query->fetchrow_array() ) {
        my $gene_order_id = $conn->selectrow_array("SELECT gene_order_id FROM gene_order WHERE gene_id=$gene;");
        # does it exist?
        if ( !$gene_order_id ) {
            $insert_gene_order->execute($chromosome_id, $gene, $pos);
            $pos++;
        }
    }
}


print "Committing changes\n";
eval{ $conn->commit() } or Retreat("The commit failed\n");
Disconnect();



