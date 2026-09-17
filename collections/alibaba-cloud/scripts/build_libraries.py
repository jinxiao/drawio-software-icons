"""Build draw.io libraries from Iconfont categories without changing source colors."""
from __future__ import annotations

import argparse
import base64
import csv
from datetime import date
import hashlib
import io
import json
import math
from pathlib import Path
import re
import shutil
import tempfile
from urllib.parse import quote, unquote
import xml.etree.ElementTree as ET
import zipfile
import zlib

ROOT = Path(__file__).resolve().parents[1]
SVG_NS = "http://www.w3.org/2000/svg"
ET.register_namespace("", SVG_NS)
SAFE_TAGS = {"svg", "g", "path", "rect", "circle", "ellipse", "line", "polyline", "polygon",
             "defs", "clipPath", "mask", "linearGradient", "radialGradient", "stop", "title", "desc"}


def load(path):
    return json.loads(path.read_text(encoding="utf-8"))


def write_text(path, text):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8", newline="\n")


def normalize_svg(svg):
    """Preserve geometry and explicit paint; freeze context-only color to neutral black."""
    if re.search(r"<!DOCTYPE|<!ENTITY", svg, re.I):
        raise ValueError("DTD and entities are not permitted")
    root = ET.fromstring(svg)
    if root.tag != f"{{{SVG_NS}}}svg":
        raise ValueError("Expected SVG namespace")
    # Iconfont adds 1em sizing and fill:currentColor to every preview wrapper.
    # Paths carry the actual collection colors. Unpainted UI paths use default black.
    root.attrib.pop("class", None)
    style = root.attrib.pop("style", "")
    declarations = dict(part.strip().split(":", 1) for part in style.split(";") if ":" in part)
    if any(k not in {"width", "height", "vertical-align", "fill", "overflow", "color"} for k in declarations):
        raise ValueError("Unexpected root SVG style")
    for attr in ("fill", "color"):
        if attr in declarations:
            root.set(attr, declarations[attr].strip())
    root.set("color", root.get("color", "#000000"))
    for element in root.iter():
        if element.tag.rsplit("}", 1)[-1] not in SAFE_TAGS:
            raise ValueError(f"Unsupported SVG element: {element.tag}")
        for key, value in element.attrib.items():
            local = key.rsplit("}", 1)[-1].lower()
            if local.startswith("on") or local in {"href", "src", "style"}:
                raise ValueError(f"Unsupported SVG attribute: {key}")
            if "url(" in value.lower() and not re.fullmatch(r"url\(#[a-zA-Z_][\w.-]*\)", value):
                raise ValueError("Only local SVG references are permitted")
    dims = list(map(float, re.split(r"[\s,]+", root.get("viewBox", "").strip())))
    if len(dims) != 4 or not all(math.isfinite(v) for v in dims) or min(dims[2:]) <= 0:
        raise ValueError("Invalid SVG viewBox")
    root.set("width", str(dims[2]))
    root.set("height", str(dims[3]))
    return ET.tostring(root, encoding="unicode"), dims[2] / dims[3]


def library_entry(entry, svg, ratio=1.0):
    w, h = round(min(144, 64 * ratio), 3), round(min(64, 144 / ratio), 3)
    model = ET.Element("mxGraphModel")
    root = ET.SubElement(model, "root")
    ET.SubElement(root, "mxCell", {"id": "0"})
    ET.SubElement(root, "mxCell", {"id": "1", "parent": "0"})
    style = ("shape=image;imageAspect=1;aspect=fixed;verticalLabelPosition=bottom;"
             "verticalAlign=top;align=center;html=0;whiteSpace=wrap;labelWidth=160;"
             "fontSize=12;fontColor=#263238;spacingTop=6;image=data:image/svg+xml," + quote(svg, safe="") + ";")
    obj = ET.SubElement(root, "object", {"id": "2", "label": "", "iconId": entry["id"],
                         "iconName": entry["name"], "sourceUrl": entry["source_url"]})
    cell = ET.SubElement(obj, "mxCell", {"style": style, "vertex": "1", "parent": "1"})
    ET.SubElement(cell, "mxGeometry", {"x": "0", "y": "0", "width": str(w), "height": str(h), "as": "geometry"})
    title = entry["name"] + (" [上游未明确命名]" if entry["status"] == "unnamed" else "")
    tags = " ".join([entry["name"], *entry.get("aliases", []), *entry["categories"], entry["id"]])
    return dict(xml=ET.tostring(model, encoding="unicode"), w=w, h=h, title=title, tags=tags, aspect="fixed")


