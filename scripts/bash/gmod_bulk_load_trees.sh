#!/bin/bash

for f in `ls`; do echo "Loading $f"; gmod_load_tree.pl $f --dbid "$@" --errorfile $f"_errors.txt"; done
