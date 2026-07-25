import os
import sys
import socket
import re
import subprocess

# Config
WORKSPACE_DIR = r"c:\Users\sivar\OneDrive\Desktop\olfactory"
BACKEND_DIR = os.path.join(WORKSPACE_DIR, "OLfactory_backend")
RETROFIT_PATH = os.path.join(WORKSPACE_DIR, "OLfactory", "app", "src", "main", "java", "com", "simats", "olfactory", "network", "RetrofitClient.java")
PORT = 8080

def get_local_ip():
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(('8.8.8.8', 1))
        ip = s.getsockname()[0]
    except Exception:
        ip = '127.0.0.1'
    finally:
        s.close()
    return ip

def update_android_ip(ip):
    if not os.path.exists(RETROFIT_PATH):
        print(f"[-] Android Retrofit client file not found at: {RETROFIT_PATH}")
        return False
    
    try:
        with open(RETROFIT_PATH, "r", encoding="utf-8") as f:
            content = f.read()
        
        # Regex to find: private static final String BASE_URL = "http://<IP>:<PORT>/";
        pattern = r'(private\s+static\s+final\s+String\s+BASE_URL\s*=\s*")http://[\d\.]+:(\d+)/(";)'
        match = re.search(pattern, content)
        
        if match:
            old_line = match.group(0)
            detected_port = match.group(2)
            new_line = f'{match.group(1)}http://{ip}:{detected_port}/{match.group(3)}'
            
            if old_line == new_line:
                print(f"[+] IP in RetrofitClient.java is already up-to-date: {ip}:{detected_port}")
                return True
            
            new_content = content.replace(old_line, new_line)
            with open(RETROFIT_PATH, "w", encoding="utf-8") as f:
                f.write(new_content)
            print(f"[+] Successfully updated RetrofitClient.java:\n    Old: {old_line.strip()}\n    New: {new_line.strip()}")
            return True
        else:
            print("[-] Could not find BASE_URL declaration pattern in RetrofitClient.java.")
            return False
    except Exception as e:
        print(f"[-] Error updating RetrofitClient.java: {e}")
        return False

def main():
    print("=== OLfactory IP Sync & Server Start Tool ===")
    ip = get_local_ip()
    print(f"[+] Detected Active Local IP: {ip}")
    
    # Sync IP to Android client
    update_android_ip(ip)
    
    # Start Backend Server
    print(f"[+] Launching server on {ip}:{PORT}...")
    venv_python = os.path.join(BACKEND_DIR, "venv", "Scripts", "python.exe")
    if not os.path.exists(venv_python):
        venv_python = "python"
    
    os.chdir(BACKEND_DIR)
    
    # Run uvicorn on the detected IP
    cmd = [venv_python, "-m", "uvicorn", "main:app", "--host", ip, "--port", str(PORT)]
    print(f"[+] Executing: {' '.join(cmd)}")
    
    try:
        process = subprocess.Popen(cmd)
        print(f"[+] Server started in background with PID: {process.pid}")
        print(f"[+] Access Swagger docs at http://{ip}:{PORT}/docs")
    except Exception as e:
        print(f"[-] Failed to start server: {e}")

if __name__ == "__main__":
    main()
