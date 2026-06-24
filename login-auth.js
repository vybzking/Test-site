// login-router.js (Only link this on index.html)
import { auth, db } from "./config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

onAuthStateChanged(auth, async (user) => {
  if (user) {
    const userSnap = await getDoc(doc(db, "users", user.uid));
    if (userSnap.exists()) {
      const role = userSnap.data().role;
      // Redirect away from the login page to the proper dashboard
      if (role === "teacher") window.location.href = "teachers-dashboard.html";
      else if (role === "student") window.location.href = "students-dashboard.html";
      else if (role === "admin") window.location.href = "admin-dashboard.html";
    }
  }
  // If no user is logged in, we do nothing! We just let them look at the login page.
});


const login = async function(e) {
  e.preventDefault();
  console.log(e);
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    const userDocRef = doc(db, "users", user.uid);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
      const userData = userDocSnap.data();
      
      if (userData.role === "teacher") {
        alert(`Welcome back, Instructor ${userData.displayName || ''}!`);
        window.location.href = "teachers-dashboard.html"; 
      } 
      else if (userData.role === "student"){
        alert(`Welcome back, ${userData.displayName || ''}!`);
        window.location.href = "exams-scores.html"; 
      }
      else {
        alert("Access Denied: You are unauthorized to view this page.");
        await signOut(auth); 
      }
    } else {
      alert("Login error: This user does not exist.");
      await signOut(auth);
    }
  } catch (error) {
    console.error("Login Error:", error);
    alert(`Login failed: ${error.message}`);
  }
}
