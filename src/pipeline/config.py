import os

# Xác định vị trí file .env trong cùng folder với config.py
script_dir = os.path.dirname(os.path.abspath(__file__))
env_path = os.path.join(script_dir, ".env")

if os.path.exists(env_path):
    try:
        from dotenv import load_dotenv

        load_dotenv(env_path)
    except ImportError:
        # Cơ chế fallback thủ công đọc file .env nếu không có thư viện python-dotenv
        with open(env_path, encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if "=" in line and not line.startswith("#"):
                    k, v = line.split("=", 1)
                    os.environ[k.strip()] = v.strip()

# Các cấu hình toàn cục đọc từ .env
URL = os.getenv("URL")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
