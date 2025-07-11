#!/usr/bin/env python3
"""
Simple HTTP server to test pressure-sensitive drawing implementation
"""

import http.server
import socketserver
import os

PORT = 8080

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Add CORS headers
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

# Change to the project directory
os.chdir(os.path.dirname(os.path.abspath(__file__)))

print(f"Starting server on http://localhost:{PORT}")
print(f"Open http://localhost:{PORT}/pressure-test.html to test pressure-sensitive drawing")
print("Press Ctrl+C to stop the server")

with socketserver.TCPServer(("", PORT), MyHTTPRequestHandler) as httpd:
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nServer stopped.")