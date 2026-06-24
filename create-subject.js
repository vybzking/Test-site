import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";



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
name: document.getElementById('subjectName').value.trim(),
code: document.getElementById('subjectCode').value.trim().toUpperCase(),
department: document.getElementById('department').value,
description: document.getElementById('description').value.trim(),
createdAt: serverTimestamp() // Firebase server timestamp
};

try {
  // Add a new document with a generated ID to the "subjects" collection
  const docRef = await addDoc(collection(db, "subjects"), subjectData);
                
  showStatus(`Subject successfully created with ID: ${docRef.id}`, true);
  subjectForm.reset(); // Clear the form fields

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
  });
