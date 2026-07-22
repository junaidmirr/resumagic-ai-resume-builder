import time
import os
import sys
import threading
import logging
from typing import Dict, Any, List, Optional
from functools import wraps
from contextlib import contextmanager

import tempfile

# Try psutil for detailed RAM/CPU tracking, fall back to resource/os
try:
    import psutil
    HAS_PSUTIL = True
except ImportError:
    HAS_PSUTIL = False

try:
    import resource
    HAS_RESOURCE = True
except ImportError:
    HAS_RESOURCE = False


class PerformanceEngine:
    """
    Python Performance Measurement Engine
    Tracks app loading times, endpoint latency, RAM memory usage,
    network request/response payload sizes, and system resource snapshots.
    Continuously appends structured records to a text log file.
    """

    def __init__(self, log_file_path: Optional[str] = None, monitor_interval_sec: int = 15):
        # Default to OS temp directory to prevent local dev server file watchers (Vite HMR) from re-triggering page refreshes
        if not log_file_path:
            self.log_file_path = os.path.join(tempfile.gettempdir(), "resumagic_performance_metrics.txt")
        elif os.path.isabs(log_file_path):
            self.log_file_path = log_file_path
        else:
            self.log_file_path = os.path.join(tempfile.gettempdir(), log_file_path)

        self.monitor_interval_sec = monitor_interval_sec
        self._lock = threading.RLock()

        # Performance metrics accumulators
        self.total_requests: int = 0
        self.total_response_time_ms: float = 0.0
        self.endpoint_stats: Dict[str, Dict[str, Any]] = {}
        self.slow_requests_count: int = 0

        # Background monitoring thread
        self._stop_monitor = threading.Event()
        self._monitor_thread: Optional[threading.Thread] = None

        # Write initial engine start marker
        self._write_log("=" * 80)
        self._write_log(f"🚀 Performance Measurement Engine Initialized at {time.strftime('%Y-%m-%d %H:%M:%S')}")
        self._write_log(f"   Log Destination: {self.log_file_path}")
        self._write_log(f"   psutil Available: {HAS_PSUTIL} | resource Available: {HAS_RESOURCE}")
        self._write_log("=" * 80)

        # Start periodic background system monitor thread
        self.start_background_monitoring()

    def _get_ram_usage_mb(self) -> float:
        """Returns current process RAM usage (RSS) in Megabytes."""
        try:
            if HAS_PSUTIL:
                process = psutil.Process(os.getpid())
                return process.memory_info().rss / (1024 * 1024)
            elif HAS_RESOURCE:
                # ru_maxrss is in KB on Linux, Bytes on macOS
                maxrss = resource.getrusage(resource.RUSAGE_SELF).ru_maxrss
                if sys.platform == "darwin":
                    return maxrss / (1024 * 1024)
                else:
                    return maxrss / 1024
        except Exception:
            pass
        return 0.0

    def _get_system_memory_percent(self) -> float:
        """Returns system-wide RAM usage percentage."""
        try:
            if HAS_PSUTIL:
                return psutil.virtual_memory().percent
        except Exception:
            pass
        return 0.0

    def _get_cpu_percent(self) -> float:
        """Returns process CPU usage percentage."""
        try:
            if HAS_PSUTIL:
                process = psutil.Process(os.getpid())
                return process.cpu_percent(interval=None)
        except Exception:
            pass
        return 0.0

    def _write_log(self, message: str):
        """Appends a timestamped log entry to the text log file in a thread-safe manner."""
        timestamp = time.strftime("%Y-%m-%d %H:%M:%S")
        formatted_entry = f"[{timestamp}] {message}\n"
        with self._lock:
            try:
                with open(self.log_file_path, "a", encoding="utf-8") as f:
                    f.write(formatted_entry)
            except Exception as e:
                print(f"[PerfEngine Error] Failed to write to log file: {e}", file=sys.stderr)

    def record_metric(self, category: str, name: str, duration_ms: float,
                      ram_mb: Optional[float] = None, in_bytes: int = 0,
                      out_bytes: int = 0, extra_info: Optional[str] = None):
        """Record an explicit performance metric entry."""
        ram = ram_mb if ram_mb is not None else self._get_ram_usage_mb()
        sys_ram_pct = self._get_system_memory_percent()

        log_line = (
            f"[{category.upper()}] {name} | Duration: {duration_ms:.2f} ms | "
            f"Process RAM: {ram:.2f} MB (Sys RAM: {sys_ram_pct:.1f}%) | "
            f"In: {in_bytes:,} B | Out: {out_bytes:,} B"
        )
        if extra_info:
            log_line += f" | {extra_info}"

        self._write_log(log_line)

        # Update in-memory accumulators
        with self._lock:
            self.total_requests += 1
            self.total_response_time_ms += duration_ms
            if duration_ms > 1000.0:  # Mark request over 1 second as slow
                self.slow_requests_count += 1

            if name not in self.endpoint_stats:
                self.endpoint_stats[name] = {
                    "count": 0,
                    "total_ms": 0.0,
                    "min_ms": float("inf"),
                    "max_ms": 0.0,
                    "avg_ms": 0.0,
                    "last_ram_mb": ram
                }

            stat = self.endpoint_stats[name]
            stat["count"] += 1
            stat["total_ms"] += duration_ms
            stat["min_ms"] = min(stat["min_ms"], duration_ms)
            stat["max_ms"] = max(stat["max_ms"], duration_ms)
            stat["avg_ms"] = stat["total_ms"] / stat["count"]
            stat["last_ram_mb"] = ram

    @contextmanager
    def track_block(self, block_name: str, extra_info: Optional[str] = None):
        """Context manager to measure execution time and RAM delta of any code block."""
        start_time = time.perf_counter()
        ram_before = self._get_ram_usage_mb()
        try:
            yield
        finally:
            elapsed_ms = (time.perf_counter() - start_time) * 1000.0
            ram_after = self._get_ram_usage_mb()
            ram_delta = ram_after - ram_before
            info = f"RAM Delta: {ram_delta:+.2f} MB"
            if extra_info:
                info += f" | {extra_info}"
            self.record_metric("BLOCK_PROFILE", block_name, elapsed_ms, ram_mb=ram_after, extra_info=info)

    def track_func(self, func_name: Optional[str] = None):
        """Decorator to track execution time and memory usage of any Python function."""
        def decorator(func):
            name = func_name or f"{func.__module__}.{func.__qualname__}"
            @wraps(func)
            def wrapper(*args, **kwargs):
                with self.track_block(name):
                    return func(*args, **kwargs)
            return wrapper
        return decorator

    def init_app(self, app):
        """
        Integrates Flask middleware for automatic endpoint timing,
        payload size measurement, and HTTP status logging.
        """
        @app.before_request
        def before_request():
            import flask
            flask.g.perf_start_time = time.perf_counter()
            flask.g.perf_start_ram = self._get_ram_usage_mb()

        @app.after_request
        def after_request(response):
            import flask
            if hasattr(flask.g, 'perf_start_time'):
                duration_ms = (time.perf_counter() - flask.g.perf_start_time) * 1000.0
                endpoint = flask.request.endpoint or flask.request.path
                method = flask.request.method
                name = f"{method} {flask.request.path} ({endpoint})"

                in_bytes = flask.request.content_length or 0
                out_bytes = response.calculate_content_length() or len(response.get_data())

                status = response.status_code
                ram_after = self._get_ram_usage_mb()

                self.record_metric(
                    category="HTTP_REQUEST",
                    name=name,
                    duration_ms=duration_ms,
                    ram_mb=ram_after,
                    in_bytes=in_bytes,
                    out_bytes=out_bytes,
                    extra_info=f"Status: {status}"
                )
            return response

    def _periodic_monitor_loop(self):
        """Background thread function that logs system resource snapshots periodically."""
        while not self._stop_monitor.is_set():
            time.sleep(self.monitor_interval_sec)
            if self._stop_monitor.is_set():
                break

            ram_mb = self._get_ram_usage_mb()
            sys_ram_pct = self._get_system_memory_percent()
            cpu_pct = self._get_cpu_percent()
            active_threads = threading.active_count()

            with self._lock:
                avg_lat = (self.total_response_time_ms / self.total_requests) if self.total_requests > 0 else 0.0
                req_count = self.total_requests
                slow_count = self.slow_requests_count

            snapshot_msg = (
                f"[SYSTEM_SNAPSHOT] Process RAM: {ram_mb:.2f} MB | System RAM: {sys_ram_pct:.1f}% | "
                f"CPU: {cpu_pct:.1f}% | Threads: {active_threads} | "
                f"Total Requests: {req_count} | Avg Latency: {avg_lat:.2f} ms | Slow (>1s): {slow_count}"
            )
            self._write_log(snapshot_msg)

    def start_background_monitoring(self):
        """Starts background system resource monitor thread."""
        if self._monitor_thread is None or not self._monitor_thread.is_alive():
            self._stop_monitor.clear()
            self._monitor_thread = threading.Thread(target=self._periodic_monitor_loop, daemon=True)
            self._monitor_thread.start()

    def stop_background_monitoring(self):
        """Stops background system resource monitor thread."""
        self._stop_monitor.set()
        if self._monitor_thread and self._monitor_thread.is_alive():
            self._monitor_thread.join(timeout=2.0)

    def get_summary_stats(self) -> Dict[str, Any]:
        """Returns JSON-compatible dictionary of current performance metrics."""
        with self._lock:
            avg_ms = (self.total_response_time_ms / self.total_requests) if self.total_requests > 0 else 0.0
            return {
                "process_ram_mb": self._get_ram_usage_mb(),
                "system_ram_percent": self._get_system_memory_percent(),
                "cpu_percent": self._get_cpu_percent(),
                "total_requests": self.total_requests,
                "average_response_time_ms": round(avg_ms, 2),
                "slow_requests_count": self.slow_requests_count,
                "endpoints": self.endpoint_stats,
                "log_file": self.log_file_path
            }

    def get_recent_log_entries(self, max_lines: int = 50) -> List[str]:
        """Reads the last N lines from the performance log file."""
        with self._lock:
            if not os.path.exists(self.log_file_path):
                return ["Log file does not exist yet."]
            try:
                with open(self.log_file_path, "r", encoding="utf-8") as f:
                    lines = f.readlines()
                    return [line.strip() for line in lines[-max_lines:]]
            except Exception as e:
                return [f"Error reading log file: {e}"]


# Global Singleton Instance for convenient import across project modules
perf_engine = PerformanceEngine(log_file_path="performance_metrics.txt", monitor_interval_sec=15)
