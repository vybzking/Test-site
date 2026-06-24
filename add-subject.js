import {auth, db} from "./config.js";
import { collection, addDoc, serverTimestamp, doc, getDoc, query, where } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { onAuthStateChanged} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

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

    if (currentPath.includes("add-subject.html") && userRole === "admin") {
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

// DOM Elements
const subjectForm = document.getElementById('subjectForm');
const submitBtn = document.getElementById('submitBtn');
const statusMessage = document.getElementById('statusMessage');

// Helper function to show status messages
function showStatus(message, isSuccess) {
  statusMessage.textContent = message;
  statusMessage.className = `p-4 mb-4 text-sm rounded-lg ${
    isSuccess ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
  }`;
  statusMessage.classList.remove('hidden');
}

// Form Submit Event Listener
subjectForm.addEventListener('submit', async (e) => {
e.preventDefault(); // Prevent page reload

// Disable button and change text during submission
submitBtn.disabled = true;
submitBtn.textContent = 'Saving...';
statusMessage.classList.add('hidden');

// Get form values
const subjectData = {
name: document.getElementById('subjectName').value.trim().toLowerCase(),
code: document.getElementById('subjectCode').value.trim().toUpperCase(),
department: document.getElementById('department').value,
description: document.getElementById('description').value.trim(),
createdAt: serverTimestamp() // Firebase server timestamp
};

async function saveSubject(e){
  e.preventDefault();
  try {
    // Add a new document with a generated ID to the "subjects" collection
    const searchData = await getDoc(query(collection(db, "subjects"), where("name","==",subjectData.name), where("code","==",subjectData.code)));
    if (!searchData.exists()){
      const docRef = await addDoc(collection(db, "subjects"), subjectData);
                
      showStatus(`Subject successfully created with ID: ${docRef.id}`, true);
      subjectForm.reset(); // Clear the form fields
    }
  } 
  catch (error) {
    console.error("Error adding document: ", error);
    showStatus(`Error adding subject: ${error.message}`, false);
  }
  finally {
    // Re-enable button
    submitBtn.disabled = false;
    submitBtn.textContent = 'Add Subject';
  }
}
  

