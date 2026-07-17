import httpx

def check_health():
    for host in ["127.0.0.1", "localhost"]:
        url = f"http://{host}:8001/health"
        print(f"Pinging {url}...")
        try:
            res = httpx.get(url, timeout=2.0)
            print(f"SUCCESS: {res.status_code} - {res.text}")
        except Exception as e:
            print(f"FAILED: {e}")

if __name__ == "__main__":
    check_health()
