import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  RecaptchaVerifier, 
  signInWithPhoneNumber,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyCunBxf4I38HrBfjH4LJb1s3YZkm6hleJc",
  authDomain: "grabbit-753ff.firebaseapp.com",
  projectId: "grabbit-753ff",
  storageBucket: "grabbit-753ff.firebasestorage.app",
  messagingSenderId: "629550679093",
  appId: "1:629550679093:web:8e07038a859677a8555d7c"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export { RecaptchaVerifier, signInWithPhoneNumber, signInWithPopup };
