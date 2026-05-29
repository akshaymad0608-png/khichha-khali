# KHALI KHICHHA

A simple expense tracker — track daily kharcha, see monthly totals, and sync with **Google (Gmail) login**.

## Run locally

```bash
npm install
cp .env.example .env
# Fill .env with Firebase keys (see below)
npm run dev
```

Open http://localhost:5173

## Use without login

**No account required.** Open the app and add expenses — history is saved in your browser (localStorage) on that device.

## Optional Google sync

Sign in with Google **only if** you want the same history on other phones. Data is stored in **Firebase Firestore** under your Google account.

### 1. Create Firebase project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. **Create project** (or use existing)
3. **Build → Authentication → Sign-in method → Google** → Enable → Save
4. **Build → Firestore Database** → Create database (production mode is fine)

### 2. Web app config

1. **Project settings** (gear) → **Your apps** → **Web** `</>`
2. Register app, copy config into `.env`:

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

3. Restart `npm run dev`

### 3. Authorized domains

**Authentication → Settings → Authorized domains** — add:

- `localhost`
- Your live domain (e.g. `your-app.netlify.app`)

### 4. Firestore security rules

**Firestore → Rules** — paste:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/wallet/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

Publish rules.

### Without Firebase

If `.env` is empty, the app runs in **device-only mode** (localStorage). A banner explains that Gmail sync is not configured.

## Features

- **Google sign-in** — data tied to Gmail account, syncs across devices
- **5 languages:** English, Hindi, Gujarati, Marathi, Tamil
- Add & edit expenses, quick favorites, budget, charts
- Simple mode, large text, light theme
- Backup / restore JSON file
- Export CSV

## Deploy

Build and deploy `dist` (Netlify, Vercel, etc.). Add the same `.env` variables in the host’s environment settings and your deploy URL to Firebase authorized domains.

```bash
npm run build
```
