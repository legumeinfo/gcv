#!/usr/bin/env perl


use strict;
use warnings;
use Getopt::Long; # get getting command line options
use Pod::Usage; # so the use rknows what's going on


=head1 NAME

gmod_fasta_names.pl - Removes any non-name text from the name line of a fasta file and appends text to the name, if desired.

=head1 SYNOPSIS

    gmod_fasta_names.pl <fasta_file)

    --outfile   The file to write the output to
    --append    Text to be appended to the names
    --names     Pieces of names to be saved

=head1 DESCRIPTION

If the --outfile flag is not provided then the output will be written to stdout.

The argument to the --append flag will be appended to the end of every name in the file.

The --names flag aught to be used so all the content in the name lines doesn't get delete. This flag takes a comma seperated list (NO SPACES!) of parts of names that will be used to identify all the different names in the file. This seems to be the most robust way to seperate the names from other content when parsing many files.

=cut


# see if the user needs help
my $man = 0;
my $help = 0;
GetOptions('help|?' => \$help, man => \$man) or pod2usage(2);
pod2usage(1) if $help;
pod2usage(-exitval => 0, -verbose => 2) if $man;


# get the command line options
my ($outfile, $names);
my $append = "";

GetOptions("outfile=s"  => \$outfile,
           "append=s"   => \$append,
           "names=s"    => \$names) || die("Error in command line arguments\n");

my @names = split(",", $names) if ($names);


# make sure we only have one input file
if (@ARGV != 1) {
    pod2usage(2);
}


# open the fasta file
open(FILE, $ARGV[0]) || die("Failed to read input file\n");


# if we have an output file
sub deliver { print(@_); };
if ($outfile) {
    open(OUTFILE, '>'.$outfile) || die("Failed to open output file: $!\n");
    *deliver = sub { return print(OUTFILE @_); };
}


# read the file one line at a time
while (my $line = <FILE>) {
    chomp $line;
    # don't process anything that's not a description line
    if (index($line, '>') == -1) {
        deliver($line."\n");
        next;
    }
    # fix up the name
    my @pieces = split(" ", $line);
    # get the contig if there is one
    my $new_line;
    if ($names) {
        foreach my $name (@names) {
            foreach my $piece (@pieces) {
                if (index($piece, $name) != -1) {
                    my @subpieces = split(/\|/, $piece);
                    foreach my $sub (@subpieces) {
                        $new_line = $sub if (index($sub, $name) != -1 and index($sub, ".") != -1);
                    }
                }
            }
        }
    }
    if ($new_line) {
        $line = ">".$new_line;
    }
    else {
        $line = $pieces[0];
    }
    # and send it on it's way
    deliver($line."\n");
}


# close all the open files
close(FILE);
close(OUTFILE) if $outfile;


