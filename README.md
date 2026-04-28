# ⛳ GolfHeroes

A full-stack golf performance platform where users submit their scores, enter monthly draws, and compete for prizes while supporting charities.

---

## 🚀 Live Demo

- 🌐 Website: https://golfheroes.vercel.app  
- 👤 Dashboard: https://golfheroes.vercel.app/dashboard  
- 🛠 Admin Panel: https://golfheroes.vercel.app/admin  

---

## 🧩 Features

### 👤 Authentication
- User signup/login with Supabase Auth
- Persistent sessions
- Auto profile creation

### 📊 Score System
- Users can submit Stableford scores (1–45)
- Rolling **last 5 scores** only
- Adding a 6th score replaces the oldest
- Unique date restriction per score

### 🎯 Draw System (Core Logic)
- Random & algorithmic draw generation
- Match calculation (3, 4, 5 tiers)
- Prize pool and breakdown logic
- Winner simulation system

### 🏆 Dashboard
- View recent scores
- Track performance
- See draw participation

### 🛠 Admin Panel
- Manage users
- Manage draws
- View analytics and winners

---

## 🛠 Tech Stack

### Frontend
- React (Vite)
- TypeScript
- Tailwind CSS
- React Router

### Backend
- Supabase (PostgreSQL + Auth + RLS)

### Deployment
- Vercel

---

## 🔐 Environment Variables

Create a `.env` file:

```env
VITE_SUPABASE_URL=[your_supabase_url](https://ykqagzrjekocjjccikzm.supabase.co/rest/v1/)
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlrcWFnenJqZWtvY2pqY2Npa3ptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczNjA5MzMsImV4cCI6MjA5MjkzNjkzM30.D5I65j3w6ABMJsAUHLatOacouOy3z5OFsH1JUVvs5bM
