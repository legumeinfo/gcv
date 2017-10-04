#!/bin/bash

for f in `ls`; do echo "Loading $f"; gmod_load_ensembl_phyloxml_tree.pl $f --dbid "$@" --name ${f%%.*} --rank 132; done
