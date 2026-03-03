import json, os, re, sys
from pathlib import Path

ALLOWED_USERS = set(u.strip() for u in os.environ.get("ALLOWED_USERS", "LabyEDM").split(",") if u.strip())
ACTOR = os.environ.get("GITHUB_ACTOR", "")

ISSUE_BODY_PATH = os.environ.get("ISSUE_BODY_PATH", "")
OUT_ROOT = Path("docs")

def fail(msg: str):
  print(msg, file=sys.stderr)
  sys.exit(1)

def extract_json_payload(body: str) -> dict:
  # Issue form places the textarea content in the body. We just find the first JSON object.
  m = re.search(r"\{[\s\S]*\}\s*$", body.strip())
  if not m:
    fail("Could not find JSON payload in issue body.")
  try:
    return json.loads(m.group(0))
  except Exception as e:
    fail(f"Invalid JSON payload: {e}")

def validate_rel_path(p: str) -> Path:
  p = (p or "").strip().lstrip("/")
  if not p or p.endswith("/") or ".." in p or p.startswith("."):
    fail("Invalid path.")
  if not p.lower().endswith(".md"):
    fail("Path must end with .md")
  rel = Path(p)
  # Ensure it stays within docs/
  full = (OUT_ROOT / rel).resolve()
  if OUT_ROOT.resolve() not in full.parents:
    fail("Path escapes docs/.")
  return rel

def main():
  if ACTOR not in ALLOWED_USERS:
    fail(f"Actor '{ACTOR}' not allowed. Allowed: {sorted(ALLOWED_USERS)}")

  if not ISSUE_BODY_PATH or not Path(ISSUE_BODY_PATH).exists():
    fail("ISSUE_BODY_PATH not found.")

  body = Path(ISSUE_BODY_PATH).read_text(encoding="utf-8")
  payload = extract_json_payload(body)

  mode = payload.get("mode", "update")
  rel = validate_rel_path(payload.get("path", ""))

  content = payload.get("content_markdown", "")
  if not isinstance(content, str) or len(content.strip()) < 1:
    fail("content_markdown is empty.")

  out_file = OUT_ROOT / rel
  out_file.parent.mkdir(parents=True, exist_ok=True)

  if mode == "create" and out_file.exists():
    fail("Mode=create but file already exists.")

  out_file.write_text(content, encoding="utf-8")
  print(f"Wrote {out_file}")

if __name__ == "__main__":
  main()
