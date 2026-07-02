
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCP8QucUl9sS_z5x7syJYJps8mAmocdjbo",
  authDomain: "trial-project-33cbb.firebaseapp.com",
  projectId: "trial-project-33cbb",
  storageBucket: "trial-project-33cbb.firebasestorage.app",
  messagingSenderId: "453484633595",
  appId: "1:453484633595:web:2cc944c931387521fdff5e",
  measurementId: "G-N9QJPYSGQM"
};
export const cloudinaryConfig = {
  "assignmentURI": "https://api.cloudinary.com/v1_1/depjgcf5s/auto/upload",
  "uploadPreset": "unsigned_preset"
}
  
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
