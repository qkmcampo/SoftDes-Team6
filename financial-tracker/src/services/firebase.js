import { initializeApp } from "firebase/app";
import {
  browserLocalPersistence,
  getAuth,
  GoogleAuthProvider,
  OAuthProvider,
  setPersistence,
} from "firebase/auth";

const firebaseConfig = {
  apiKey:
    import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCEn8zcWg4W5vuRPPR9WeYD1XXItucNfBI",
  authDomain:
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ||
    "financial-tracker-55f50.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "financial-tracker-55f50",
  storageBucket:
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ||
    "financial-tracker-55f50.firebasestorage.app",
  messagingSenderId:
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "483258465861",
  appId:
    import.meta.env.VITE_FIREBASE_APP_ID ||
    "1:483258465861:web:38f8e41681f5a8066f2d2c",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-WY12YEGDRD",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
const appleProvider = new OAuthProvider("apple.com");

googleProvider.setCustomParameters({
  prompt: "select_account",
});

appleProvider.addScope("email");
appleProvider.addScope("name");

setPersistence(auth, browserLocalPersistence).catch(() => {
  // Keep the app usable even if the browser blocks persistence setup.
});

export { appleProvider, auth, googleProvider };
