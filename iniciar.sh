#!/bin/sh
# Inicia o Atlas da Matemática 3D no macOS ou Linux:  ./iniciar.sh
cd "$(dirname "$0")" || exit 1
if command -v python3 >/dev/null 2>&1; then exec python3 servidor.py "$@"; fi
if command -v python >/dev/null 2>&1; then exec python servidor.py "$@"; fi
if command -v npx >/dev/null 2>&1; then exec npx --yes http-server -c-1 -o; fi
echo "Não encontrei o Python 3 nem o Node.js."
echo "Instale o Python 3 (https://www.python.org/downloads/) e rode ./iniciar.sh de novo."
exit 1
