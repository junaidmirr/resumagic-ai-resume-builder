import os
import sys
import importlib.util

# Load backend/perf_engine.py directly by path to avoid name collisions / circular imports
_backend_perf_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "backend", "perf_engine.py")
if os.path.exists(_backend_perf_path):
    _spec = importlib.util.spec_from_file_location("_backend_perf_engine_mod", _backend_perf_path)
    _mod = importlib.util.module_from_spec(_spec)
    _spec.loader.exec_module(_mod)
    PerformanceEngine = _mod.PerformanceEngine
    perf_engine = _mod.perf_engine
else:
    class DummyPerfEngine:
        def init_app(self, app): pass
        def get_summary_stats(self): return {}
        def get_recent_log_entries(self, max_lines=50): return []
    PerformanceEngine = DummyPerfEngine
    perf_engine = DummyPerfEngine()

__all__ = ["PerformanceEngine", "perf_engine"]
