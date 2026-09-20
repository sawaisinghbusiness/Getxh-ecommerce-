# 🚀 GETXH Backend Migration & Setup Documentation (Temporary Render + Vercel Setup)

> **Date:** 19 September 2026  
> **Status:** 100% Operational & Live  
> **Cost:** ₹0 / Free Tier  
> **Purpose:** Hostinger VPS expire hone par temporarily saare backends ko Render + Vercel par shift kiya gaya hai bina VPS ka data/code chhue. Jab VPS renew hoga, tab wapas easily switch kar sakte hain.

---

## 🏗️ 1. Architecture Overview

```
                        ┌───────────────────────────────┐
                        │   Frontend (getxh.in / GitHub) │
                        └──────────────┬────────────────┘
                                       │
        ┌──────────────────────────────┼─────────────────────────────┐
        │                              │                             │
        ▼                              ▼                             ▼
┌──────────────────┐       ┌──────────────────────┐       ┌──────────────────────┐
│   Orders API     │       │   Wallet & Payment   │       │     OTP & Auth       │
│  (Render Node)   │       │   (Render Docker)    │       │    (Render Node)     │
└──────────────────┘       └──────────┬───────────┘       └──────────────────────┘
                                      │
                                      ▼
                           ┌──────────────────────┐
                           │ Mumbai Proxy (bom1)  │
                           │   (Vercel Function)  │
                           └──────────┬───────────┘
                                      │
                                      ▼
                           ┌──────────────────────┐
                           │ BharatPe UPI Gateway │
                           │  (200 OK Domestic)   │
                           └──────────────────────┘
```

---

## 🌐 2. Deployed Services & Repositories

### 1️⃣ Orders API Backend
* **Service Name:** `backend-for-api-connect`
* **Hosted on:** Render (`Node.js`)
* **Live URL:** `https://backend-for-api-connect-g8ta.onrender.com`
* **GitHub Repo:** `https://github.com/sawaisinghbusiness/backend-for-api-connect.git` (Branch: `main`)
* **Key Endpoints:**
  * `POST /order` — New SMM order placement & drip feed
  * `GET /status/:orderId` — Real-time order status
  * `POST /refill` — Order refill
  * `POST /cancel` — Order cancel
  * `GET /health` — Health check endpoint for UptimeRobot
* **Environment Variables:**
  * `API_KEY` = `(WholesaleSMMStore API Key)`
  * `PORT` = `10000`

---

### 2️⃣ Wallet & Payment Backend
* **Service Name:** `backend-for-payment-system-getxh`
* **Hosted on:** Render (`Docker` — PHP 8.1 + Apache + MongoDB extension)
* **Live URL:** `https://backend-for-payment-system-getxh-f7fw.onrender.com`
* **GitHub Repo:** `https://github.com/sawaisinghbusiness/backend-for-payment-system-getxh.git` (Branch: `master`)
* **Key Endpoints:**
  * `POST /verify-payment.php` — BharatPe UTR verification & wallet balance credit
  * `GET /health.php` — Health check endpoint for UptimeRobot
* **Environment Variables on Render:**
  * `MONGODB_URI` = `(MongoDB Atlas Cluster0 URI)`
  * `MONGODB_DB` = `upi_wallet`
  * `BHARATPE_TOKEN` = `(32-char BharatPe Token)`
  * `BHARATPE_API_URL` = `https://getxh-mumbai-proxy.vercel.app/api/transactions` *(Mumbai Proxy)*
  * `BHARATPE_MERCHANT_ID` = `68844870`
  * `BHARATPE_TEST_MODE` = `false`
  * `DAILY_LIMIT_INR` = `20000`
  * `ADMIN_USER` = `admin`
  * `ADMIN_PASS` = `admin`

---

### 3️⃣ BharatPe Mumbai Edge Proxy (Crucial Fix)
* **Problem Solved:** BharatPe ka Cloudflare WAF India ke bahar ki saari foreign IPs (Render USA) ko `HTTP 403 Forbidden` challenge page de raha tha.
* **Solution:** Ek lightweight Vercel Serverless Function banaya jo **Mumbai (`bom1`)** region se request forward karta hai.
* **Hosted on:** Vercel (Region: `bom1` - Mumbai, India)
* **Live URL:** `https://getxh-mumbai-proxy.vercel.app`
* **GitHub Repo:** `https://github.com/sawaisinghbusiness/GETXH-MUMBAI-PROXY.git` (Branch: `main`)
* **Key Endpoints:**
  * `GET /api/transactions` — Forwards request to BharatPe from Indian IP
  * `GET /api/ping` — Health check (`region: bom1 (Mumbai)`)

---

### 4️⃣ OTP, Auth & Password Reset Backend
* **Service Name:** `backend-for-email-verification-code`
* **Hosted on:** Render (`Node.js`)
* **Live URL:** `https://backend-for-email-verification-code-vwip.onrender.com`
* **GitHub Repo:** `https://github.com/sawaisinghbusiness/backend-for-email-verification-code-.git` (Branch: `main`)
* **Key Endpoints:**
  * `POST /send-otp` — Sends 6-digit OTP email via Brevo API
  * `POST /verify-otp` — Validates entered OTP
  * `POST /save-user` — Saves registered user to MongoDB
  * `POST /reset-password` & `POST /api/reset-password` — Updates password via Firebase Admin SDK
  * `GET /health` — Health check endpoint for UptimeRobot
