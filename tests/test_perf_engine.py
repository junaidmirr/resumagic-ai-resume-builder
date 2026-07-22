import unittest
import time
import os
import sys

# Ensure backend directory is in python path
backend_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "backend")
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from perf_engine import PerformanceEngine


class TestPerformanceEngine(unittest.TestCase):
    def setUp(self):
        self.test_log_file = "test_performance_metrics.txt"
        self.engine = PerformanceEngine(log_file_path=self.test_log_file, monitor_interval_sec=1)

    def tearDown(self):
        self.engine.stop_background_monitoring()
        full_path = self.engine.log_file_path
        if os.path.exists(full_path):
            try:
                os.remove(full_path)
            except Exception:
                pass

    def test_record_metric_and_logs(self):
        self.engine.record_metric(
            category="TEST_RUN",
            name="test_function",
            duration_ms=123.45,
            in_bytes=500,
            out_bytes=2000,
            extra_info="Status: OK"
        )
        stats = self.engine.get_summary_stats()
        self.assertEqual(stats["total_requests"], 1)
        self.assertIn("test_function", stats["endpoints"])
        self.assertEqual(stats["endpoints"]["test_function"]["count"], 1)

        logs = self.engine.get_recent_log_entries(max_lines=10)
        self.assertTrue(any("TEST_RUN" in line for line in logs))
        self.assertTrue(any("test_function" in line for line in logs))

    def test_track_block_context_manager(self):
        with self.engine.track_block("sample_block"):
            time.sleep(0.05)

        stats = self.engine.get_summary_stats()
        self.assertIn("sample_block", stats["endpoints"])
        self.assertGreater(stats["endpoints"]["sample_block"]["avg_ms"], 40.0)

    def test_track_func_decorator(self):
        @self.engine.track_func("custom_decorated_function")
        def dummy_function():
            return "done"

        res = dummy_function()
        self.assertEqual(res, "done")

        stats = self.engine.get_summary_stats()
        self.assertIn("custom_decorated_function", stats["endpoints"])


if __name__ == '__main__':
    unittest.main()
