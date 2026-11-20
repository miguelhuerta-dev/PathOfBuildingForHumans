#!/usr/bin/env bash
# Prepares src-tauri/engine for development on Linux or macOS:
#   - Path of Building Community at the pinned tag, without its images
#   - LuaJIT at the pinned commit
#   - the lua-utf8 C module
# On Windows use scripts/setup-engine.ps1 (also used by .github/workflows/desktop.yml).
#
# Usage: scripts/setup-engine.sh            (downloads sources)
#        POB_SOURCE=/path/to/PathOfBuilding scripts/setup-engine.sh   (reuses a local clone)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENGINE="$ROOT/src-tauri/engine"
LOCK="$ENGINE/engine.lock.json"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

pin() { python3 -c "import json,sys; print(json.load(open('$LOCK'))$1)"; }
POB_TAG="$(pin "['pathOfBuilding']['tag']")"
LUAJIT_COMMIT="$(pin "['luajit']['commit']")"
LUAUTF8_TAG="$(pin "['luautf8']['tag']")"

echo "Path of Building $POB_TAG"
if [ -n "${POB_SOURCE:-}" ]; then
  POB="$POB_SOURCE"
else
  POB="$WORK/pob"
  GIT_LFS_SKIP_SMUDGE=1 git clone -q --depth 1 --branch "$POB_TAG" \
    https://github.com/PathOfBuildingCommunity/PathOfBuilding "$POB"
fi

rm -rf "$ENGINE/pob"
mkdir -p "$ENGINE/pob/runtime"
# The headless engine never draws, so tree and item images are left out (~430 MB).
tar -C "$POB" --exclude='*.png' --exclude='*.jpg' --exclude='*.webp' -cf - src | tar -C "$ENGINE/pob" -xf -
cp -R "$POB/runtime/lua" "$ENGINE/pob/runtime/lua"
cp "$POB/LICENSE.md" "$ENGINE/pob/LICENSE.md"

echo "LuaJIT $LUAJIT_COMMIT"
git clone -q https://github.com/LuaJIT/LuaJIT "$WORK/luajit"
git -C "$WORK/luajit" checkout -q "$LUAJIT_COMMIT"
make -C "$WORK/luajit" -j"$(getconf _NPROCESSORS_ONLN 2>/dev/null || echo 4)" >/dev/null
cp "$WORK/luajit/src/luajit" "$ENGINE/luajit"

echo "lua-utf8 $LUAUTF8_TAG"
git clone -q --depth 1 --branch "$LUAUTF8_TAG" https://github.com/starwing/luautf8 "$WORK/luautf8"
case "$(uname -s)" in
  Darwin) cc -O2 -bundle -undefined dynamic_lookup -I"$WORK/luajit/src" "$WORK/luautf8/lutf8lib.c" -o "$ENGINE/lua-utf8.so" ;;
  *) cc -O2 -shared -fPIC -I"$WORK/luajit/src" "$WORK/luautf8/lutf8lib.c" -o "$ENGINE/lua-utf8.so" ;;
esac

echo "Engine ready in $ENGINE ($(du -sh "$ENGINE" | cut -f1))"
