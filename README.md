# 🛡️ CurseForge API Proxy Server for ReaLauncher

A dedicated, secure proxy server designed to act as a guardian between the **ReaLauncher** application and the **CurseForge API**.

---

## 🌟 Overview

Welcome to the backend side of things! This simple yet powerful proxy server has one main job: **Security**.

By using this server, we keep the sensitive **CurseForge API Key** safely hidden away from the client application. This prevents the key from being exposed to the public (or curious users), ensuring that your API quota remains safe and sound. 🔒

### Key Features
* **🕵️ Key Masking**: Keeps the API key purely server-side. The client never sees it.
* **🚧 CORS Protection**: Only allows requests from your specific launcher/domain.
* **⚡ Simple Forwarding**: Seamlessly passes requests to CurseForge and sends the data back home.

---

## 🚀 Quick Start Guide

Ready to get this running? It's easier than installing a modpack!

```bash
npm install
cp .env.example .env
PORT=3001
CURSEFORGE_API_KEY=your_super_secret_api_key_here
# For development (auto-restart)
npm run dev

# For production
npm start
```

---

## 📡 API Usage

Instead of calling CurseForge directly, point your launcher to this proxy.

**Before:**
```http
GET [https://api.curseforge.com/v1/mods/search?gameId=432](https://api.curseforge.com/v1/mods/search?gameId=432)
```

**After:**
```http
GET http://localhost:3001/v1/mods/search?gameId=432
```

The proxy handles the authentication headers for you! ✨

---

## 🛠️ Tech Stack

* **Node.js** - The runtime.
* **Express** - The web framework.
* **Axios** - For making requests.
* **Dotenv** - For keeping secrets secret.

---

## 📜 License

This project is licensed under the **MIT License**.
Feel free to fork, modify, and use it to build amazing things!

---

*Made with ❤️ for the Minecraft Modding Community.*