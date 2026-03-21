# PropCall AI - Real Estate Voice Agent Platform

An advanced AI-powered voice agent platform built with Next.js, Node.js, and Supabase. Seamlessly integrates Twilio WebSockets, Deepgram STT, and Sarvam TTS to conduct real-time, zero-latency phone calls in multiple languages, automating customer support for real estate businesses.

## 🚀 Features

- **Client Dashboard**: Upload leads, manage campaigns, view analytics
- **AI Voice Agent**: Automated calling with intelligent conversation
- **WhatsApp Integration**: Share property details, images, and location
- **Lead Management**: Smart scoring and follow-up automation
- **Real-time Analytics**: Track calls, conversions, and performance

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: (To be decided: Node.js or Python)
- **Voice Stack**: Twilio WebSockets, Deepgram STT, Sarvam TTS
- **Database**: PostgreSQL (Supabase)
- **Storage**: Supabase Storage
- **Hosting**: Vercel (frontend), Supabase (backend)

## 📦 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Git

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
src/
├── app/              # Next.js app router pages
├── components/       # React components
│   ├── dashboard/   # Dashboard-specific components
│   ├── auth/        # Authentication components
│   └── ui/          # shadcn/ui components
├── lib/             # Utility functions and services
│   └── services/    # API service functions
├── types/           # TypeScript type definitions
└── config/          # Configuration files
```

## 🎯 Current Status

**Phase 1: MVP Foundation** - In Progress

- [x] Next.js project setup
- [x] TypeScript + Tailwind + shadcn/ui configuration
- [ ] Supabase integration
- [ ] Authentication system
- [ ] Excel upload functionality

## 📄 License

MIT

## 👥 Author

Built as a learning project

