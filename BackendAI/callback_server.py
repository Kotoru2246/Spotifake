from http.server import HTTPServer, BaseHTTPRequestHandler
import threading
from urllib.parse import urlparse, parse_qs
import webbrowser

# Global variable to store the auth code
auth_code = None
server_instance = None

class CallbackHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        global auth_code
        
        # Parse the query parameters
        parsed_url = urlparse(self.path)
        query_params = parse_qs(parsed_url.query)
        
        print(f"Callback received at {self.path}")
        print(f"Query params: {query_params}")
        
        # Extract the authorization code
        if 'code' in query_params:
            auth_code = query_params['code'][0]
            print(f"Auth code captured: {auth_code[:20]}...")
            
            self.send_response(200)
            self.send_header('Content-type', 'text/html; charset=utf-8')
            self.end_headers()
            html = """
            <html>
            <head><title>Spotify Authorization Successful</title></head>
            <body style="background: #191414; color: #1DB954; font-family: Arial; text-align: center; padding: 50px;">
                <h1>Authorization Successful!</h1>
                <p>You can now close this window and return to the Music Player app.</p>
            </body>
            </html>
            """
            self.wfile.write(html.encode('utf-8'))
        else:
            print(f"ERROR: No code in query params: {query_params}")
            self.send_response(400)
            self.send_header('Content-type', 'text/html')
            self.end_headers()
            self.wfile.write(b"<html><body>Error: No authorization code received</body></html>")
    
    def log_message(self, format, *args):
        # Suppress default logging
        pass

def start_callback_server(port=8888):
    """Start the redirect callback server in a background thread."""
    global server_instance
    
    server = HTTPServer(('127.0.0.1', port), CallbackHandler)
    server_instance = server
    
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.daemon = True
    thread.start()
    
    print(f"Callback server started on http://127.0.0.1:{port}")
    return server

def stop_callback_server():
    """Stop the redirect callback server."""
    global server_instance
    if server_instance:
        server_instance.shutdown()
        server_instance = None

def get_auth_code():
    """Get the authorization code that was captured."""
    global auth_code
    return auth_code

def reset_auth_code():
    """Reset the auth code for the next authorization."""
    global auth_code
    auth_code = None
