# Complete Setup Guide — Conflict Prediction System

---

## 🗺️ First, Understand the Problem

Your project has **3 separate pieces** running in **3 different places**:

```
┌─────────────────────────────────────────────────────────┐
│  PIECE 1: Frontend (React app)                          │
│  WHERE: Cloudflare Pages (internet)                     │
│  WHAT: The dashboard the user sees in their browser     │
└─────────────────────────────────────────────────────────┘
                      │ sends requests to
                      ▼
┌─────────────────────────────────────────────────────────┐
│  PIECE 2: Backend (Python FastAPI server)               │
│  WHERE: Render.com (internet)                           │
│  WHAT: Fetches news, cleans data, calls the AI          │
└─────────────────────────────────────────────────────────┘
                      │ needs to talk to
                      ▼
┌─────────────────────────────────────────────────────────┐
│  PIECE 3: Ollama (AI model = llama3.2)                  │
│  WHERE: YOUR LOCAL PC (not on the internet)             │
│  WHAT: Reads news articles, writes the analysis         │
└─────────────────────────────────────────────────────────┘
```

### The Core Problem

**Render (Piece 2) and your PC (Piece 3) cannot talk to each other.**

Why? Because your PC is behind your home router. It has no public internet address.
When Render tries `http://localhost:11434` — that `localhost` means Render's own servers,
not your home PC. So Ollama never gets the request → empty stream error.

### The Solution: A Tunnel

A **tunnel** is a program that runs on YOUR PC and gives it a temporary public internet address.
Think of it like a forwarding address: instead of Render calling your PC directly,
it calls `https://something.trycloudflare.com` → that forwards to your PC's Ollama.

```
Render → https://xyz.trycloudflare.com → [TUNNEL on your PC] → Ollama :11434
```

---

## 📋 What You Need to Do — Step by Step

### STEP 1: Push the latest code to GitHub

All the fixes have been made to your code. First, commit and push everything.

Open PowerShell in `F:\veer\Sunhacks` and run:

```powershell
git add -A
git commit -m "fix: HuggingFace embeddings, bcrypt passwords, env-based Ollama config"
git push
```

Render will automatically detect the push and redeploy your backend.
Wait about 5 minutes for it to finish.

---

### STEP 2: Download Cloudflare Tunnel (one time only)

This is the tunnel tool. It's a single .exe file, no installation needed.

1. Go to this link in your browser:
   **https://github.com/cloudflare/cloudflared/releases/latest**

2. Scroll down to **Assets** and download:
   **`cloudflared-windows-amd64.exe`**

3. Rename it to just **`cloudflared.exe`**

4. Move it to **`C:\cloudflared.exe`** (easy to find)

---

### STEP 3: Set OLLAMA_HOST permanently (one time only)

By default, Ollama only listens to your own PC. You must change this so the tunnel can reach it.

Open PowerShell **as Administrator** and run:

```powershell
[System.Environment]::SetEnvironmentVariable('OLLAMA_HOST', '0.0.0.0', 'Machine')
```

Then **completely quit Ollama**:
- Look at the bottom-right of your screen (system tray)
- Find the Ollama icon
- Right-click → **Quit Ollama**

Then **start Ollama again** from your Start menu.

To verify it worked, open a new PowerShell and run:
```powershell
netstat -ano | findstr :11434
```
You should see `0.0.0.0:11434` — NOT `127.0.0.1:11434`.
If it says `0.0.0.0` → ✅ Ollama is now reachable.

---

### STEP 4: Start the Cloudflare Tunnel

**Every time you want to use your app**, run this in PowerShell:

```powershell
C:\cloudflared.exe tunnel --url http://localhost:11434
```

You will see output like:

```
INF Thank you for trying Cloudflare Tunnel. Doing so, without a login, is
INF only available on a temporary basis.
INF +--------------------------------------------------------------------------------------------+
INF |  Your quick tunnel has been created! Visit it at (it may take some time to be reachable): |
INF |  https://random-words-here.trycloudflare.com                                              |
INF +--------------------------------------------------------------------------------------------+
```

**COPY that `https://...trycloudflare.com` URL.**

Keep this PowerShell window open — if you close it, the tunnel stops.

---

### STEP 5: Update Render with the tunnel URL

1. Go to **https://dashboard.render.com**
2. Click on your service **system-backend**
3. Click **Environment** in the left sidebar
4. Find the variable **`OLLAMA_BASE_URL`**
5. Set its value to the URL you copied (e.g., `https://random-words.trycloudflare.com`)
6. Click **Save Changes**
7. Render will automatically restart — wait about 1 minute

---

### STEP 6: Test it works

Open your browser and go to your Render backend URL + `/health`:

```
https://system-backend.onrender.com/health
```

You should see:
```json
{
  "status": "ok",
  "store_ready": true,
  "ollama_url": "https://random-words.trycloudflare.com",
  "model": "llama3.2:latest"
}
```

If `ollama_url` shows your tunnel URL → ✅ It's connected!

Now go to your Cloudflare Pages frontend and test an analysis.

---

## 🔁 Every Day You Want to Use the App

You only need to do Steps 1-3 once. Every day after that:

```
1. Open Ollama (from Start menu) — make sure llama3.2 is running
2. Run: C:\cloudflared.exe tunnel --url http://localhost:11434
3. Copy the new tunnel URL
4. Paste it into Render → OLLAMA_BASE_URL → Save
5. Wait 1 min for Render to restart
6. Your app works!
```

> ⚠️ The tunnel URL changes every time you run it.
> That's why you must update Render each session.
> This is normal for the free tier.

---

## ✅ Summary of All Fixes Made to the Code

| What was broken | What we fixed |
|-----------------|---------------|
| All 9 agent files had `localhost:11434` hardcoded | Now read from `OLLAMA_BASE_URL` env var |
| FAISS needed Ollama to create embeddings | Switched to HuggingFace (runs on Render, no Ollama needed) |
| Passwords stored as plain text | Now hashed with bcrypt — much more secure |
| Anyone could use `/auth/login/bypass` | Now disabled unless `ENABLE_BYPASS_LOGIN=true` is set |
| Bad error message said "Gollama" | Fixed to say "Ollama" with proper instructions |

---

## 🗂️ Your Environment Variables on Render

Make sure these are set in your Render Dashboard:

| Variable | Value |
|----------|-------|
| `OLLAMA_BASE_URL` | `https://your-tunnel.trycloudflare.com` (change each session) |
| `LLM_MODEL` | `llama3.2:latest` |
| `EMBEDDING_MODEL` | `all-MiniLM-L6-v2` |
| `GNEWS_API_KEY` | `dbfb272946e69031abff6f13bba4dff9` |
| `MONGO_URI` | `mongodb+srv://...` (already set) |
| `JWT_SECRET` | `vertex-command-center-ultra-secret-2026` |
| `ENABLE_BYPASS_LOGIN` | `false` |
| `GOOGLE_CLIENT_ID` | Your Google OAuth ID |
| `GOOGLE_CLIENT_SECRET` | Your Google OAuth secret |
