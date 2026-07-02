# Firebase Launch Checklist

## 1. Create Firebase Project

Create a Firebase project, then enable:

- Firestore Database
- Firebase Hosting
- Firebase Authentication

## 2. Add Web App Config

Copy `.env.example` to `.env.local` and paste the Firebase web app values.

```bash
cp .env.example .env.local
```

Required values:

- VITE_FIREBASE_API_KEY
- VITE_FIREBASE_AUTH_DOMAIN
- VITE_FIREBASE_PROJECT_ID
- VITE_FIREBASE_STORAGE_BUCKET
- VITE_FIREBASE_MESSAGING_SENDER_ID
- VITE_FIREBASE_APP_ID

## 3. Firestore Collections

The app reads and writes these collections:

- groups
- members
- payments
- winners
- events

If Firestore is empty, the app shows local preview data. Payment edits and date edits are saved to Firestore when Firebase is configured.

## 4. Security Rules

`firestore.rules` currently allows access only to signed-in Firebase users.

For first private launch, create Firebase Authentication users for:

- Santoshi Chanda
- Ravi Balate

Use email/password sign-in. The app will show the login screen automatically when Firebase is configured.

## 5. Run Locally

```bash
npm install
npm run dev
```

## 6. Build

```bash
npm run build
```

## 7. Deploy

Update `.firebaserc` with the real Firebase project ID, then run:

```bash
firebase deploy
```
