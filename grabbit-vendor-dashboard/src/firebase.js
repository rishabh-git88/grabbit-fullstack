import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  RecaptchaVerifier, 
  signInWithPhoneNumber,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

if (Object.values(firebaseConfig).some((value) => !value)) {
  throw new Error('Firebase environment variables are required');
}

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export { RecaptchaVerifier, signInWithPhoneNumber, signInWithPopup };
