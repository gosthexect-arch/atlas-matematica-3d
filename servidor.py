#!/usr/bin/env python3
"""Servidor local do Atlas da Matemática 3D.

Funciona em Windows, macOS e Linux só com o Python 3 padrão (nenhuma instalação extra).
Uso:  python servidor.py [porta] [--sem-navegador]
"""
import functools
import http.server
import os
import socket
import sys
import webbrowser

PASTA = os.path.dirname(os.path.abspath(__file__))
args = [a for a in sys.argv[1:] if not a.startswith('--')]
PORTA_INICIAL = int(args[0]) if args else 8000
ABRIR = '--sem-navegador' not in sys.argv


class Handler(http.server.SimpleHTTPRequestHandler):
    # Alguns Windows registram .js como text/plain, e o navegador recusa módulos assim.
    extensions_map = {
        **http.server.SimpleHTTPRequestHandler.extensions_map,
        '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css',
        '.html': 'text/html; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml',
    }

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()

    def log_message(self, *a):
        pass  # terminal limpo


def porta_livre(inicio):
    for p in range(inicio, inicio + 50):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            if s.connect_ex(('127.0.0.1', p)) != 0:
                return p
    raise SystemExit('Nenhuma porta livre entre %d e %d.' % (inicio, inicio + 49))


if __name__ == '__main__':
    porta = porta_livre(PORTA_INICIAL)
    url = 'http://localhost:%d/' % porta
    servidor = http.server.ThreadingHTTPServer(('127.0.0.1', porta), functools.partial(Handler, directory=PASTA))
    print('Atlas da Matemática 3D rodando em %s' % url)
    print('Para parar, feche esta janela ou aperte Ctrl+C.')
    if ABRIR:
        webbrowser.open(url)
    try:
        servidor.serve_forever()
    except KeyboardInterrupt:
        print('\nServidor encerrado.')
