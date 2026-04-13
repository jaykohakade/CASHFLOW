# 💸 Cashflow — Fintech Business Website

A fully responsive modern fintech business website for **Cashflow**, a credit card cashflow service operating across Maharashtra, India.

---

## 🎨 Design System

| Token | Value |
|-------|-------|
| Background | `#FFFFE3` (warm cream) |
| Soft Purple | `#DBD4FF` |
| Olive Accent | `#808034` |
| Primary Purple | `#723480` |
| Fonts | Poppins (body) + Playfair Display (headings) |

---

## 🗂️ Project Structure

```
cashflow/
├── index.html
├── vite.config.js
├── package.json
│
├── src/
│   ├── App.jsx
│   ├── index.jsx
│   ├── components/
│   │   ├── Navbar.jsx       # Sticky navbar with smooth scroll + mobile hamburger
│   │   ├── Hero.jsx         # Animated credit card + CTA section
│   │   ├── Services.jsx     # 3 service cards with hover animations
│   │   ├── Reviews.jsx      # Multilingual testimonials (Marathi/Hindi/English)
│   │   ├── InquiryForm.jsx  # Contact form with frontend validation
│   │   └── Footer.jsx       # Map + newsletter + quick links
│   │
│   └── styles/
│       ├── global.css       # CSS variables, resets, shared utilities
│       ├── Navbar.css
│       ├── Hero.css
│       ├── Services.css
│       ├── Reviews.css
│       ├── InquiryForm.css
│       └── Footer.css
│
└── backend/                 # Folder structure (no implementation)
    ├── server.js
    ├── controllers/
    │   ├── inquiryController.js
    │   ├── newsletterController.js
    │   └── authController.js
    ├── routes/
    │   ├── inquiryRoutes.js
    │   ├── newsletterRoutes.js
    │   └── authRoutes.js
    ├── models/
    │   ├── Inquiry.js
    │   ├── Subscriber.js
    │   └── User.js
    └── config/
        ├── db.js
        └── .env.example
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation & Dev Server

```bash
# Install dependencies
npm install

# Start development server (opens at http://localhost:3000)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## 🧩 Components Overview

### Navbar
- Sticky with backdrop blur on scroll
- Typography logo: `₹ Cashflow`
- Smooth scroll navigation links
- "Get Started" CTA button
- Responsive hamburger menu for mobile

### Hero Section
- Animated CSS credit card (floating, rotating)
- Swipe animation indicator
- Floating notification badges (transaction alerts)
- Stats row: Volume / Clients / Processing Speed
- Dual CTA: "Get Started" + "Inquire for Franchise"

### Services Section
- 3 cards: Credit Card Swipe / Renewal / Application
- Each card: icon, tag, features list, hover lift animation
- Arrow CTA linking to contact form

### Reviews Section
- 6 testimonials: 2 Marathi, 2 Hindi, 2 English
- Sliding carousel with prev/next arrows
- Dot indicators
- Language badge per card

### Inquiry Form
- Fields: Name, Email, Mobile (Indian validation), Message
- Inline error messages with validation
- Loading spinner on submit
- Success state after submission

### Footer
- Google Maps embed (Sangamner, Maharashtra)
- Quick Links + Services columns
- Newsletter subscription with success state
- Social media links
- Copyright bar

---

## 🔧 Backend (Scaffold Only)

The `/backend` folder contains a complete Express.js scaffold ready to implement:

```bash
# When ready to implement backend:
cd backend
npm init -y
npm install express cors dotenv mongoose bcryptjs jsonwebtoken nodemailer

# Copy env template
cp config/.env.example config/.env
# Fill in your values

# Uncomment server.js and run:
node server.js
```

### Suggested Backend Stack
- **Runtime**: Node.js + Express.js
- **Database**: MongoDB + Mongoose
- **Auth**: JWT + bcryptjs
- **Email**: Nodemailer (Gmail / SendGrid)
- **Validation**: express-validator

---

## 📱 Responsive Breakpoints

| Breakpoint | Layout |
|------------|--------|
| `> 1024px` | Full desktop layout |
| `768–1024px` | Tablet: 2-col grids |
| `< 768px` | Mobile: hamburger menu, single column |
| `< 480px` | Extra small: compact padding, hidden decorative elements |

---

## ✨ Animations

- **Hero card**: CSS keyframe float + swipe thumb animation
- **Notification badges**: Staggered float animations
- **Services cards**: Hover lift + icon rotate
- **Review cards**: Hover lift + slide transition
- **Underline**: SVG path draw on page load
- **Blob backgrounds**: Slow radial drift

---

## 📄 License

MIT — Built for Cashflow Financial Services, Maharashtra, India.