def library_xml(entries, title):
    root = ET.Element("mxlibrary", {"title": title, "tags": "Alibaba Cloud 阿里云 Iconfont"})
    root.text = json.dumps(entries, ensure_ascii=False, separators=(",", ":"))
    return ET.tostring(root, encoding="unicode") + "\n"


def collection_preview(categories, entries, built):
    """Standalone contact sheet for More Shapes, which does not render libs as a preview."""
    columns, tile_width, tile_height = 3, 120, 102
    width = columns * tile_width
    height = math.ceil(len(categories) / columns) * tile_height
    root = ET.Element(f"{{{SVG_NS}}}svg", {"viewBox": f"0 0 {width} {height}",
                                         "width": str(width), "height": str(height)})
    ET.SubElement(root, f"{{{SVG_NS}}}rect", {"width": str(width), "height": str(height), "fill": "#FFFFFF"})
    for index, category in enumerate(categories):
        x, y = index % columns * tile_width, index // columns * tile_height
        group = ET.SubElement(root, f"{{{SVG_NS}}}g", {"transform": f"translate({x},{y})"})
        ET.SubElement(group, f"{{{SVG_NS}}}rect", {"x": "4", "y": "4", "width": "112", "height": "94",
                                                 "rx": "4", "fill": "#FFFFFF", "stroke": "#DDE3EB"})
        title = ET.SubElement(group, f"{{{SVG_NS}}}text", {"x": "12", "y": "24", "font-size": "12",
                             "font-family": "Arial, Microsoft YaHei, sans-serif", "fill": "#263238"})
        title.text = category["name"]
        members = [e for e in entries if category["id"] in e["categories"]]
        samples = sorted(members, key=lambda e: e["status"] == "unnamed")[:3]
        for position, entry in enumerate(samples):
            cell = ET.fromstring(built[entry["id"]]["xml"]).find("./root/object/mxCell")
            encoded_svg = cell.get("style").split("image=data:image/svg+xml,", 1)[1].rstrip(";")
            svg = ET.fromstring(unquote(encoded_svg))
            svg.set("x", str(12 + position * 34))
            svg.set("y", "37")
            svg.set("width", "28")
            svg.set("height", "28")
            svg.set("preserveAspectRatio", "xMidYMid meet")
            group.append(svg)
        count = ET.SubElement(group, f"{{{SVG_NS}}}text", {"x": "12", "y": "86", "font-size": "10",
                             "font-family": "Arial, Microsoft YaHei, sans-serif", "fill": "#607080"})
        count.text = f"{len(members)} icons"
    return ET.tostring(root, encoding="unicode")


