# Oyin's Girlies - Full Stack Deployment Guide

This project is a modern boutique website with a Node.js backend and a Neon PostgreSQL database.

## 🚀 Part 1: Host the Backend (Server)
GitHub Pages cannot run your `server.js`. You need a backend host (like **Render** or **Railway**).

1.  **Create a New Web Service** on [Render.com](https://render.com).
2.  **Connect your GitHub Repo.**
3.  **Set Environment Variables:**
    *   `DATABASE_URL`: *Your Neon Connection String (find it in Neon dashboard)*
    *   `PORT`: `10000`
4.  **Build Command:** `npm install`
5.  **Start Command:** `node server.js`
6.  **Copy the URL** Render gives you (e.g., `https://oyins-girlies-backend.onrender.com`).

## 🌐 Part 2: Update the Frontend
1.  Open `script.js`.
2.  Find the `fetch` call (around line 75).
3.  Replace `http://localhost:1000/api/orders` with your **Render URL** + `/api/orders`.
4.  Commit and push your changes to GitHub.

## 📦 Part 3: Deploy to GitHub Pages
1.  Go to your GitHub Repository **Settings**.
2.  Select **Pages** from the sidebar.
3.  Set the **Source** to "Deploy from a branch" and select `main`.
4.  Your site will be live at `https://yourusername.github.io/oyins-girlies`.

## 🗄️ Part 4: Database Management (Neon)
Your database is already configured in `server.js`. To view your orders:
1.  Log in to [Neon.tech](https://neon.tech).
2.  Go to the **SQL Editor**.
3.  Run: `SELECT * FROM orders;`

## 📧 Part 5: Email Notifications Setup
To receive order notifications at the specified emails:

1.  **Enable 2-Step Verification** on the Gmail account you want to use to *send* the emails (e.g., your boutique's email).
2.  **Generate an App Password:**
    *   Go to your Google Account Settings > Security.
    *   Search for "App passwords".
    *   Create a new one (select "Mail" and "Other (Custom name)" like "Boutique Website").
    *   Google will give you a 16-character code.
3.  **Update Environment Variables (on Render):**
    *   `EMAIL_USER`: Your Gmail address.
    *   `EMAIL_PASS`: The 16-character App Password (no spaces).
    *   `NOTIFY_EMAILS`: `folakemiomokafe242@gmail.com, abdulmumeenapata72@gmail.com`

---
**Happy Selling!** 💄✨
