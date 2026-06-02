import { 
  getAuth, 
  onAuthStateChanged, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

import { 
  getFirestore, 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  doc, 
  setDoc, 
  getDoc, 
  serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

import { auth, db } from "./config.js";

async function chooseDashboard(uid) {
    try {
        const userTypeRef = doc(db, "users", uid);
        const userSnap = await getDoc(userTypeRef);

        if (userSnap.exists()) {
            const userData = userSnap.data(); // ✅ Extract fields safely

            // ✅ Corrected to window.location.href
            if (userData.role === "teacher") {
                window.location.href = "teachers-dashboard.html";
            } 
            else if (userData.role === "student") {
                window.location.href = "students-dashboard.html";
            } 
            else if (userData.role === "admin") {
                window.location.href = "admin-dashboard.html";
            } 
            else {
                window.location.href = "index.html";
            }
        } else {
            console.error("No user role document found in Firestore for this UID.");
            window.location.href = "index.html";
        }
    } catch (error) {
        console.error("Error fetching user role:", error);
        window.location.href = "index.html";
    }
}

onAuthStateChanged(auth, async (user) => {
  if (user) {
    console.log("Logged in user verified:", user.uid);
    await chooseDashboard(user.uid);
  } else {
    console.log("No token found. Booting back to login...");
    
    // ✅ This infinite-loop protection works perfectly!
    if (!window.location.pathname.includes("index.html")) {
        window.location.href = "index.html";
    }
  }
});
