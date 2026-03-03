import json
from pathlib import Path

IMG_DIR = Path("docs/assets/images/media")
AUD_DIR = Path("docs/assets/audio")
OUT    = Path("docs/assets/media_index.json")

IMG_EXT = {".png", ".jpg", ".jpeg", ".webp", ".gif"}
AUD_EXT = {".mp3", ".wav", ".ogg"}

def scan_dir(base: Path, exts: set[str], kind: str):
  items = []
  if not base.exists():
    return items
  for p in sorted(base.rglob("*")):
    if p.is_file() and p.suffix.lower() in exts:
      rel = p.relative_to(Path("docs"))
      items.append({
        "type": kind,
        "name": p.name,
        "path": str(rel).replace("\\", "/")
      })
  return items

def main():
  data = {
    "images": scan_dir(IMG_DIR, IMG_EXT, "image"),
    "audio":  scan_dir(AUD_DIR, AUD_EXT, "audio"),
    "generated_from": {
      "images": str(IMG_DIR).replace("\\", "/"),
      "audio":  str(AUD_DIR).replace("\\", "/"),
    }
  }
  OUT.parent.mkdir(parents=True, exist_ok=True)
  OUT.write_text(json.dumps(data, indent=2), encoding="utf-8")

if __name__ == "__main__":
  main()
