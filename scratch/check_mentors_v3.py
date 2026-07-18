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
        # Query all roles linked to non-student roles in database
        # roles code: 2 is mentor, 3 is admin, 7 is dev
        res_roles = db.app_client.table("user_roles").select("user_id, role_id").execute()
        roles_links = res_roles.data
        
        non_student_user_ids = [r["user_id"] for r in roles_links if r["role_id"] != 1]
        print(f"Non-student role links count: {len(non_student_user_ids)}")
        
        if non_student_user_ids:
            res_users = db.app_client.table("users").select("id, email, full_name").in_("id", non_student_user_ids).execute()
            print("--- Non-Student Users in DB ---")
            for u in res_users.data:
                # Find role
                role_id = next(r["role_id"] for r in roles_links if r["user_id"] == u["id"])
                role_name = "Mentor" if role_id == 2 else ("Admin" if role_id == 3 else "Dev")
                print(f"Email: {u['email']} | Full Name: {u['full_name']} | Role: {role_name} | ID: {u['id']}")
        else:
            print("No non-student roles found linked in user_roles table.")
    except Exception as e:
        print("Error:", e)

if __name__ == "__main__":
    get_mentor_users()
