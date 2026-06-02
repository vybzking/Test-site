import { auth, db } from "./config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

onAuthStateChanged(auth, async (user) => {
  if (user) {
    // 1. Setup the query: Find results where studentId matches this user's UID
    const q = query(collection(db, "exam_results"), where("studentId", "==", user.uid));
    
    // 2. Fetch the documents
    const querySnapshot = await getDocs(q);
    
    // 3. Loop through and inject them into your HTML page
    querySnapshot.forEach((doc) => {
      const examData = doc.data();
      console.log(`${examData.subject}: ${examData.score}`);
      // Code to display this data in an HTML table goes here...
    });
  }
});
