#!/bin/bash

for f in `ls`; do echo "Loading $f"; gmod_bulk_load_gff3.pl --organism "$@" --fastafile $f; done
