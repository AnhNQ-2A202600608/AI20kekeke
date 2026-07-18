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
        print(f"Total users: {len(users)}")
        for u in users[:20]:
            print(f"Email: {u['email']} | Full Name: {u['full_name']} | ID: {u['id']}")
            
        res_roles = db.app_client.table("user_roles").select("user_id, role_id").execute()
        print(f"Total user_roles links: {len(res_roles.data)}")
        
        res_roles_details = db.app_client.table("roles").select("id, code, name").execute()
        print("Roles list:")
        for r in res_roles_details.data:
            print(r)
    except Exception as e:
        print("Error:", e)

if __name__ == "__main__":
    get_mentor_users()
