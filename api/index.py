import sys
import os
from pathlib import Path

# Add backend directory & project root to python path
root_dir = str(Path(__file__).parent.parent)
backend_dir = os.path.join(root_dir, "backend")
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)
if root_dir not in sys.path:
    sys.path.append(root_dir)

# Import Flask app from backend/server.py
from server import app

# Export app as Vercel serverless function entrypoint
app.debug = False
