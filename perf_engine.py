import os
import sys
from pathlib import Path

# Add backend directory to sys.path
backend_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "backend")
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from perf_engine import PerformanceEngine, perf_engine

__all__ = ["PerformanceEngine", "perf_engine"]
