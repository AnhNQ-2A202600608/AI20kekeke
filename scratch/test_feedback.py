import logging
import sys
import os
from dotenv import load_dotenv

# Setup output encoding for Windows terminal
if sys.platform.startswith("win"):
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8")

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("test_feedback")

# Add src to python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

# Load env
load_dotenv()

from src.api.adaptive_routes import get_adaptive_db

def test_db():
    print("Initializing Adaptive Database...")
    db = get_adaptive_db()
    if db._stub_mode:
        print("Database is in STUB mode! URL or Key is missing.")
        return
    
    print("Supabase URL:", os.environ.get("SUPABASE_URL"))
    print("App client initialized:", db.app_client is not None)
    
    # 1. Test Query Users
    print("\nQuerying first user...")
    user_id = None
    try:
        user_res = db.app_client.table("users").select("id, full_name").limit(1).execute()
        print("Users query success! Data:", user_res.data)
        if user_res.data:
            user_id = user_res.data[0]["id"]
        else:
            print("No users found in database!")
    except Exception as e:
        print("Error querying users:")
        import traceback
        traceback.print_exc()
        
    # 2. Test Query Courses
    print("\nQuerying first course...")
    course_id = None
    try:
        course_res = db.app_client.table("courses").select("id, title").limit(1).execute()
        print("Courses query success! Data:", course_res.data)
        if course_res.data:
            course_id = course_res.data[0]["id"]
        else:
            print("No courses found in database!")
    except Exception as e:
        print("Error querying courses:")
        import traceback
        traceback.print_exc()
        
    # 3. Test Insert Feedback Event
    print("\nAttempting to insert feedback event...")
    feedback_data = {
        "target_type": "question",
        "target_id": "00000000-0000-0000-0000-000000000201",
        "feedback_type": "incorrect",
        "comment": "[Sai kiến thức chuyên môn] sai kiens thuoc | Câu hỏi: Kiến thức Transformer giới thiệu cơ chế nào giúp xử lý song song thay thế RNN?"
    }
    
    if user_id:
        feedback_data["user_id"] = user_id
    else:
        print("Warning: user_id is None, this will likely fail if NOT NULL is enforced.")
        
    if course_id:
        feedback_data["course_id"] = course_id
    else:
        print("Warning: course_id is None, this will likely fail if NOT NULL is enforced.")
        
    print("Data to insert:", feedback_data)
    try:
        res = db.app_client.table("feedback_events").insert(feedback_data).execute()
        print("Insert feedback event SUCCESS! Response data:", res.data)
    except Exception as e:
        print("Error inserting feedback event:")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_db()
