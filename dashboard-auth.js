import { auth, db } from "./config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

onAuthStateChanged(auth, async (user) => {
  // 1. Force unauthenticated users back to login
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  try {
    // 2. Fetch the user's official role from Firestore
    const userSnap = await getDoc(doc(db, "users", user.uid));
    
    if (!userSnap.exists()) {
      console.error("User document not found in database.");
      window.location.href = "index.html";
      return;
    }

    const userRole = userSnap.data().role; // 'teacher', 'student', or 'admin'
    const currentPath = window.location.pathname;

    // 3. Match the current page to the required role
    let isAuthorized = false;

    if (currentPath.includes("teachers-dashboard.html") && userRole === "teacher") {
      isAuthorized = true;
    } else if (currentPath.includes("students-dashboard.html") && userRole === "student") {
      isAuthorized = true;
    } else if (currentPath.includes("admin-dashboard.html") && userRole === "admin") {
      isAuthorized = true;
    }

    // 4. If they are in the wrong place, boot them out!
    if (!isAuthorized) {
      alert(`Access Denied: Your account role (${userRole}) cannot access this page.`);
      window.location.href = "index.html";
    } else {
      console.log(`Access granted! Welcome to the ${userRole} dashboard.`);
    }

  } catch (error) {
    console.error("Security check error:", error);
    window.location.href = "index.html";
  }
});

async function handleLogOut(){
    try {
        // Step A: Detach active Firestore listeners first to avoid permission errors

        // Step C: Sign out from Firebase Authentication
        await signOut(auth);
        console.log("User signed out successfully.");
        
        // Step D: Redirect user to login screen
        window.location.href = "index.html";

    } catch (error) {
        console.error("Error during logout process:", error.message);
    }
}

document.getElementById("logout-btn").addEventListener("click", await handleLogout());
