import json
import os
import urllib.error
import urllib.request
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler

HOST = os.getenv("HOST", "127.0.0.1")
PORT = int(os.getenv("PORT", "8000"))
LMSTUDIO_URL = os.getenv("LMSTUDIO_URL", "http://127.0.0.1:8160")
LMSTUDIO_MODEL = os.getenv("LMSTUDIO_MODEL", "gemma-4-e2b-it-qat")
TEMPERATURE = float(os.getenv("TEMPERATURE", "1.0"))
TOP_P = float(os.getenv("TOP_P", "0.95"))
MAX_BODY = 8 * 1024 * 1024


class Handler(SimpleHTTPRequestHandler):
    # Close each streaming response when the LM Studio stream ends.
    # This lets browser fetch() receive reader.read() => done=true.
    protocol_version = "HTTP/1.0"

    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Content-Length", "0")
        self.end_headers()

    def do_GET(self):
        if self.path == "/api/health":
            self.send_json(200, {
                "ok": True,
                "lm_studio": LMSTUDIO_URL,
                "model": LMSTUDIO_MODEL,
            })
            return

        if self.path == "/api/tags":
            try:
                req = urllib.request.Request(
                    LMSTUDIO_URL.rstrip("/") + "/v1/models",
                    headers={"Accept": "application/json"},
                )
                with urllib.request.urlopen(req, timeout=10) as r:
                    data = json.loads(r.read().decode("utf-8"))
                self.send_json(200, data)
            except Exception as e:
                self.send_json(502, {"error": "LM Studio unavailable", "detail": str(e)})
            return

        if self.path == "/" or self.path == "/index.html":
            self.path = "/index.html"
        super().do_GET()

    def do_POST(self):
        if self.path != "/api/chat":
            self.send_json(404, {"error": "Not found"})
            return

        try:
            length = int(self.headers.get("Content-Length", "0"))
            if length <= 0 or length > MAX_BODY:
                self.send_json(400, {"error": "Invalid request body"})
                return

            raw = self.rfile.read(length)
            incoming = json.loads(raw.decode("utf-8"))
            messages = incoming.get("messages", [])

            if not isinstance(messages, list) or not messages:
                self.send_json(400, {"error": "messages must be a non-empty array"})
                return

            clean_messages = []
            for m in messages:
                if not isinstance(m, dict):
                    continue
                role = m.get("role", "user")
                if role == "ai":
                    role = "assistant"
                if role not in ("system", "user", "assistant"):
                    continue
                content = m.get("content", "")
                if isinstance(content, str):
                    clean_messages.append({"role": role, "content": content})

            if not clean_messages:
                self.send_json(400, {"error": "No valid messages"})
                return

            payload = {
                "model": LMSTUDIO_MODEL,
                "messages": clean_messages,
                "stream": True,
                "temperature": TEMPERATURE,
                "top_p": TOP_P,
            }

            req = urllib.request.Request(
                LMSTUDIO_URL.rstrip("/") + "/v1/chat/completions",
                data=json.dumps(payload).encode("utf-8"),
                headers={
                    "Content-Type": "application/json",
                    "Accept": "text/event-stream",
                },
                method="POST",
            )

            try:
                upstream = urllib.request.urlopen(req, timeout=300)
            except urllib.error.HTTPError as e:
                detail = e.read().decode("utf-8", errors="replace")
                self.send_json(502, {
                    "error": "LM Studio returned an error",
                    "status": e.code,
                    "detail": detail,
                })
                return
            except Exception as e:
                self.send_json(502, {
                    "error": "Could not connect to LM Studio",
                    "detail": str(e),
                })
                return

            self.send_response(200)
            self.send_header("Content-Type", "application/x-ndjson; charset=utf-8")
            self.send_header("Cache-Control", "no-cache, no-transform")
            self.send_header("Connection", "close")
            self.send_header("X-Accel-Buffering", "no")
            self.end_headers()

            try:
                for raw_line in upstream:
                    line = raw_line.decode("utf-8", errors="replace").strip()
                    if not line or line.startswith(":"):
                        continue
                    if line.startswith("data:"):
                        data = line[5:].strip()
                    else:
                        continue

                    if data == "[DONE]":
                        self.wfile.write(b'{"done":true}\n')
                        self.wfile.flush()
                        break

                    try:
                        obj = json.loads(data)
                    except json.JSONDecodeError:
                        continue

                    choice = (obj.get("choices") or [{}])[0]
                    delta = choice.get("delta") or {}

                    # LM Studio may expose reasoning separately.
                    # Hackyon currently renders the normal content stream.
                    content = delta.get("content")
                    if content:
                        packet = json.dumps(
                            {"message": {"content": content}, "done": False},
                            ensure_ascii=False,
                        ).encode("utf-8") + b"\n"
                        self.wfile.write(packet)
                        self.wfile.flush()

                    if choice.get("finish_reason"):
                        self.wfile.write(b'{"done":true}\n')
                        self.wfile.flush()
                        break
            except (BrokenPipeError, ConnectionResetError):
                pass
            finally:
                upstream.close()
                self.close_connection = True

        except Exception as e:
            try:
                self.send_json(500, {"error": "Bridge error", "detail": str(e)})
            except Exception:
                pass

    def send_json(self, status, data):
        body = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)


if __name__ == "__main__":
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    print(f"Hackyon LM Studio bridge: http://{HOST}:{PORT}")
    print(f"LM Studio: {LMSTUDIO_URL}")
    print(f"Model: {LMSTUDIO_MODEL}")
    ThreadingHTTPServer((HOST, PORT), Handler).serve_forever()
