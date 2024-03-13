#!/bin/bash

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )

set -e

LERNA_ROOT_PATH=$SCRIPT_DIR/.. LERNA_PACKAGE_NAME=root bash $SCRIPT_DIR/package-license-report.sh

#lerna exec -- 'bash $LERNA_ROOT_PATH/hack/package-license-report.sh'
