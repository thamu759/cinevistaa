# ThiraiPedia Staging Server Guide

This project includes a dedicated **Staging Environment** isolated from production.

---

## 🏗️ Staging Architecture

| Component | Production | Staging |
|---|---|---|
| **Frontend Port / URL** | `http://localhost:5173` / `cinevistaa.in` | `http://localhost:5174` / `staging.cinevistaa.in` |
| **Backend Port / URL** | `http://localhost:5000` | `http://localhost:5001` |
| **Database File** | `server/db.json` | `server/db.staging.json` (Isolated clone) |
| **MongoDB (Optional)** | `Cluster0 / thiraipedia` | `Cluster0 / thiraipedia_staging` |
| **Environment File** | `server/.env` & `client/.env` | `server/.env.staging` & `client/.env.staging` |
| **Watermark** | None | Floating Amber `STAGING ENVIRONMENT` Pill |

---

## 🚀 How to Run Staging Locally

### Option 1: One-Click Script (Windows)
Double-click `start-staging.bat` in the project root.

### Option 2: Terminal Commands

**Terminal 1 (Staging Backend - Port 5001):**
```bash
cd server
npm run staging
```

**Terminal 2 (Staging Frontend - Port 5174):**
```bash
cd client
npm run dev:staging
```

Open `http://localhost:5174` in your browser. You will see the floating **STAGING ENVIRONMENT** badge in the bottom-left corner.

---

## 🔒 Data Isolation Guarantee

When the staging server starts for the first time, it automatically creates an isolated clone of `db.json` named `db.staging.json`.
- Testing movie deletions, reviews, or CMS settings in staging **will NOT touch** production data.
- If using MongoDB, specify a separate `MONGO_URI` with database name `thiraipedia_staging` in `server/.env.staging`.

---

## ☁️ Cloud Deployment (Render & Netlify)

### 1. Render (Backend Staging)
A dedicated `render.staging.yaml` blueprint is provided:
- Branch: `staging`
- Start Command: `node staging.js`
- Port: `10000` (internal)
- Database: `db.staging.json` or staging MongoDB

### 2. Netlify (Frontend Staging)
`netlify.toml` contains `[context.staging]` configuration:
- Pushing to the `staging` git branch triggers an automatic staging build with `--mode staging`.
- Connects automatically to your staging backend URL.

