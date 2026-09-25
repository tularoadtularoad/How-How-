#!/usr/bin/env bash
# Полный прогон по всем стволам: смоук, фризы, «висящие» модули. Нужен Chrome/Chromium с WebGL.
set -u
cd "$(dirname "$0")/.."
node build.mjs
for w in weapons/*.html; do
  echo "== $w"
  for t in smoke hitches modules; do node tests/run.mjs "$w" "tests/$t.mjs"; done
done
