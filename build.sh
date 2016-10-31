#!/bin/bash
git checkout gh-pages
npm build
git add index.html
git add dist/*
git commit -m "Updated dist"
git push origin gh-pages