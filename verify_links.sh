#!/bin/bash

urls=$(grep -oP '\[img\]\K[^\[]+' portfolio_links.txt)

for url in $urls; do
    status_code=$(curl -s -o /dev/null -w "%{http_code}" "$url")
    if [ "$status_code" -eq 200 ]; then
        echo "$url - OK"
    else
        echo "$url - FAILED with status code $status_code"
    fi
done
