# Cashflow ERP

Cashflow is a comprehensive **Fintech Operations Management** system featuring a dual-dashboard architecture for centralized Administration and localized Branch management.

---

## 🏛 Architecture & Deployment Stack

This application has been structured securely to support split deployments across cloud services:

* **Frontend:** React + Vite (Deployed on [Vercel](https://vercel.com/))
* **Backend:** Node.js + Express + MongoDB (Deployed on [Render](https://render.com/))
* **Mail Server:** NodeMailer (Automated SMTP Emailing)

### Vercel / Render Integration (Environment Variables)
The frontend utilizes dynamic Vite variables to connect to your live Render backend without hardcoded URLs.
In your Vercel Dashboard Settings, ensure you declare the following Environment Variables exactly:
* `VITE_API_URL`: `https://cashflow-zghy.onrender.com/api` *(or your equivalent backend API route)*
* `VITE_BACKEND_URL`: `https://cashflow-zghy.onrender.com`

---

## 👥 User Management Structure

Cashflow implements a secure, role-based architecture bridging **Admins** and **Branch Managers**.

### Login Mechanism 🔑
Whenever a new user is created via the `/api/users` endpoint, the system **automatically sets their full Email as their strict Username**. 
When logging into the system, staff simply select their Role (👑 Admin / 🏢 Branch) and enter their **Email** and **Password**.

### Default Seeded Users
The application provides an automated Database Seeder script (`npm run seed`) which generates a primary Branch and these initial User accounts:

| Role | Name | Email (Username) | Password |
| :--- | :--- | :--- | :--- |
| **👑 Master Admin** | System Admin | `jay` | `Jayesh3002` |
| **🏢 Branch Manager** | Front Desk | `nilam` | `Nilam123` |

---

## ✉️ Automated Email Enquiries

Cashflow supports a fully modernized **Automated Inbox** in the Admin panel.
* Customer quotes submitted via the frontend `InquiryForm` generate a tracking ticket.
* Admins can click the **✉️ Reply** button directly inside the Dashboard.
* A live Modal generates a custom SMTP email parsing the customer's text.
* Sending hits the backend `POST /api/enquiries/:id/reply`, automatically routing the email dynamically via NodeMailer configured inside `backend/.env`.

---

## 💻 Local Development Guide

To clone and run this application purely on your local machine:

**1. Start the Backend:**
\`\`\`bash
cd backend
npm install
npm run seed  # Auto-hydrates MongoDB with users/branches
node server.js
\`\`\`

**2. Start the Frontend:**
\`\`\`bash
cd frontend
npm install
npm run dev
\`\`\`

*Note: For local environments, the frontend natively falls back to `http://localhost:5000` automatically. You only need explicit `.env` configurations if you wish to override and point your localhost to a live Render environment.*

---

## ©️ Copyright & License
&copy; 2026 Cashflow ERP. All rights reserved. 
Unauthorized copying, duplication, or distribution of this software's proprietary logic or codebase is strictly prohibited.
