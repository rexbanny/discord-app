# 🤖 Discord Gemini AI Bot

A smart and lightweight Discord bot powered by **Google Gemini 2.5 Flash API** and **Discord.js v14**. Built with Node.js, this bot delivers fast AI-driven text responses directly in Discord text channels and direct messages (DMs).

---

## 🚀 Features

- 💬 **AI Text Responses:** Responds to user mentions and Direct Messages using `gemini-2.5-flash`.
- ⚡ **Real-time Interaction:** Automatically triggers typing indicators when generating responses.
- 🔊 **Voice Channel Integration:** Connects and disconnects from voice channels via simple commands (`!join`, `!leave`).
- 🔒 **Secure Configuration:** Environment variable integration for API keys and tokens.

---

## 📋 Prerequisites

Make sure you have the following installed on your machine before starting:

- **Node.js** (v18.0.0 or higher) — [Download Node.js](https://nodejs.org/)
- **npm** (Node Package Manager)
- **Git** — [Download Git](https://git-scm.com/)

---

## 🛠️ Step-by-Step Installation Guide

### Step 1: Create a Discord Developer Application

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications).
2. Click **"New Application"**, enter a name for your bot, and click **Create**.
3. Go to the **Bot** tab on the left menu:
   - Click **"Reset Token"** (or "Add Bot") to generate your **Discord Bot Token**. Copy and save this token securely.
   - Scroll down to **Privileged Gateway Intents** and enable the following:
     - ✅ **Presence Intent**
     - ✅ **Server Members Intent**
     - ✅ **Message Content Intent** (Crucial for receiving commands)
4. Go to **OAuth2 -> URL Generator**:
   - Under **Scopes**, check: `bot`.
   - Under **Bot Permissions**, check:
     - `Send Messages`
     - `Read Message History / View Channels`
     - `Connect`
     - `Speak`
   - Copy the generated URL at the bottom, paste it into your browser, and invite the bot to your Discord server.

---

### Step 2: Get Google Gemini API Key

1. Visit [Google AI Studio](https://aistudio.google.com/).
2. Sign in with your Google Account.
3. Click **"Get API key"** -> **"Create API key in new project"**.
4. Copy your generated **Gemini API Key**.

---

### Step 3: Clone the Repository & Install Dependencies

Open your terminal/command prompt and run:

```bash
# Clone this repository
git clone [https://github.com/rexbanny/discord-app.git](https://github.com/rexbanny/discord-app.git)

# Navigate into the project folder
cd discord-gemini-bot

# Install required npm packages
npm install