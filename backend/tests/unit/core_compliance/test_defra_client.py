import json
from pathlib import Path

from backend.gateway.defra_client import defra_client


ewc_codes = defra_client.get_ewc_codes()

output_path = Path("data/registry/ewc/codes.json")
output_path.parent.mkdir(parents=True, exist_ok=True)

with output_path.open("w", encoding="utf-8") as file:
    json.dump(ewc_codes, file, indent=2, ensure_ascii=False)

print("DEFRA EWC CODES:")
print(f"Total codes received: {len(ewc_codes)}")
print(f"Saved to: {output_path}")