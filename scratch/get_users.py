import os
import sys
from dotenv import load_dotenv

# Add src to python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

load_dotenv()

from src.api.adaptive_routes import get_adaptive_db

def get_users():
    db = get_adaptive_db()
    if db._stub_mode:
        print("Stub mode active.")
        return
    try:
        res = db.app_client.table("users").select("id, mssv").execute()
        print("Users count:", len(res.data))
        for idx, u in enumerate(res.data):
            print(f"User {idx}: ID={u['id']}, MSSV={u.get('mssv')}")
    except Exception as e:
        print("Error:", e)

if __name__ == "__main__":
    get_users()
