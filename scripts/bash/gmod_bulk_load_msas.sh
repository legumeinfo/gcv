#!/bin/bash

for f in `ls`; do echo "Loading $f"; gmod_load_msa.pl $f --errorfile $f"_errors.txt"; done
