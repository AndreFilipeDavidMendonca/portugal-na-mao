#!/bin/bash

echo "Pushing frontend..."
cd portugal-na-palma-da-mao || exit
git add .
git commit -m "$1"
git push

echo "Pushing backend..."
cd ../portugal-na-mao-api || exit
git add .
git commit -m "$1"
git push

echo "Done."
