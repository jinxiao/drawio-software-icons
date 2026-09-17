"""Fetch public sources listed in data/sources.lock.json; cache by default, no retries."""
import argparse
from datetime import date
import hashlib
import json
from pathlib import Path
from urllib.parse import urlsplit
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
ALLOWED_HOSTS = {"www.iconfont.cn"}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--refresh", action="store_true", help="Replace cached sources with current public versions")
    args = parser.parse_args()
    lock = json.loads((ROOT / "data/sources.lock.json").read_text(encoding="utf-8"))
    folder = ROOT / ".cache/sources"
    folder.mkdir(parents=True, exist_ok=True)
    downloaded = []
    for source in lock["sources"]:
        url = urlsplit(source["url"])
        if url.scheme != "https" or url.hostname not in ALLOWED_HOSTS:
            raise ValueError(f"Unexpected source host: {url.hostname}")
        target = (folder / source["file"]).resolve()
        if target.parent != folder.resolve():
            raise ValueError("Source filename must be a basename")
        if target.exists() and not args.refresh:
            print(f"Cached: {target.name}")
            continue
        request = Request(source["url"], headers={"User-Agent": "AlibabaCloudIconsCatalog/1.0"})
        with urlopen(request, timeout=30) as response:
            raw = response.read()
        if target.suffix == ".json":
            json.loads(raw)
        target.write_bytes(raw)
        changed = hashlib.sha256(raw).hexdigest() != source["sha256"]
        downloaded.append(target.name)
        print(f"Saved: {target.name}" + (" (differs from locked snapshot; review before preparing)" if changed else ""))
    if downloaded:
        print(f"Next: uv run python scripts/prepare_catalog.py --snapshot-date {date.today().isoformat()}")
        print("Review source categories, counts, colors and upstream unnamed items before building.")


if __name__ == "__main__":
    main()
