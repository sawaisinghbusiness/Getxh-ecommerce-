import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyClO8clBVgSHKx8jarNwC38oMtWRK0W8KE',
  authDomain: 'getxh-42588.firebaseapp.com',
  projectId: 'getxh-42588',
  storageBucket: 'getxh-42588.firebasestorage.app',
  messagingSenderId: '170770122888',
  appId: '1:170770122888:web:7adcf91077d5695b06b73d',
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db   = getFirestore(app);
