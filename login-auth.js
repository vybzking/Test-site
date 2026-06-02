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
