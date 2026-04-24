// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyBKMCgTC4ZibSvKAYWwSBd7grnNdIFFUzA",
  authDomain: "pick-up-64aa1.firebaseapp.com",
  databaseURL: "https://pick-up-64aa1-default-rtdb.firebaseio.com",
  projectId: "pick-up-64aa1",
  storageBucket: "pick-up-64aa1.firebasestorage.app",
  messagingSenderId: "713461225354",
  appId: "1:713461225354:web:b84f983dc937c79f1d9a73",
  measurementId: "G-MZ7448FXJM",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const database = getDatabase(app); 

export { analytics, database };