#!/bin/bash

for f in `ls *.gff3 *.gff3.sorted`; do echo "Loading $f"; gmod_bulk_load_gff3.pl --organism "$@" --analysis --noexon --gfffile $f; done
