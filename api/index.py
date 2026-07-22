import sys
import os
from pathlib import Path

# Add project root directory to python path
root_dir = str(Path(__file__).parent.parent)
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)

# Import Flask app from backend/server.py
from backend.server import app

# Export app as Vercel serverless function entrypoint
app.debug = False