* **Environment Variables:**
  * `BREVO_API_KEY` = `(Stored in Render Environment Variables)`
  * `MONGODB_URI` = `(MongoDB Atlas Cluster0 URI)`
  * `PORT` = `10000`
  * `FIREBASE_SERVICE_ACCOUNT` = `(Stored in Render Environment Variables)`

---

## 🛠️ 3. Frontend Code Changes (getxh web 01)

Sabhi HTML files mein purana band pada VPS URL (`https://getxh.online`) replace karke naye Render URLs daale gaye:

| File | Purana URL | Naya Render URL |
|---|---|---|
| `wallet/index.html` | `https://getxh.online/payment` | `https://backend-for-payment-system-getxh-f7fw.onrender.com` |
| `wallet/index.html` | `https://getxh.online` | `https://backend-for-email-verification-code-vwip.onrender.com` |
| `payment-success/index.html` | `https://getxh.online/payment` | `https://backend-for-payment-system-getxh-f7fw.onrender.com` |
| `dashboard/index.html` | `https://getxh.online/api/order` | `https://backend-for-api-connect-g8ta.onrender.com/order` |
| `dashboard/index.html` | `https://getxh.online/api/status/` | `https://backend-for-api-connect-g8ta.onrender.com/status/` |
| `dashboard/index.html` | `const _API = "https://getxh.online/api"` | `const _API = "https://backend-for-api-connect-g8ta.onrender.com"` |
| `dashboard/index.html` | `const _OTP = "https://getxh.online"` | `const _OTP = "https://backend-for-email-verification-code-vwip.onrender.com"` |
| `orders/index.html` | `https://getxh.online/api/status/` | `https://backend-for-api-connect-g8ta.onrender.com/status/` |
| `orders/index.html` | `https://getxh.online/api/refill` | `https://backend-for-api-connect-g8ta.onrender.com/refill` |
| `orders/index.html` | `https://getxh.online/api/cancel` | `https://backend-for-api-connect-g8ta.onrender.com/cancel` |
| `register/index.html` | `https://getxh.online/send-otp` | `https://backend-for-email-verification-code-vwip.onrender.com/send-otp` |
| `register/index.html` | `https://getxh.online/verify-otp` | `https://backend-for-email-verification-code-vwip.onrender.com/verify-otp` |
| `register/index.html` | `https://getxh.online/save-user` | `https://backend-for-email-verification-code-vwip.onrender.com/save-user` |
| `verify-otp/index.html` | `https://getxh.online/send-otp` | `https://backend-for-email-verification-code-vwip.onrender.com/send-otp` |
| `verify-otp/index.html` | `https://getxh.online/verify-otp` | `https://backend-for-email-verification-code-vwip.onrender.com/verify-otp` |
| `forgot-password/index.html` | `https://getxh.online/send-otp` | `https://backend-for-email-verification-code-vwip.onrender.com/send-otp` |
| `reset-password/index.html` | `https://getxh.online/api/reset-password` | `https://backend-for-email-verification-code-vwip.onrender.com/api/reset-password` |
| `index.html` | `https://getxh.online/save-user` | `https://backend-for-email-verification-code-vwip.onrender.com/save-user` |
| `admin/index.html` | `var BACKEND_URL = "https://getxh.online"` | `var BACKEND_URL = "https://backend-for-email-verification-code-vwip.onrender.com"` |

*Saare changes GitHub repo `sawaisinghbusiness/Getxh-ecommerce-` ke `master` branch par push kar diye gaye hain.*

---

## ⚡ 4. 24/7 Keep-Alive Setup (UptimeRobot)

Render free tier par 15 minute baad servers sleep ho jaate hain. Isko prevent karne ke liye **UptimeRobot** par 3 monitors active kiye gaye hain jo har **5 minute** mein ping bhejte hain:

1. `https://backend-for-api-connect-g8ta.onrender.com/health` ➔ `200 OK` 🟢
2. `https://backend-for-payment-system-getxh-f7fw.onrender.com/health.php` ➔ `200 OK` 🟢
3. `https://backend-for-email-verification-code-vwip.onrender.com/health` ➔ `200 OK` 🟢

*Result: Server hamesha 24/7 bina kisi delay/freeze ke active rahega, chahe laptop band rahe.*

---

## 🔄 5. Future Revert Instructions (When Hostinger VPS is Renewed)

Jab tum Hostinger VPS renew kar loge aur `https://getxh.online` wapas chalu ho jayega, toh switch back karna bohot aasan hai:

1. **Frontend files mein Find & Replace karo:**
   * `https://backend-for-api-connect-g8ta.onrender.com` ➔ `https://getxh.online/api`
   * `https://backend-for-payment-system-getxh-f7fw.onrender.com` ➔ `https://getxh.online/payment`
   * `https://backend-for-email-verification-code-vwip.onrender.com` ➔ `https://getxh.online`
2. **Git commit & push karo:**
   ```bash
   git add -A
   git commit -m "revert: switch backend URLs back to renewed Hostinger VPS"
   git push origin master
   ```
3. **VPS ka koi bhi code change nahi hua hai** — Hostinger VPS ka saara data, Nginx config, aur setup bilkul as-it-is safe hai!
