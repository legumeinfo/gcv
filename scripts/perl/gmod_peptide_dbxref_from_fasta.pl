#!/usr/bin/env perl


use strict;
use warnings;
use Getopt::Long; # for command line options
use Pod::Usage; # so the user knows what's going on
use DBI; # our Data Base Interface


=head1 NAME

gmod_peptide_dbxref_from_fasta.pl - Creates entries in the dbxref table for peptide PAC ids from a fasta file.

=head1 SYNOPSIS

    gmod_peptide_dbxref_from_fasta.pl <fasta_file> [options]

    --dbid        The unique identifier of the db the dbxref should be created with
    --dbname    The name of the chade database (defule=chado)
    --username  The username to access the database with (default=chado)
    --password  The password to log into the database with
    --host      The host the database is on (default=localhost)
    --port      The port the database is on

=head1 DESCRIPTION

The --dbid flag should be provided. This is the unique identifier of the db entry that the new dbxref entries should be created with respect to.

=head1 AUTHO

Alan Cleary

Copyright (c) 2013
This library is free software; you can redistribute it and/or modify it under the same terms as Perl itself.

=cut


# see if the user needs help
my $man = 0;
my $help = 0;
GetOptions('help|?' => \$help, man => \$man) or pod2usage(2);
pod2usage(1) if $help;
pod2usage(-exitval => 0, -verbose => 2) if $man;


# get the command line options
my $db;
my $dbname = 'chado';
$dbname = $ENV{CHADO_DB_NAME} if ($ENV{CHADO_DB_NAME});
my $username = 'chado';
$username = $ENV{CHADO_DB_USER} if ($ENV{CHADO_DB_USER});
my $password = '';
$password = $ENV{CHADO_DB_PASS} if ($ENV{CHADO_DB_PASS});
my $host = 'localhost';
$host = $ENV{CHADO_DB_HOST} if ($ENV{CHADO_DB_HOST});
my $port;
$port = $ENV{CHADO_DB_PORT} if ($ENV{CHADO_DB_PORT});

GetOptions("dbid=s" => \$db,
           "dbname=s"   => \$dbname,
           "username=s" => \$username,
           "password=s" => \$password,
           "host=s"     => \$host,
           "port=i"     => \$port) || die("Error in command line arguments\n");

if (!$db) {
    die("dbid is a required command line argument\n");
}


# make sure we have a fasta file
if (@ARGV != 1) {
    pod2usage(2);
    #die("Usage: gmod_polypeptide_dbxref_from_fasta.pl --dbid <a db table entry identifier>\n");
}


# creat a data source name
my $dsn = "dbi:Pg:dbname=$dbname;host=$host;";
$dsn .= "port=$port;" if ($port);


# connect to the database
my $conn = DBI->connect($dsn, $username, $password, {'RaiseError' => 1});


# open the fasta file
open(FILE, $ARGV[0]) || die("Failed to read input file: $!\n");


# let the user know something is happening
print "Updating polypeptides...\n";


# read the file one line at a time
my @lost = (); # polypeptides that were not in the database
my @found = (); # polypeptides that were in the database
while (my $line = <FILE>) {
    chomp $line;
    # don't process anything that's not a description line
    next if (index($line, '>') == -1);
    # seperate the feature name and the pacid
    my ($name, $id) = split('PAC', $line);
    # get just the name
    $name = substr($name, 1, length($name)-2);
    # extract the PACID
    my ($pacid) = $id =~ /(\d+)/;
    # jump ahead if the there's no pacid
    next if (!$pacid);
    # append _pep to the feature name if it's not present
    $name .= "_pep" if (index($name, "_pep") == -1);
    # get the polypeptide feature
    my $pep = $conn->selectrow_array("SELECT feature_id FROM feature WHERE uniquename='$name';");
    # if the feature actually exists
    if ($pep) {
        # fix up the PACID
        $pacid = "PAC:" . $pacid;
        # say we've found it
        push(@found, $name);
        # check to see if a dbxref entry already exists
        my $dbxref = $conn->selectrow_array("SELECT dbxref_id FROM dbxref WHERE db_id=$db AND accession='$pacid' AND version='1';");
        if ($dbxref) {
            # ok, check if a feature_dbxref already exists as well
            my $featurexref = $conn->selectrow_array("SELECT feature_dbxref_id FROM feature_dbxref WHERE feature_id=$pep AND dbxref_id=$dbxref;");
            if ($featurexref) {
                # it does, but lets set the primary dbxref_id for the feature just to be certain
                if (!$conn->do("UPDATE feature SET dbxref_id=$dbxref WHERE feature_id=$pep;")) {
                    print "Failed to update primary dbxref to $dbxref from existing feature_dbxref for feature $pep\n";
                }
            }
            else {
                # create a new feature_dbxref
                if ($conn->do("INSERT INTO feature_dbxref (feature_id, dbxref_id) VALUES ($pep, $dbxref);")) {
                    # now make it the primary dbxref for the feature
                    if (!$conn->do("UPDATE feature SET dbxref_id=$dbxref WHERE feature_id=$pep;")) {
                        print "Failed to update primary dbxref to $dbxref for feature $pep\n";
                    }
                }
                else {
                    print "Failed to add feature_dbxref entry for feature $pep and existing dbxref $dbxref\n";
                }
            }
        }
        else {
            # create a new dbxref entry
            if ($conn->do("INSERT INTO dbxref (db_id, accession, version) VALUES ($db, '$pacid', '1');")) {
                # get the new entry's id
                my $dbxref = $conn->selectrow_array("SELECT dbxref_id FROM dbxref WHERE db_id=$db AND accession='$pacid' AND version='1';");
                # create a feature_dbxref entry for the new dbxref
                if ($conn->do("INSERT INTO feature_dbxref (feature_id, dbxref_id) VALUES ($pep, $dbxref);")) {
                    # update the feature's primary dbxref to be the new one
                    if (!$conn->do("UPDATE feature SET dbxref_id=$dbxref WHERE feature_id=$pep;")) {
                        print "Failed to update primary dbxref to $dbxref for feature $pep\n";
                    }
                }
                else {
                    print "Failed to add feature_dbxref entry for feature $pep and dbxref $dbxref\n";
                }
            }
            else {
                print "Failed to create dbxref for feature $pacid\n"
            }
        }
    }
    else {
        push(@lost, $name);
    }
}


# notify the user of how things went - this could be written to a file if desired
print "", scalar(@found), " polypeptides found and updated\n", scalar(@lost), " were not found\n";


# close all open files
close(FILE);


