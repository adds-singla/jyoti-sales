import { initializeApp, FirebaseApp } from 'firebase/app'
import { getAuth, Auth } from 'firebase/auth'

const apiKey = import.meta.env.VITE_FIREBASE_API_KEY

// Only initialize Firebase when a real API key is configured.
// Without it the app still works — Google/Phone login will be disabled.
let app: FirebaseApp | null = null
let auth: Auth | null = null

if (apiKey && apiKey.length > 10) {
  app = initializeApp({
    apiKey,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  })
  auth = getAuth(app)
} else {
  console.warn('[Firebase] VITE_FIREBASE_API_KEY not set — Google/Phone auth disabled.')
}

export { auth }
export default app
