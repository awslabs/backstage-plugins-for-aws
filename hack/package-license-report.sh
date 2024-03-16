#!/bin/bash

set -e

package_name=$LERNA_PACKAGE_NAME

file_suffix=${package_name##*/}

outdir="$LERNA_ROOT_PATH/license-reports"

mkdir -p $outdir

license-report --output csv > $outdir/licenses-${file_suffix}.txt
