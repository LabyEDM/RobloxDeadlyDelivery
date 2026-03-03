# Builds site locally
# Usage: .\scripts\build.ps1
if (!(Test-Path ".venv")) { py -m venv .venv }
. .\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
mkdocs build --clean
