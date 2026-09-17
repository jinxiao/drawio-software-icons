import base64
import contextlib
import importlib.util
import io
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
from urllib.parse import unquote
import xml.etree.ElementTree as ET
import zlib

ROOT = Path(__file__).resolve().parents[1]


def module(name):
    spec = importlib.util.spec_from_file_location(name, ROOT / "scripts" / f"{name}.py")
    result = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(result)
    return result


build = module("build_libraries")
prepare = module("prepare_catalog")
SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 64"><path fill="#2B85FB" d="M0 0h128v64H0z"/></svg>'


class LibraryTests(unittest.TestCase):
    def test_every_source_geometry_and_path_paint_survives_export(self):
        assets = build.load(ROOT / "data/assets.json")
        for aid, asset in assets.items():
            with self.subTest(icon=aid):
                exported, ratio = build.normalize_svg(asset["svg"])
                source, target = ET.fromstring(asset["svg"]), ET.fromstring(exported)
                self.assertEqual(source.get("viewBox"), target.get("viewBox"))
                # Excludes only the SVG wrapper; no path paint, shape or ordering may change.
                self.assertEqual([(e.tag, e.attrib) for e in source.iter() if e is not source],
                                 [(e.tag, e.attrib) for e in target.iter() if e is not target])
                self.assertGreater(ratio, 0)

    def test_categories_keep_distinct_source_colors(self):
        catalog = build.load(ROOT / "data/catalog.json")
        by_id = {c["source_collection_id"]: c for c in catalog["categories"]}
        for cid, color in {21530: "#2b85fb", 21419: "#4d3cff", 21426: "#63ba4d", 21532: "#6415ff",
                           21533: "#0649d0", 21538: "#04a2b8", 21539: "#ff8a00", 21408: "#ff6a00"}.items():
            self.assertEqual(by_id[cid]["color"], color)
        self.assertIn(27723, by_id)
        for category in catalog["categories"]:
            self.assertEqual(category["total"], sum(category["id"] in e["categories"] for e in catalog["entries"]))

    def test_backup_products_and_unnamed_artboards_are_both_preserved(self):
        self.assertFalse(prepare.is_unnamed("cbs 数据库备份"))
        self.assertFalse(prepare.is_unnamed("hbr 混合云备份"))
        self.assertTrue(prepare.is_unnamed("1备份 15"))
        self.assertTrue(prepare.is_unnamed("画板备份 3"))
        catalog = build.load(ROOT / "data/catalog.json")
        for name in ("cbs 数据库备份", "hbr 混合云备份"):
            entries = [e for e in catalog["entries"] if e["name"] == name]
            self.assertEqual(len(entries), 2, "Keep both colored and orange versions")
            self.assertTrue(all(e["status"] == "named" for e in entries))
        self.assertTrue(any(e["status"] == "unnamed" for e in catalog["entries"]))

    def test_empty_label_preserves_name_and_svg_through_xml_json(self):
        entry = dict(id="test", name='A & B <中文> "引号"', categories=["compute"], status="named", source_url="https://example.com/?a=1&b=2")
        title = '阿里云 · 测试 & "标题" / Test'
        library = ET.fromstring(build.library_xml([build.library_entry(entry, SVG, 2)], title))
        self.assertEqual(library.get("title"), title)
        item = json.loads(library.text)[0]
        obj = ET.fromstring(item["xml"]).find("./root/object")
        self.assertEqual(obj.get("label"), "")
        self.assertEqual(obj.get("iconName"), entry["name"])
        self.assertEqual(item["title"], entry["name"])
        style = obj.find("mxCell").get("style")
        self.assertIn("verticalLabelPosition=bottom;verticalAlign=top;", style)
        self.assertEqual(unquote(style.split("image=data:image/svg+xml,", 1)[1].rstrip(";")), SVG)
        self.assertEqual(item["w"] / item["h"], 2)

    def test_single_configuration_keeps_cross_collection_membership(self):
        cats = [dict(id="a", name="甲", name_en="A"), dict(id="b", name="乙", name_en="B")]
        entry = dict(id="test", name="test", categories=["a", "b"], status="named", source_url="")
        item = build.library_entry(entry, SVG)
        config = build.categorized_configuration(cats, [entry], {"test": item})
        bundle = config["libraries"][0]["entries"][0]
        self.assertIn(bundle["id"], config["defaultLibraries"].split(";"))
        self.assertEqual(len(bundle["libs"]), 2)
        self.assertTrue(bundle["preview"].startswith("data:image/svg+xml;base64,"))
        preview = ET.fromstring(base64.b64decode(bundle["preview"].split(",", 1)[1]))
        ns = {"svg": build.SVG_NS}
        self.assertEqual([e.text for e in preview.findall("./svg:g/svg:text", ns)],
                         ["甲", "1 icons", "乙", "1 icons"])
        self.assertEqual([e.get("fill") for e in preview.findall(".//svg:path", ns)], ["#2B85FB", "#2B85FB"])
        self.assertFalse(any(k.rsplit("}", 1)[-1] in {"href", "src"} for e in preview.iter() for k in e.attrib))
        for palette in bundle["libs"]:
            restored = unquote(zlib.decompress(base64.b64decode(palette["data"][0]["xml"]), -15).decode())
            self.assertEqual(restored, item["xml"])

    def test_unpainted_ui_icons_get_neutral_context_not_brand_recoloring(self):
        svg = SVG.replace('fill="#2B85FB"', 'fill="currentColor"')
        exported, _ = build.normalize_svg(svg)
        self.assertEqual(ET.fromstring(exported).get("color"), "#000000")
        self.assertIn('fill="currentColor"', exported)

    def test_built_category_titles_and_supplemental_last_order_match(self):
        categories = build.load(ROOT / "data/catalog.json")["categories"]
        entries = [dict(id=c["id"], asset=c["id"], name=c["name"], categories=[c["id"]],
                        status="named", source_url=c["source_url"], source_icon_id=i)
                   for i, c in enumerate(categories)]
        # Even if a future source lists UI symbols first, every delivery format puts them last.
        source_categories = [categories[-1], *categories[:-1]]
        catalog = dict(snapshot_date="2026-09-10", categories=source_categories, entries=entries)
        assets = {e["id"]: dict(svg=SVG, colors={"#2b85fb": 1}) for e in entries}
        with tempfile.TemporaryDirectory() as temporary, patch.object(build, "load", side_effect=[catalog, assets]):
            out = Path(temporary)
            with contextlib.redirect_stdout(io.StringIO()):
                build.build(out)
            config = json.loads((out / "config/alibaba-cloud.json").read_text(encoding="utf-8"))
            palettes = config["libraries"][0]["entries"][0]["libs"]
            self.assertEqual(len(palettes), 9)
            self.assertEqual([p["title"]["main"] for p in palettes],
                             [f"阿里云 · {c['name']} / {c['name_en']}" for c in categories])
            for filename in ("summary.json", "catalog.json"):
                generated = json.loads((out / filename).read_text(encoding="utf-8"))
                self.assertEqual([c["id"] for c in generated["categories"]],
                                 [c["id"] for c in categories])
            for category, palette in zip(categories, palettes):
                with self.subTest(category=category["id"]):
                    library = ET.parse(out / "drawio" / f"{category['id']}.xml").getroot()
                    self.assertTrue(library.get("title"))
                    self.assertEqual(library.get("title"), palette["title"]["main"])
                    self.assertEqual(json.loads(library.text)[0]["title"], palette["data"][0]["title"])
            self.assertEqual(ET.parse(out / "drawio/all-icons.xml").getroot().get("title"),
                             "阿里云 · 全部图标 / All Icons")

    def test_active_svg_content_is_rejected(self):
        for svg in [SVG.replace("<path", '<script>alert(1)</script><path'),
                    SVG.replace("<path", '<path onclick="bad()"'),
                    SVG.replace("<path", '<image href="https://example.com/x.png"/><path'),
                    '<!DOCTYPE svg [<!ENTITY x "boom">]>' + SVG,
                    SVG.replace('fill="#2B85FB"', 'fill="url(https://example.com/x.svg)"')]:
            with self.subTest(svg=svg), self.assertRaises(ValueError):
                build.normalize_svg(svg)


if __name__ == "__main__":
    unittest.main()
