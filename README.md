# Hackyon / Techis + LM Studio + Gemma 4

This version connects the existing Hackyon/Techis UI to **LM Studio running on your Windows PC**.

Model:
`gemma-4-e2b-it-qat`

Your confirmed LM Studio API:
`http://127.0.0.1:8160`

Architecture:

Browser
  -> Cloudflare Quick Tunnel
  -> this bridge (127.0.0.1:8000)
  -> LM Studio (127.0.0.1:8160)
  -> Gemma 4 E2B IT QAT

No Ollama and no Colab GPU are required.

## 1. Make sure LM Studio is running

In LM Studio, load:
`gemma-4-e2b-it-qat`

Start the LM Studio server. You already verified:
`curl http://localhost:8160/v1/models`

## 2. Start the Hackyon bridge on Windows

Open CMD in this folder and run:

    python server.py

Keep this window open.

Test it:

    curl http://localhost:8000/api/health

You should see JSON showing the model.

Test the model through the bridge:

    curl http://localhost:8000/api/tags

## 3. Test the website locally

Open:

    http://127.0.0.1:8000/

Send a chat message. The website should now use Gemma through LM Studio.

## 4. Put the website on a public Cloudflare URL

Install `cloudflared` from Cloudflare's official download page, then run:

    cloudflared tunnel --url http://127.0.0.1:8000

Cloudflare will print a temporary:
`https://....trycloudflare.com`

Open that URL.

IMPORTANT:
- Keep LM Studio running.
- Keep `server.py` running.
- Keep `cloudflared` running.
- A Quick Tunnel URL is temporary.
- Anyone who gets the public URL may be able to use your model. Do not post the URL publicly.

## One-click Windows helper

You can also double-click:
`start_bridge.bat`

It starts the bridge on port 8000.

Then run cloudflared in another CMD window:

    cloudflared tunnel --url http://127.0.0.1:8000

## Notes

- The existing UI and chat history are preserved.
- Chat history is stored in browser localStorage.
- Responses are streamed from LM Studio through the bridge.
- The existing model selector remains in the UI, but all presets currently use the same Gemma model.
- The current bridge is for text chat. The existing attachment UI is not automatically sent to Gemma yet.
