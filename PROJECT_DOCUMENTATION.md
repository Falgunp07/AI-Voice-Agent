# 🎙️ PropCall AI: Project Documentation

Welcome to the PropCall AI developer documentation! If you are a new developer joining the project, this guide is designed to help you quickly understand what this app does, how the pieces fit together, and how to run it.

---

## 🌟 What is PropCall AI?

PropCall AI is a **B2B Software-as-a-Service (SaaS)** platform built for real estate agencies. 
Instead of hiring human telecallers, agencies (merchants) can log into our dashboard, upload a list of phone numbers, and have a hyper-realistic AI Voice Agent call those leads. The AI can pitch properties, answer questions in natural Hindi/English, overcome objections, and try to schedule follow-up appointments.

---

## 🏗️ The Architecture (How it fits together)

This project is a Monorepo containing two main halves:

### 1. The Frontend (Next.js)
Located in `src/`. This is the visual dashboard merchants use.
* **Tech:** Next.js 15, React 19, TailwindCSS.
* **Purpose:** Handles Authentication, displaying Analytics, uploading property details, and letting the user trigger the Auto-Dialer. 
* **Auth Layers:** 
  * `/admin/...` is a hardcoded secret portal for system administrators (Falgun/Yash).
  * `/dashboard/...` is the secure portal restricted to individual merchants via Supabase Auth.

### 2. The Backend Voice Engine (Node.js)
Located in `server/`. This is the "brain" that actually handles the live phone calls.
* **Tech:** Node.js, Express, WebSockets (`ws`).
* **Purpose:** Acts as the middleman between the phone call and the AI APIs. It needs to process audio streams with near-zero latency.

---

## 🧠 How the AI Voice Call Actually Works

When a call connects, Twilio streams raw audio bytes to our Node.js backend over a WebSocket connection. Our server then runs a continuous, high-speed loop:

1. **HEARING (Speech-To-Text):** 
   We pipe the audio stream directly to **Deepgram**. Deepgram converts the user's spoken Hindi/English into raw text in milliseconds. 
2. **THINKING (Language Model):** 
   We send that text transcript to **Groq** (running Llama 3.3 70B). The AI reads the system prompt (its "persona"), looks at the conversation history, and calculates a response. Groq is used because it is insanely fast.
3. **SPEAKING (Text-To-Speech):** 
   We immediately stream the AI's text response to **ElevenLabs** (or Sarvam). They convert the text into highly realistic, human-sounding audio bytes, which we pipe straight back down the WebSocket to Twilio for the user to hear.

*All of this happens in under 800 milliseconds!*

---

## 🗄️ Database Strategy (Multi-Tenancy)

We use **Supabase** (PostgreSQL) for our database. 

Because this is a SaaS platform with many different agencies, we use a **Multi-Tenant** structure. 
Every core table (`properties`, `leads`, `call_logs`, `campaigns`) has a `user_id` column. We use Supabase **Row Level Security (RLS)** to enforce that whenever a merchant queries the database, Postgres *only* returns rows that match their specific `user_id`. 

*(This means the frontend code does not need complex filtering logic—the security is handled at the database layer!)*

---

## 🔑 External Services & API Keys Needed

Because this is an AI-native SaaS, it relies heavily on external cloud providers for its "brain" and voicing. Before a developer can run this locally, they MUST create free accounts and get API keys for the following 6 services (put them in `.env.local`):

1. **Supabase:** Provides the PostgreSQL Database and User Authentication system. You need the `URL` and `ANON_KEY`.
2. **Twilio:** You must buy a phone number here. It handles routing the actual phone call to our server. You need `ACCOUNT_SID` and `AUTH_TOKEN`.
3. **Groq:** The inference engine that runs the `Llama 3.3 70B` model. We use Groq instead of OpenAI because it processes text incredibly fast (low latency is vital for voice calls).
4. **Deepgram:** The ultimate Speech-to-Text (STT) engine. Converts the caller's spoken audio into text instantly. 
5. **ElevenLabs (or Sarvam AI):** The Text-to-Speech (TTS) engine. Turns the AI's written response back into human-sounding audio bytes.
6. **Ngrok:** Required for local development so Twilio can reach your `localhost` when testing calls.

---

## 📦 Core Libraries & Dependencies

If you browse the `package.json`, you will see hundreds of packages, but these are the critical ones that power the app:

**Backend (Node/Express):**
* `express` & `cors` - Runs the API backend.
* `ws` - The WebSocket library used for two-way audio streaming with Twilio.
* `twilio` - The official server SDK to trigger outbound Auto-Dialer calls.
* `@deepgram/sdk` & `groq-sdk` - The official client libraries for our AI pipeline.
* `@supabase/supabase-js` - To read/write to the database from the server.

**Frontend (Next.js):**
* `next` & `react` - The core UI framework.
* `tailwindcss` - For all global styling.
* `lucide-react` - For the beautiful, clean icons used across the dashboard.
* `@supabase/ssr` - Server-side rendering helpers to securely check if a merchant is logged in.

---

## 💻 Developer Setup Guide

If you are cloning this repository to run it on your local laptop, here is how you test it:

### 1. Start the Environment
Wait for dependencies to install, then start the frontend and backend simultaneously.
```bash
npm install
npm run dev      # Starts Next.js Dashboard on localhost:3000
npm run server   # Starts Node Voice Engine on localhost:4000
```

### 2. Connect Twilio to your Localhost
Because Twilio sits on the public internet, it cannot reach your `localhost:4000`. You must create a tunnel.
```bash
# In a new terminal window:
ngrok http 4000
```
* Take the public URL ngrok gives you (e.g., `https://random-words.ngrok-free.app`)
* Paste it into your `.env.local` file under `SERVER_PUBLIC_URL`.
* Paste `<YOUR-NGROK-URL>/api/voice` into the Twilio Dashboard inside the Webhook configuration for your phone number.

### 3. Deploying to Production
When deploying to the real world, we abandon `ngrok`. 
The frontend is deployed to **Vercel**, and the Node.js backend is deployed to **Render** using the `render.yaml` configuration file included in the repository.

---

## 🗺️ Key Files to Know

If you want to read the code, start here:
* `server/services/voice-stream.ts` - The crown jewel of the project. This handles the complex real-time audio WebSocket looping.
* `server/routes/ai-chat.ts` - Contains the primary "System Prompt" that dictates the AI's personality.
* `src/middleware.ts` - The security guard controlling who can access `/dashboard` versus who can access `/admin`.
* `multi-tenant-migration.sql` - Outlines the core database structure and RLS security policies.

*Happy Coding!* 🚀