def categorized_configuration(categories, entries, built):
    compressed = {}
    for key, item in built.items():
        raw = quote(item["xml"], safe="~()*!.'-").encode()
        encoder = zlib.compressobj(level=9, wbits=-15)
        encoded = base64.b64encode(encoder.compress(raw) + encoder.flush()).decode("ascii")
        compressed[key] = {**item, "xml": encoded}
    palettes = []
    for category in categories:
        palettes.append(dict(
            title={"main": "阿里云 · " + category["name"] + " / " + category["name_en"],
                   "en": "Alibaba Cloud · " + category["name_en"]},
            tags="Alibaba Cloud 阿里云 " + category["name"] + " " + category["name_en"],
            data=[compressed[e["id"]] for e in entries if category["id"] in e["categories"]]))
    preview = "data:image/svg+xml;base64," + base64.b64encode(collection_preview(categories, entries, built).encode()).decode("ascii")
    return dict(defaultLibraries="general;uml;er;bpmn;flowchart;basic;arrows2;alibaba-cloud-iconfont",
                libraries=[dict(title={"main": "阿里云 Iconfont"}, entries=[dict(
                    id="alibaba-cloud-iconfont", title={"main": "阿里云 Iconfont 全部分类"}, preview=preview,
                    desc={"main": f"一次加载 {len(palettes)} 个来源分类；保留各图标原色。"}, libs=palettes)])])


def verify_library(path):
    root = ET.parse(path).getroot()
    if root.tag != "mxlibrary":
        raise ValueError(f"Not a library: {path}")
    entries = json.loads(root.text)
    for entry in entries:
        assert isinstance(entry["w"], (int, float)) and entry["w"] > 0
        assert isinstance(entry["h"], (int, float)) and entry["h"] > 0
        obj = ET.fromstring(entry["xml"]).find("./root/object")
        assert obj is not None and obj.get("label") == ""
        assert obj.find("mxCell/mxGeometry") is not None
    return len(entries)


