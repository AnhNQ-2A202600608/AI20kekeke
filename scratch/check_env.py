import os
from dotenv import load_dotenv

def check_env():
    load_dotenv()
    print("Checking environment variables:")
    for k, v in os.environ.items():
        k_lower = k.lower()
        if "db" in k_lower or "password" in k_lower or "postgres" in k_lower or "url" in k_lower or "key" in k_lower:
            # Mask sensitive values
            val_str = str(v)
            if len(val_str) > 10:
                val_str = val_str[:5] + "..." + val_str[-5:]
            print(f"  {k} = {val_str}")

if __name__ == "__main__":
    check_env()
