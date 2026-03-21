# InterviewAI 🎤

> AI-powered real-time interview assistant — invisible to interviewers

## Features

- 🎤 Real-time speech recognition + AI answers (streamed)
- 👻 Invisible Mode — popup window hidden from screen share
- 🇮🇳 Desi Mode — natural Indian English responses
- 🎯 Mock Interview with scoring and feedback
- 📄 AI Resume Builder with PDF export
- 🌍 52+ language support

## Tech Stack

- Next.js 14 + TypeScript
- Tailwind CSS
- Groq AI (llama-3.3-70b-versatile)
- PostgreSQL + Prisma (Supabase)
- NextAuth.js
- Zustand

## Setup

1. **Clone the repo**

   ```bash
   git clone https://github.com/YOUR_USERNAME/interviewai.git
   cd interviewai
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Copy environment variables**

   Copy `.env.example` to `.env.local` and fill in your real values (never commit `.env.local`).

   ```bash
   # macOS / Linux
   cp .env.example .env.local
   ```

   ```powershell
   # Windows PowerShell
   Copy-Item .env.example .env.local
   ```

4. **Set up the database**

   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Run the development server**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Environment variables

See `.env.example` for all required variables. **Never commit `.env.local` to git.**

## GitHub

After creating an empty repository on GitHub:

```bash
git remote add origin https://github.com/YOUR_USERNAME/interviewai.git
git branch -M main
git push -u origin main
```

Replace `YOUR_USERNAME` with your GitHub username.
