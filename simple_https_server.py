#!/usr/bin/env python3
import ssl
import http.server
import socketserver

PORT = 8443

Handler = http.server.SimpleHTTPRequestHandler

httpd = socketserver.TCPServer(("", PORT), Handler)
httpd.socket = ssl.wrap_socket(httpd.socket, 
                               keyfile="key.pem", 
                               certfile="cert.pem", 
                               server_side=True)

print(f"HTTPS Server running on https://localhost:{PORT}")
print(f"Snake Game available at: https://localhost:{PORT}/snake-game.html")
print("Press Ctrl+C to stop the server")

httpd.serve_forever()