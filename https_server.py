#!/usr/bin/env python3
import http.server
import ssl
import socketserver
import os

# Create HTTPS server
class HTTPServer(socketserver.TCPServer):
    def __init__(self, server_address, RequestHandlerClass):
        super().__init__(server_address, RequestHandlerClass)
        self.socket = ssl.wrap_socket(self.socket, 
                                     certfile='cert.pem', 
                                     keyfile='key.pem', 
                                     server_side=True)

# Create handler
Handler = http.server.SimpleHTTPRequestHandler

# Create server
with HTTPServer(("0.0.0.0", 8443), Handler) as httpd:
    print("HTTPS Server running on https://localhost:8443")
    print("Snake Game available at: https://localhost:8443/snake-game.html")
    print("Press Ctrl+C to stop the server")
    httpd.serve_forever()