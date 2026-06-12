# 🕉️ PanditConnect

A modern, multi-sided marketplace connecting devotees with verified Pandits for poojas, sanskars, and religious ceremonies. Built using a mobile-first approach, with a clean design system featuring white backgrounds, warm orange accents (`#F97316`), and clear navigation flows.

---

## 🚀 Key Features

### 🧑‍💼 Devotee (Customer) Experience
- **Smart Catalog Search:** Browse and search a complete catalog of poojas (e.g., Satyanarayan Katha, Griha Pravesh, Rudrabhishek) with predefined categories.
- **Detailed Pandit Profiles:** Compare pandits based on their rating, experience, languages spoken, and transparent upfront pricing.
- **Booking State Machine:** Seamless flow from booking requests, Pandit acceptance/decline, rescheduling, and ceremony completion.
- **Materials (Samagri) Checklist:** View required puja materials upfront so you know what is provided by the Pandit and what you need to arrange.
- **Verified Review System:** Only users with a completed booking can leave reviews, preventing fraudulent ratings.

### 🪔 Pandit (Service Provider) Experience
- **Multi-step Onboarding:** Simple registration wizard covering personal details, religious experience, offered services, and verification documents.
- **Inquiry Management:** Receive and manage booking requests in real-time. Accept, decline, or propose updates to bookings.
- **Revenue Dashboard:** Monitor earnings, completed ceremonies, active bookings, and customer feedback.
- **Materials Management:** Customize required materials and services for each ceremony offered.

### 🛡️ Admin Panel & Moderation
- **Verification Queue:** Review registration details and credentials of new Pandits before approving their profile to go live.
- **Platform Oversight:** Monitor bookings, users, and overall marketplace health.

### 🌐 Localization (i18n)
- **Multi-Language Support:** Full localization in **English**, **Hindi (हिन्दी)**, and **Gujarati (ગુજરાતી)** for a seamless native experience.

---

## 🛠️ Tech Stack

- **Framework:** [Next.js 15](https://nextjs.org/) (App Router)
- **Frontend library:** [React 19](https://react.dev/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Database:** [MongoDB Atlas](https://www.mongodb.com/atlas/database) with [Mongoose](https://mongoosejs.com/)
- **Authentication:** [NextAuth.js v5 (Beta)](https://authjs.dev/) (Credentials, OTP & Google OAuth)
- **Image Hosting & Storage:** [Cloudinary](https://cloudinary.com/)
- **Email Delivery:** SMTP via [Nodemailer](https://nodemailer.com/)
- **Internationalization:** [i18next](https://www.i18next.com/)

---

## 📂 Project Directory Structure

```bash
panditconnect/
├── actions/             # Next.js Server Actions (Auth, Booking, Customer, Pandit, etc.)
├── app/                 # Next.js App Router
│   ├── (admin)/         # Admin dashboard and verification routes
│   ├── (auth)/          # Authentication pages (Login, Register, OTP, Complete Profile)
│   ├── (customer)/      # Customer dashboard, onboarding, bookings, settings, and reviews
│   ├── (pandit)/        # Pandit dashboard, onboarding, service editing, inquiries, and revenue
│   ├── (public)/        # Landing page, public search, and public Pandit profile details
│   ├── api/             # API endpoints (Auth handler, verification check)
│   └── globals.css      # Core Tailwind CSS configuration & design tokens
├── components/          # Reusable UI components grouped by concern
│   ├── admin/           # Components for the Admin dashboard
│   ├── auth/            # Components for auth forms and OTP flow
│   ├── customer/        # Customer dashboard cards, forms, and search tools
│   ├── pandit/          # Registration wizard, profile form, and service editors
│   ├── shared/          # Global layout, Navbar, Footer, Language Switcher, etc.
│   └── ui/              # Shadcn primitives (Button, Input, Select, etc.)
├── lib/                 # Shared logic and utilities
│   ├── auth/            # Auth.js configurations
│   ├── db/              # MongoDB connection and database schemas/models
│   ├── validators/      # Zod validation schemas for forms and actions
│   └── utils.ts         # Utility helpers (cn, formatters, etc.)
├── locales/             # Localization JSON files (en.json, hi.json, gu.json)
├── scripts/             # Utility scripts (e.g. image asset generator)
└── types/               # TypeScript interfaces and global catalogues
```

---

## ⚙️ Setup & Installation

### 1. Clone the repository
```bash
git clone https://github.com/Website-At-Your-Doorstep/Pandit-Connect.git
cd Pandit-Connect
```

### 2. Install dependencies
Ensure you have `pnpm` installed globally:
```bash
pnpm install
```

### 3. Environment Variables Configuration
Create a `.env.local` file in the root directory and populate it with the appropriate values:
```env
# MongoDB Connection
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/PanditConnect
# Optional: Set custom DNS servers if Node cannot resolve SRV records
MONGODB_DNS_SERVERS=1.1.1.1,8.8.8.8

# Auth.js Configurations
NEXTAUTH_SECRET=your_auth_secret_key_here
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000

# SMTP (For Emails & OTP) — leave blank in dev to log instead of send
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_password
EMAIL_FROM="PanditConnect <noreply@example.com>"

# Cloudinary (Image uploads)
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Google OAuth (Optional)
AUTH_GOOGLE_ID=your_google_client_id
AUTH_GOOGLE_SECRET=your_google_client_secret
NEXT_PUBLIC_GOOGLE_ENABLED=false

# OTP Configs
OTP_EXPIRY_MINUTES=10
OTP_MAX_ATTEMPTS=5
```

### 4. Run the Development Server
```bash
pnpm dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser to see the application in action.

---

## 📦 Build for Production
To build the application for deployment:
```bash
pnpm build
pnpm start
```

---

## 🖼️ Media Asset Generation
If you need to upload standard mock graphics to Cloudinary, run the image generation script:
```bash
pnpm generate-images
```
*(Ensure Cloudinary credentials are set in your `.env.local` before executing).*

---

## 📄 License
This project is licensed under the MIT License.
