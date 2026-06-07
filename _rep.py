from AI_Response import askAI
from fastapi import HTTPException
for c in ["Peters", "Winston Peters", "Trump", "Hipkins", "Luxon"]:
    try:
        askAI("Are you sure about that?", c, [])
        print(f"{c!r:18} -> OK")
    except HTTPException as e:
        print(f"{c!r:18} -> {e.status_code} {e.detail}")
