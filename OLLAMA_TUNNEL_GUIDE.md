# 🚀 Connecting Render to your Local Ollama

The error you're seeing happens because **Render (Cloud)** cannot see **localhost** on your computer. To fix this, you need to "tunnel" your local Ollama to the internet.

## 1. Prepare Local Ollama
By default, Ollama only listens to your own computer. You must tell it to listen to the network.

**In PowerShell:**
```powershell
$env:OLLAMA_HOST="0.0.0.0"
ollama serve
```
*(Leave this running in its own window)*

## 2. Create a stable Tunnel (SSH Method)
Since npm packages can be finicky, use the **SSH method**. It requires NO installation.

**In another terminal (PowerShell or CMD):**
```bash
ssh -p 443 -R0:localhost:11434 qr@a.pinggy.io
```

**It will show you a URL ending in `.pinggy.link`** (e.g., `https://xxxx.a.pinggy.link`).

**Copy that https URL.**

## 3. Update Render
1. Go to your **Render Dashboard**.
2. Go to **Environment Variables**.
3. Change `OLLAMA_BASE_URL` from `http://localhost:11434` to your **Tunnel URL**.
4. Save and Redeploy.

---

### Alternative: Use a Cloud Model (More Stable)
If you don't want to keep your PC running, you can use an API:
1. Get a free **Groq** or **Gemini** API key.
2. Tell me, and I will update the code to use the Cloud API instead of local Ollama.
