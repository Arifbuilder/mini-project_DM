# 🌍 DisasterIntel — Real-Time Disaster Intelligence Platform

A production-grade, real-time disaster monitoring system with a premium Apple-inspired UI, interactive map, live data feeds, and smart risk scoring.

## 🏗️ Architecture

```
backend/     → Express + Socket.IO + Prisma (SQLite)
frontend/    → Next.js 15 + React + Framer Motion + Leaflet
```

## ⚡ Quick Start

### 1. Backend

```bash
cd backend
npm install
npx prisma generate
npx prisma db push
npm run dev
```

Backend runs on **http://localhost:5000**

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on **http://localhost:3000**

## 📡 Data Sources

| Source | Type | URL |
|--------|------|-----|
| USGS | Earthquakes | earthquake.usgs.gov |
| NASA EONET | Wildfires, storms, floods, volcanoes | eonet.gsfc.nasa.gov |
| GDACS | Multi-hazard alerts | gdacs.org |
| OpenWeatherMap | Weather alerts (optional API key) | openweathermap.org |

## 🔑 Environment Variables

### Backend (`backend/.env`)
```
PORT=5000
JWT_SECRET=your-secret-key
DATABASE_URL="file:./dev.db"
OPENWEATHERMAP_API_KEY=your_key_here  # optional
FRONTEND_URL=http://localhost:3000
```

### Frontend (`frontend/.env.local`)
```
NEXT_PUBLIC_API_URL=http://localhost:5000
```

## ✨ Features

- 🗺️ Interactive map with real-time disaster markers
- 🔴 Color-coded, severity-scaled pulse markers
- 📊 Risk scoring engine (proximity × severity × recency)
- 🔔 Live alert feed with WebSocket updates
- 🔐 JWT auth with guest mode
- 🎨 Glassmorphic dark/light UI with Framer Motion animations
- 📡 Auto-polling from USGS, NASA, and GDACS every 5 minutes
- 📍 Location-based filtering with Haversine distance
