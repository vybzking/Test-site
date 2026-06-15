import { auth, db } from "./config.js";
import {
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

import { 
  getAuth, 
  onAuthStateChanged, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

onAuthStateChanged(auth, async (user) => {
  if (user) {
    console.log("Logged in user verified:", user.uid);
    await loadActiveStudents();
  } else {
    console.log("No token found. Booting back to login...");
    // Only redirect if we aren't already on the login page to avoid loops
    if (!window.location.pathname.includes("index.html")) {
       window.location.href = "index.html";
    }
  }
});

document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('dynamic-fields-container');
    const addBtn = document.getElementById('add-field-btn');
    const form = document.getElementById('assignment-form');

    // 1. Function to create a new input row
    let questionNum = 2;
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

    // 2. Event Delegation for removing rows
    // (Handles clicking buttons that didn't exist when the page first loaded)
    container.addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-btn')) {
            const rows = container.querySelectorAll('.form-row');
            
            // Optional: Prevent removing the very last row if you want at least one entry
            if (rows.length > 1) {
                e.target.parentElement.remove();
            } else {
                alert("You must keep at least one student field.");
            }
        }
    });

    // 3. Handling Form Submission (Extracting data for Firebase)
    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        // Target all generated input arrays
        const questions = document.querySelectorAll('input[name="questions[]"]');

        // Loop through inputs and pair them up into objects
        
        const questionsExtract = Array.from(questions).map(question=>question.value);
        console.log(questionsExtract);
       try {
          // 4. Use addDoc with await inside a try/catch block
          for (let i = 0; i < questionsExtract.length; i++){
             const docRef = await addDoc(collection(db, "questions"), {
               "question-number":i,
               "question": questionsExtract[i],
               "subject": "Science",
               "form": "2",
               "teacher": "",
               "assessment-type": "quiz",
               "date": serverTimestamp(),
             });
        }
          

          console.log("Document successfully written with ID: ", docRef.id);
    
          // 5. Success actions (e.g., clear form, alert user)
          alert("Question saved successfully!");
          form.reset();

          } catch (error) {
        // 6. Always handle potential errors (e.g., permission denied, network issues)
        console.error("Error adding document: ", error);
        alert("Failed to save question. Check console for details.");
        }finally {
        // 7. Re-enable the button regardless of success or failure
          // submitBtn.disabled = false;
          // submitBtn.innerText = "Save Question";
           console.log("otherwise");
        }
        // for (i = 0; i < questionsExtract.length; i++){
        //      console.log(`${i + 1}. ${questionsExtract[i]}`);
        // }
       
        // Next step: Loop through 'rosterData' and pass to your Firebase addDoc() function
        });
    
});
