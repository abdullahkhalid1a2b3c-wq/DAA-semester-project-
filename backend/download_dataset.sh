#!/bin/bash

URL="https://snap.stanford.edu/data/roadNet-CA.txt.gz"
GZ_PATH="dataset/roadNet-CA.txt.gz"
TXT_PATH="dataset/roadNet-CA.txt"

mkdir -p dataset

if [ ! -f "$TXT_PATH" ]; then
    if [ ! -f "$GZ_PATH" ]; then
        echo "Downloading $URL..."
        curl -o "$GZ_PATH" "$URL"
        echo "Download complete."
    fi
    echo "Extracting $GZ_PATH..."
    gunzip -k "$GZ_PATH"
    echo "Extraction complete."
else
    echo "$TXT_PATH already exists."
fi
