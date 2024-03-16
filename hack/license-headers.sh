#!/bin/bash

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )

set -e

cd $SCRIPT_DIR/..

addlicense -f hack/license-header.txt -ignore '**/node_modules/**' -ignore '**/*.js' plugins/*
