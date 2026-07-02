# Chanda BC Manager

Production-ready React app foundation for managing the private Chanda family BC business.

## Tech Stack

- React + Vite
- JavaScript
- Tailwind CSS
- React Router
- React Hook Form
- Lucide React Icons
- Day.js
- React Calendar
- React Hot Toast
- Firebase Authentication, Firestore, and Hosting

## Features Included

- Responsive app layout for desktop and mobile
- Dashboard with group counts, today's collection, upcoming BC dates, and member month-wise payment editing
- BC groups table with amount, duration, collection day, winner day, status, and dates
- Members table with contact, nominee, joined groups, pending amount, and status
- Payments table with paid/pending toggle
- Winner history
- Calendar for collection dates, winner announcements, pending payments, and events
- Reports summary
- Settings form for business profile defaults
- Firebase Firestore data loading and payment/date saving when `.env.local` is configured
- Firebase config, Firestore rules, and hosting files

## Getting Started

```bash
npm install
npm run dev
```

Create `.env.local` from `.env.example` and fill in your Firebase project values.

```bash
cp .env.example .env.local
```

The app uses local preview data until Firebase values are added. See [Firebase launch checklist](docs/firebase-launch.md).

## Build

```bash
npm run build
```

## Deploy To Firebase Hosting

```bash
npm run build
firebase deploy
```

Update `.firebaserc` with your real Firebase project ID before deploying.
