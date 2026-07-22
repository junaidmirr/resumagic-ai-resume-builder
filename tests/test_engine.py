import unittest
import os
import threading
from engine import PDFEngine, TextElement, ShapeElement, ImageElement

class TestPDFEngine(unittest.TestCase):
    def setUp(self):
        self.engine = PDFEngine()

    def test_page_crud(self):
        # Initial state: 1 page
        self.assertEqual(self.engine._pages, ["page-1"])
        
        # Add new page
        p2 = self.engine.add_page()
        self.assertEqual(p2, "page-2")
        self.assertEqual(self.engine._pages, ["page-1", "page-2"])
        
        # Add page at index
        p3 = self.engine.add_page(index=0)
        self.assertEqual(p3, "page-3")
        self.assertEqual(self.engine._pages, ["page-3", "page-1", "page-2"])
        
        # Reorder pages
        self.assertTrue(self.engine.reorder_pages(["page-2", "page-3", "page-1"]))
        self.assertEqual(self.engine._pages, ["page-2", "page-3", "page-1"])
        
        # Test cascade delete
        eid1 = self.engine.add_text(0,0,"Hello", page_id="page-3")
        self.assertTrue(self.engine.delete_page("page-3"))
        self.assertNotIn("page-3", self.engine._pages)
        
        # Verify element is gone
        self.assertIsNone(self.engine.get_element(eid1))

    def test_mixed_script_width(self):
        # We simulate this without needing the actual TTF by making the default font Helvetica
        # stringWidth won't crash on standard stringWidth, but we can call chunk_line manually.
        runs = self.engine._chunk_line("Test", "Helvetica", "NotoSans", 12.0)
        self.assertEqual(runs, [("Test", "Helvetica")])
        
    def test_add_element_page_id(self):
        eid = self.engine.add_text(100, 100, "Hello", page_id="page-2")
        el = self.engine.get_element(eid)
        self.assertEqual(el["page_id"], "page-2")
        self.assertIn("page-2", self.engine._pages)

    def test_empty_page_rendering(self):
        self.engine.add_text(10, 10, "A", page_id="page-1")
        self.engine.add_text(10, 10, "C", page_id="page-3")
        self.engine.add_page() # Register empty page (page-2)
        
        # Test rendering to bytes doesn't crash on the empty page
        pdf_bytes = self.engine.render_to_bytes()
        self.assertIsNotNone(pdf_bytes)

    def test_update_element_type_coercion(self):
        eid = self.engine.add_line(0, 0, 10, 10)
        self.engine.update_element(eid, x2="55.5")
        el = self.engine.get_element(eid)
        self.assertEqual(el["x2"], 55.5)
        self.assertIsInstance(el["x2"], float)

    def test_immutable_fields(self):
        eid = self.engine.add_text(100, 100, "Hello")
        self.engine.update_element(eid, element_type="image", id="hacked_id")
        el = self.engine.get_element(eid)
        self.assertEqual(el["element_type"], "text")
        self.assertEqual(el["id"], eid)

    def test_thread_safety(self):
        def worker(engine, n):
            for i in range(n):
                engine.add_text(0, 0, f"Thread text {i}")

        threads = []
        for _ in range(5):
            t = threading.Thread(target=worker, args=(self.engine, 100))
            threads.append(t)
            t.start()

        for t in threads:
            t.join()

        self.assertEqual(len(self.engine._elements), 500)

    def test_limits(self):
        with self.assertRaises(ValueError):
            self.engine.add_text(0, 0, "A" * 25000)

    def test_import_state_atomic_rollback(self):
        self.engine.add_text(10, 10, "Original State")
        original_state = self.engine.export_state()

        invalid_payload = '{"elements": [{"element_type": "text", "text": "Valid"}, "INVALID_NON_DICT"]}'
        result = self.engine.import_state(invalid_payload)
        self.assertFalse(result)
        self.assertEqual(self.engine.export_state(), original_state)

        too_long_payload = f'{{"elements": [{{"element_type": "text", "text": "{"B"*25000}"}}]}}'
        result_too_long = self.engine.import_state(too_long_payload)
        self.assertFalse(result_too_long)
        self.assertEqual(self.engine.export_state(), original_state)

    def test_unspaced_string_dos_wrap(self):
        import time
        long_unspaced = "A" * 5000
        start = time.time()
        lines = self.engine._wrap_text(long_unspaced, 100.0, "Helvetica", "Helvetica", 12.0)
        elapsed = time.time() - start
        self.assertLess(elapsed, 0.5)
        self.assertTrue(len(lines) > 1)

    def test_undo_redo_asset_offloading(self):
        b64_img = "data:image/png;base64," + "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==" * 100
        eid = self.engine.add_image(10, 10, 100, 100, b64_img)
        self.engine.push_undo_snapshot()
        snapshot = self.engine._undo_stack[-1]
        self.assertNotIn(b64_img, snapshot)
        self.assertIn("asset_hash:", snapshot)

        self.engine.update_element_with_undo(eid, x=50.0)
        self.engine.undo()
        el = self.engine.get_element(eid)
        self.assertEqual(el["image_path"], b64_img)

    def test_svg_path_relative_parsing(self):
        rel_path = "m 10 10 l 20 0 v 20 h -20 z"
        eid = self.engine.add_rectangle(0, 0, 100, 100)
        self.engine.update_element(eid, shape_type="path", path_d=rel_path)
        pdf_bytes = self.engine.render_to_bytes()
        self.assertIsNotNone(pdf_bytes)

    def test_defensive_color_parsing(self):
        c1 = self.engine._hex_to_color("invalid_color_string")
        self.assertEqual((c1.red, c1.green, c1.blue, c1.alpha), (0, 0, 0, 1))

        c2 = self.engine._hex_to_color("rgba(255, 128, 0, 0.5)")
        self.assertAlmostEqual(c2.red, 1.0)
        self.assertAlmostEqual(c2.green, 128/255.0)
        self.assertAlmostEqual(c2.blue, 0.0)
        self.assertAlmostEqual(c2.alpha, 0.5)

if __name__ == '__main__':
    unittest.main()
