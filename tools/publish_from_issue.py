import json, os, re, sys
from pathlib import Path
from urllib.parse import urlparse

OUT_ROOT = Path("docs")

DISALLOWED_PATH_PREFIXES = (
  "assets/", "overrides/", ".github/", "tools/", "scripts/", "site/"
)

def fail(msg: str):
  print(msg, file=sys.stderr)
  sys.exit(1)

def extract_first_json(body: str) -> dict:
  # Try fenced code first
  m = re.search(r"```json\s*([\s\S]*?)\s*```", body, re.IGNORECASE)
  if m:
    return json.loads(m.group(1))

  # Otherwise, balance braces to find first JSON object
  s = body
  start = s.find("{")
  if start == -1:
    fail("No JSON payload found.")
  depth = 0
  for i in range(start, len(s)):
    if s[i] == "{":
      depth += 1
    elif s[i] == "}":
      depth -= 1
      if depth == 0:
        chunk = s[start:i+1]
        return json.loads(chunk)
  fail("Unclosed JSON payload.")

def validate_rel_path(p: str) -> Path:
  p = (p or "").strip().lstrip("/")
  if not p:
    fail("Missing path.")
  if ".." in p or p.startswith("."):
    fail("Invalid path.")
  if not p.lower().endswith(".md"):
    fail("Path must end with .md")
  low = p.lower().replace("\\","/")
  if low.startswith(DISALLOWED_PATH_PREFIXES):
    fail("Path not allowed.")
  full = (OUT_ROOT / Path(p)).resolve()
  if OUT_ROOT.resolve() not in full.parents:
    fail("Path escapes docs/.")
  return Path(p)

def is_safe_markdown(md: str) -> None:
  bad = [
    "<script", "javascript:", "onerror=", "onload=", "onclick=",
  ]
  lower = md.lower()
  for b in bad:
    if b in lower:
      fail(f"Content rejected (unsafe token found): {b}")

  # Allow iframes only if from youtube/vimeo embed
  for m in re.finditer(r"<iframe[^>]+src=['\"]([^'\"]+)['\"][^>]*>", md, re.IGNORECASE):
    src = m.group(1)
    host = urlparse(src).netloc.lower()
    if ("youtube.com" in host or "youtu.be" in host or "player.vimeo.com" in host):
      continue
    fail(f"Iframe source not allowed: {src}")

def insert_row_into_table(md: str, header_startswith: str, row: str) -> str:
  lines = md.splitlines()
  for i in range(len(lines) - 1):
    if lines[i].strip().startswith("|") and header_startswith in lines[i]:
      # Expect separator line next
      if i+1 < len(lines) and lines[i+1].strip().startswith("|"):
        # Insert after separator (i+1)
        insert_at = i + 2
        lines.insert(insert_at, row)
        return "\n".join(lines) + "\n"
  # If no matching table, append a new small section
  return md.rstrip() + "\n\n## Added entries\n" + row + "\n"

def update_index(index_path: Path, target_path: Path, title: str, page_type: str) -> None:
  idx_file = OUT_ROOT / index_path
  if not idx_file.exists():
    return

  idx_dir = idx_file.parent
  rel_link = os.path.relpath((OUT_ROOT / target_path), idx_dir).replace("\\","/")
  link = f"[{title}]({rel_link})"

  # Choose row shape based on known index table
  # (keeps your wiki tables consistent)
  base = f"| {link} "
  if page_type == "enemy":
    row = f"{base}| — | — | — | — |"
    new = insert_row_into_table(idx_file.read_text(encoding="utf-8"), "Enemy", row)
  elif page_type == "boss":
    row = f"{base}| — | — | — |"
    new = insert_row_into_table(idx_file.read_text(encoding="utf-8"), "Boss", row)
  elif page_type == "class":
    row = f"{base}| — | — | — | — |"
    new = insert_row_into_table(idx_file.read_text(encoding="utf-8"), "Class", row)
  elif page_type == "floor" or page_type == "specialfloor":
    row = f"{base}| — | — | — |"
    new = insert_row_into_table(idx_file.read_text(encoding="utf-8"), "Floor", row)
  elif page_type == "tool":
    row = f"{base}| — | — | — |"
    new = insert_row_into_table(idx_file.read_text(encoding="utf-8"), "Tool", row)
  else:
    # generic: just append
    new = idx_file.read_text(encoding="utf-8").rstrip() + f"\n- {link}\n"

  idx_file.write_text(new, encoding="utf-8")

def main():
  issue_body_path = os.environ.get("ISSUE_BODY_PATH", "")
  if not issue_body_path or not Path(issue_body_path).exists():
    fail("ISSUE_BODY_PATH missing.")

  body = Path(issue_body_path).read_text(encoding="utf-8")
  payload = extract_first_json(body)

  if payload.get("tag") != "WikiEdit":
    fail("Missing tag 'WikiEdit' in payload.")

  mode = payload.get("mode", "update")
  ptype = payload.get("type", "generic")
  title = (payload.get("title") or "Untitled").strip()
  rel = validate_rel_path(payload.get("path", ""))

  md = payload.get("content_markdown", "")
  if not isinstance(md, str) or not md.strip():
    fail("content_markdown empty.")
  if len(md) > 250_000:
    fail("content_markdown too large.")

  is_safe_markdown(md)

  out = OUT_ROOT / rel
  out.parent.mkdir(parents=True, exist_ok=True)
  if mode == "create" and out.exists():
    fail("Create requested but file already exists.")
  out.write_text(md, encoding="utf-8")

  idx = payload.get("index_update")
  if isinstance(idx, dict) and idx.get("index_path"):
    try:
      update_index(Path(idx["index_path"]), rel, title, ptype)
    except Exception as e:
      # index update should never block publishing
      print(f"Index update skipped: {e}", file=sys.stderr)

  print(f"Wrote {out}")

if __name__ == "__main__":
  main()
