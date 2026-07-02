import { auth, db, cloudinaryConfig } from "./config.js";
import {
  collection, 
  query, 
  where, 
  addDoc, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs,
  serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

import { 
  getAuth, 
  onAuthStateChanged, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// DOM Field References (Note: added .value in the Firestore section below)
const subjectField = document.getElementById('subject-field');
const levelField = document.getElementById('level-field');
const assessmentTypeField = document.getElementById('assessment-type-field');

// Track files globally in this scope so the submit event can access them
let selectedFiles = [];

onAuthStateChanged(auth, async (user) => {
  if (user) {
    console.log("Logged in user verified:", user.uid);
    await loadSubjects(user.uid);

    // DOM Setup
    const container = document.getElementById('dynamic-fields-container');
    const addBtn = document.getElementById('add-field-btn');
    const form = document.getElementById('assignment-form');
    const fileInput = document.getElementById("files");

    // 1. Function to create a new input row
    let questionNum = 2;
    if (addBtn) {
      addBtn.addEventListener('click', () => {
        const newRow = document.createElement('div');
        newRow.classList.add('form-row');

        // Markup for the new inputs
        newRow.innerHTML = `
            <span>${questionNum}.</span><input type="text" name="questions[]" placeholder="Question" required>
            <button type="button" class="remove-btn">×</button>
        `;
        questionNum++;

        // Append the new row to our container
        container.appendChild(newRow);
      });
    }

    // 2. Event Delegation for removing rows
    if (container) {
      container.addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-btn')) {
          const rows = container.querySelectorAll('.form-row');
          if (rows.length > 1) {
             e.target.parentElement.remove();
          } else {
             alert("You must keep at least one field.");
          }
        }
      });
    }

    // 3. Handling File Validation (Change Event)
    if (fileInput) {
      fileInput.addEventListener("change", () => {
        const MAX_SIZE = 2 * 1024 * 1024; // 2 MB
        const files = fileInput.files;
        selectedFiles = []; // Reset tracked files

        if (files.length > 3) {
          alert("You can only upload a maximum of 3 files.");
          fileInput.value = ""; 
          return;
        } 

        for (let file of files) {
          const isPDF = file.type === "application/pdf";
          const isDocx = file.name.endsWith(".docx") || file.name.endsWith(".doc");

          if (!isPDF && !isDocx) {
              alert(`${file.name} is not allowed. Only PDF and DOCX files are permitted.`);
              fileInput.value = ""; 
              return;
          }

          if (file.size > MAX_SIZE) {
              alert(`The file ${file.name} exceeds the 2MB limit.`);
              fileInput.value = ""; 
              return;
          }

          selectedFiles.push(file);
          console.log("Valid file registered:", file.name);
        }
      });
    }

    // 4. Handling Form Submission
    if (form) {
      form.addEventListener('submit', async function(e) {
        e.preventDefault();

        const questions = document.querySelectorAll('input[name="questions[]"]');
        const questionsExtract = Array.from(questions).map(q => q.value);
        console.log("Questions to upload: ", questionsExtract);

        try {
          // Loop through questions and write to Firestore
          for (let i = 0; i < questionsExtract.length; i++) {
             const docRef = await addDoc(collection(db, "questions"), {
               "question-number": i,
               "question": questionsExtract[i],
               "subject": subjectField ? subjectField.value : "",
               "form": levelField ? levelField.value : "",
               "teacher": user.uid,
               "assessment-type": assessmentTypeField ? assessmentTypeField.value : "",
               "date": serverTimestamp(),
             });
             console.log(`Document successfully written with ID: ${docRef.id}`);
          }

          // Handle Cloudinary Uploads sequentially 
          for (const file of selectedFiles) {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("upload_preset", "unsigned_preset");

            const response = await fetch(cloudinaryConfig.assignmentURI, {
              method: "POST",
              body: formData
            });

            const data = await response.json();
            console.log("Cloudinary Upload URL:", data.secure_url);
            // Hint: You might want to store this URL in Firestore as well!
          }  

          alert("All entries saved successfully!");
          form.reset();
          selectedFiles = []; // Clear current file array state

        } catch (error) {
          console.error("Error adding document or uploading files: ", error);
          alert("Failed to save data. Check console for details.");
        } finally {
          console.log("Submission process finished.");
        }
      });
    }
      
  } else {
    console.log("No token found. Booting back to login...");
    if (!window.location.pathname.includes("index.html")) {
       window.location.href = "index.html";
    }
  }
});

async function loadSubjects(userId) {
  const subjectsSelect = document.getElementById("subject");
  if (!subjectsSelect) return;

  try {
    const userRef = doc(db, "users", userId);
    const querySnapshot = await getDoc(userRef);

    if (!querySnapshot.exists() || !querySnapshot.data().subjects) {
      alert("No subject data available for this user account.");
      return;
    }

    console.log("Loaded subjects:", querySnapshot.data().subjects);
    subjectsSelect.innerHTML = ""; // Clear existing options if any

    querySnapshot.data().subjects.forEach((subject) => {
      const option = document.createElement('option');
      option.setAttribute("value", subject);
      option.textContent = subject;
      subjectsSelect.appendChild(option);
    });

  } catch (error) {
    console.error("Error fetching subjects:", error);
  }
}
