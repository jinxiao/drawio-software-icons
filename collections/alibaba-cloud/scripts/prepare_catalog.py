"""Import every icon from the Alibaba Cloud Design Center's public collections.

Collections determine categories; the source SVG determines color. No product-page
matching, geometry deduplication across color variants, or keyword filtering is used.
"""
from __future__ import annotations

import argparse
from collections import Counter
from datetime import date
import hashlib
import json
from pathlib import Path
import re
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
SOURCES = ROOT / ".cache/sources"
DATA = ROOT / "data"
PUBLISHER_ID = 6856114
COLLECTIONS = [
    (21530, "01-cloud-infrastructure", "云计算基础", "Cloud Infrastructure"),
    (21419, "02-big-data", "大数据", "Big Data"),
    (21426, "03-security", "安全", "Security"),
    (21532, "04-artificial-intelligence", "人工智能", "Artificial Intelligence"),
    (21533, "05-enterprise-applications", "企业应用", "Enterprise Applications"),
    (21538, "06-developer-services", "开发者服务", "Developer Services"),
    (21539, "07-iot", "物联网", "IoT"),
    (21408, "08-orange-collection", "橙色全集", "Orange Collection"),
    (27723, "09-supplemental-icons", "UI 补充图标", "Supplemental Icons"),
]


def read_json(path):
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8", newline="\n")


def is_unnamed(name):
    # Product names such as 数据库备份 / 混合云备份 are real names, not artboard copies.
    return bool(re.fullmatch(r"(?:\d*备份(?:\s*\d+)?|画板(?:备份)?(?:\s*\d+)?)", name.strip()))


def svg_colors(svg):
    root = ET.fromstring(svg)
    return Counter(e.get(attr).lower() for e in root.iter() for attr in ("fill", "stroke", "stop-color")
                   if e.get(attr) and e.get(attr).lower() not in {"none", "currentcolor", "transparent"})


def normalize_collection(payload, definition, assets, entries):
    cid, category_id, name, name_en = definition
    data = payload["data"]
    collection = data["collection"]
    if collection["id"] != cid or collection["create_user_id"] != PUBLISHER_ID:
        raise ValueError(f"Unexpected publisher or collection: {cid}")
    icons = data["icons"]
    if not icons:
        raise ValueError(f"Empty collection: {cid}")
    palette_colors = Counter()
    source_url = f"https://www.iconfont.cn/collections/detail?cid={cid}"
    for icon in icons:
        aid = f"iconfont-{icon['id']}"
        source_name = icon["name"].strip()
        svg = icon["show_svg"]
        colors = svg_colors(svg)
        palette_colors.update(colors)
        if aid in assets:
            if assets[aid]["svg"] != svg:
                raise ValueError(f"Conflicting SVG for icon ID {aid}")
            if category_id in entries[aid]["categories"]:
                raise ValueError(f"Duplicate icon ID in collection {cid}: {aid}")
            assets[aid]["collections"].append(cid)
            entries[aid]["categories"].append(category_id)
            continue
        assets[aid] = dict(id=aid, name=source_name, svg=svg, kind="iconfont",
                           source_url=source_url, source_icon_id=icon["id"], collections=[cid],
                           colors=dict(colors))
        entries[aid] = dict(id=aid, name=source_name, name_en="", code="", aliases=[],
                            categories=[category_id], asset=aid, status="unnamed" if is_unnamed(source_name) else "named",
                            source_icon_id=icon["id"], source_url=source_url,
                            product_url="", docs_url="")
    return dict(id=category_id, name=name, name_en=name_en, source_collection_id=cid,
                source_name=collection["name"], source_url=source_url, total=len(icons),
                colors=dict(palette_colors.most_common()),
                color=palette_colors.most_common(1)[0][0] if palette_colors else "#000000")


def main(snapshot_date):
    date.fromisoformat(snapshot_date)
    assets, entries, categories, locks = {}, {}, [], []
    for definition in COLLECTIONS:
        cid = definition[0]
        path = SOURCES / f"iconfont-{cid}.json"
        categories.append(normalize_collection(read_json(path), definition, assets, entries))
        locks.append(dict(file=path.name, sha256=hashlib.sha256(path.read_bytes()).hexdigest(),
                          url=f"https://www.iconfont.cn/api/collection/detail.json?id={cid}"))
    # The publisher listing lets updates detect newly added collections instead of silently omitting them.
    listing = SOURCES / "iconfont-user-collections.json"
    public = read_json(listing)["data"]
    found = {c["id"] for c in public["collections"]}
    known = {c[0] for c in COLLECTIONS}
    if len(public["collections"]) != public["count"] or found != known:
        raise ValueError("Publisher collections changed or listing is paginated; review COLLECTIONS before importing")
    locks.append(dict(file=listing.name, sha256=hashlib.sha256(listing.read_bytes()).hexdigest(),
                      url=f"https://www.iconfont.cn/api/user/collections.json?uid={PUBLISHER_ID}&page=1&pageSize=100"))
    catalog = dict(schema_version=2, snapshot_date=snapshot_date, publisher_id=PUBLISHER_ID,
                   categories=categories, entries=list(entries.values()))
    write_json(DATA / "assets.json", assets)
    write_json(DATA / "catalog.json", catalog)
    write_json(DATA / "sources.lock.json", dict(snapshot_date=snapshot_date, sources=locks))
    print(json.dumps(dict(categories=len(categories), icons=len(entries),
                          collection_occurrences=sum(c["total"] for c in categories),
                          unnamed=sum(e["status"] == "unnamed" for e in entries.values())), ensure_ascii=False))


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--snapshot-date", default=date.today().isoformat())
    main(parser.parse_args().snapshot_date)
