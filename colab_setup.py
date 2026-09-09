# Run this script from a Google Colab notebook after uploading the hackyon-cloud folder.
# It installs Ollama + zstd, starts Ollama, pulls Gemma 4 E2B IT QAT,
# starts the Hackyon server, and starts a free Cloudflare Quick Tunnel.

import os, re, time, pathlib, subprocess, urllib.request

ROOT = "/content/hackyon-cloud"
MODEL = "gemma4:e2b-it-qat"

print("1) Installing zstd + Ollama...")
subprocess.run("apt-get update -qq && apt-get install -y zstd -qq", shell=True, check=True)
subprocess.run("curl -fsSL https://ollama.com/install.sh | sh", shell=True, check=True)

print("2) Starting Ollama...")
subprocess.run("pkill -f 'ollama serve' || true", shell=True)
subprocess.Popen("ollama serve > /tmp/ollama.log 2>&1", shell=True)
time.sleep(5)

print("3) Pulling Gemma 4...")
subprocess.run(["ollama", "pull", MODEL], check=True)
print(subprocess.check_output(["ollama", "list"], text=True))

print("4) Starting Hackyon cloud server...")
env = os.environ.copy()
env["OLLAMA_MODEL"] = MODEL
subprocess.Popen(
    ["python", "server.py"], cwd=ROOT, env=env,
    stdout=open("/tmp/hackyon-server.log", "w"), stderr=subprocess.STDOUT
)
time.sleep(2)
print(urllib.request.urlopen("http://127.0.0.1:8000/api/health", timeout=10).read().decode())

print("5) Installing Cloudflare Quick Tunnel...")
cloudflared = "/content/cloudflared"
if not os.path.exists(cloudflared):
    subprocess.run(
        ["wget", "-q", "-O", cloudflared,
         "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64"],
        check=True
    )
    os.chmod(cloudflared, 0o755)

subprocess.Popen(
    [cloudflared, "tunnel", "--url", "http://127.0.0.1:8000"],
    stdout=open("/tmp/cloudflared.log", "w"),
    stderr=subprocess.STDOUT
)

print("6) Waiting for the public URL...")
for _ in range(40):
    log = pathlib.Path("/tmp/cloudflared.log").read_text(errors="ignore") if pathlib.Path("/tmp/cloudflared.log").exists() else ""
    match = re.search(r"https://[-a-z0-9]+\.trycloudflare\.com", log)
    if match:
        print("\nOPEN THIS URL:", match.group(0))
        break
    time.sleep(1)
else:
    print(pathlib.Path("/tmp/cloudflared.log").read_text(errors="ignore"))
