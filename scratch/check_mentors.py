import os
import sys
from dotenv import load_dotenv

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
load_dotenv()

from src.api.adaptive_routes import get_adaptive_db

def get_mentor_users():
    db = get_adaptive_db()
    if db._stub_mode:
        print("Stub mode active.")
        return
    try:
        # Get users and roles
        res = db.app_client.table("users").select("id, email, full_name").execute()
        users = res.data
        
        res_roles = db.app_client.table("user_roles").select("user_id, role_id, roles(code)").execute()
        roles_map = {}
        for r in res_roles.data:
            roles_map[r["user_id"]] = r["roles"]["code"] if r["roles"] else "unknown"
            
        print("--- Accounts in DB ---")
        for u in users:
            role = roles_map.get(u["id"], "student")
            if role == "mentor" or role == "admin" or role == "btc":
                print(f"Email: {u['email']} | Full Name: {u['full_name']} | Role: {role} | ID: {u['id']}")
    except Exception as e:
        print("Error:", e)

if __name__ == "__main__":
    get_mentor_users()
