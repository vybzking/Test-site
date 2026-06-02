
const firebaseConfig = {
  apiKey: "AIzaSyCP8QucUl9sS_z5x7syJYJps8mAmocdjbo",
  authDomain: "trial-project-33cbb.firebaseapp.com",
  projectId: "trial-project-33cbb",
  storageBucket: "trial-project-33cbb.firebasestorage.app",
  messagingSenderId: "453484633595",
  appId: "1:453484633595:web:2cc944c931387521fdff5e",
  measurementId: "G-N9QJPYSGQM"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
