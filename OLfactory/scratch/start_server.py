import sys
import os
import subprocess

# Add backend to path
backend_dir = r"c:\xampp\htdocs\OLfactory_backend"
os.chdir(backend_dir)
sys.path.append(backend_dir)

print(f"Starting server in {backend_dir}...")
try:
    # Run python main.py
    process = subprocess.Popen(
        ["python", "main.py"],
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True
    )
    print(f"Server started with PID: {process.pid}")
    print("Server is running at http://10.79.172.155:8002")
    
    import time
    time.sleep(3)
    if process.poll() is not None:
        print("Server failed to start. Output:")
        print(process.stdout.read())
    else:
        print("Server is still running. You can close this script.")

except Exception as e:
    print(f"Failed to start server: {e}")