def build(out):
    catalog = load(ROOT / "data/catalog.json")
    assets = load(ROOT / "data/assets.json")
    entries = catalog["entries"]
    # Keep product categories in source order; supplemental UI symbols always come last.
    # The gallery's clibs URL, JSON configuration and plugin share this same order.
    categories = sorted(catalog["categories"], key=lambda c: c["id"] == "09-supplemental-icons")
    catalog = {**catalog, "categories": categories}
    if len({e["id"] for e in entries}) != len(entries):
        raise ValueError("Duplicate icon IDs")
    if {e["asset"] for e in entries} != set(assets):
        raise ValueError("Missing or unreferenced assets")
    built = {}
    for entry in entries:
        svg, ratio = normalize_svg(assets[entry["asset"]]["svg"])
        write_text(out / "svg" / f"{entry['id']}.svg", svg + "\n")
        built[entry["id"]] = library_entry(entry, svg, ratio)
    config = categorized_configuration(categories, entries, built)
    palettes = config["libraries"][0]["entries"][0]["libs"]
    paths = []
    groups = [("all-icons", "阿里云 · 全部图标 / All Icons", entries)] + [
        (c["id"], palette["title"]["main"], [e for e in entries if c["id"] in e["categories"]])
        for c, palette in zip(categories, palettes)]
    for name, title, group in groups:
        path = out / "drawio" / f"{name}.xml"
        write_text(path, library_xml([built[e["id"]] for e in group], title))
        paths.append(path)
    preview = config["libraries"][0]["entries"][0]["preview"]
    write_text(out / "previews/alibaba-cloud.svg", base64.b64decode(preview.split(",", 1)[1]).decode() + "\n")
    write_text(out / "config/alibaba-cloud.json", json.dumps(config, ensure_ascii=False, indent=2) + "\n")
    plugin_data = dict(version="iconfont-" + catalog["snapshot_date"], palettes=[
        dict(id="alibaba-cloud-" + c["id"], **p) for c, p in zip(categories, palettes)])
    runtime = (ROOT / "src/plugin.js").read_text(encoding="utf-8")
    write_text(out / "plugins/alibaba-cloud.js", runtime.replace("__PLUGIN_DATA__", json.dumps(plugin_data, ensure_ascii=False, separators=(",", ":"))))
    summary = dict(snapshot_date=catalog["snapshot_date"], icon_entries=len(entries),
                   collection_occurrences=sum(c["total"] for c in categories),
                   unnamed=sum(e["status"] == "unnamed" for e in entries),
                   categories=categories, libraries=len(paths))
    write_text(out / "summary.json", json.dumps(summary, ensure_ascii=False, indent=2) + "\n")
    write_text(out / "catalog.json", json.dumps(catalog, ensure_ascii=False, indent=2) + "\n")
    stream = io.StringIO(newline="")
    writer = csv.writer(stream)
    writer.writerow(["icon_id", "source_name", "categories", "status", "colors", "source_url"])
    for e in entries:
        writer.writerow([e["source_icon_id"], e["name"], ";".join(e["categories"]), e["status"],
                         ";".join(assets[e["asset"]]["colors"]), e["source_url"]])
    write_text(out / "catalog.csv", "\ufeff" + stream.getvalue())
    template = (ROOT / "src/gallery.html").read_text(encoding="utf-8")
    payload = json.dumps(dict(entries=entries, summary=summary), ensure_ascii=False).replace("<", "\\u003c")
    config_payload = json.dumps(config, ensure_ascii=False, separators=(",", ":")).replace("<", "\\u003c")
    write_text(out / "index.html", template.replace("__CATALOG_DATA__", payload).replace("__CONFIG_DATA__", config_payload))
    for source, destination in [("docs/USAGE.md", "README.md"), ("docs/SOURCES.md", "SOURCES.md"),
                                ("docs/COLORS.md", "COLORS.md"), ("docs/PLUGIN.md", "PLUGIN.md"),
                                ("LICENSE", "LICENSE"), ("NOTICE.md", "NOTICE.md")]:
        write_text(out / destination, (ROOT / source).read_text(encoding="utf-8"))
    for path in paths:
        verify_library(path)
    checksums = {p.relative_to(out).as_posix(): hashlib.sha256(p.read_bytes()).hexdigest()
                 for p in sorted(out.rglob("*")) if p.is_file()}
    write_text(out / "SHA256SUMS.json", json.dumps(checksums, indent=2) + "\n")
    archive = out / "alibaba-cloud-drawio.zip"
    timestamp = date.fromisoformat(catalog["snapshot_date"])
    with zipfile.ZipFile(archive, "w", zipfile.ZIP_DEFLATED) as zf:
        for p in sorted(out.rglob("*")):
            if p.is_file() and p != archive:
                info = zipfile.ZipInfo(p.relative_to(out).as_posix(), (timestamp.year, timestamp.month, timestamp.day, 0, 0, 0))
                info.compress_type = zipfile.ZIP_DEFLATED
                zf.writestr(info, p.read_bytes())
    print(json.dumps({k: v for k, v in summary.items() if k != "categories"}, ensure_ascii=False))


def publish(out):
    """Stage completely, then replace outputs; prune only unchanged prior generated files."""
    out = out.resolve()
    out.parent.mkdir(parents=True, exist_ok=True)
    manifest = out / "SHA256SUMS.json"
    old = load(manifest) if manifest.exists() else {}
    with tempfile.TemporaryDirectory(prefix=".icons-build-", dir=out.parent) as temporary:
        staging = Path(temporary).resolve()
        if staging.parent != out.parent:
            raise ValueError("Build staging path escaped output parent")
        build(staging)
        new_paths = {p.relative_to(staging).as_posix() for p in staging.rglob("*") if p.is_file()}
        for relative in set(old) - new_paths:
            target = (out / relative).resolve()
            if not target.is_relative_to(out):
                raise ValueError("Previous manifest path escaped output directory")
            if target.is_file() and hashlib.sha256(target.read_bytes()).hexdigest() == old[relative]:
                target.unlink()
            elif target.exists():
                print(f"Preserved locally modified obsolete output: {relative}")
        for relative in sorted(new_paths):
            target = (out / relative).resolve()
            if not target.is_relative_to(out):
                raise ValueError("Generated path escaped output directory")
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(staging / relative, target)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, default=ROOT / "dist")
    publish(parser.parse_args().output)
