import { auth, db } from "./config.js";
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

// gets the subject taught by a teacher 
const subject = document.getElementById('subject-field');

// gets the form the question is for
const level = document.getElementById('level-field');

// gets the form the question is for
const assessmentType= document.getElementById('assessment-type-field');

// ensures the user is authenticated and have the privilege to view this page.
onAuthStateChanged(auth, async (user) => {
  if (user) {
    console.log("Logged in user verified:", user.uid);
    await loadSubjects(user.uid);
    // const assignedSubjects = getDocs(query("", where(teacher, "==", user.uid)))
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
               "subject": subject,
               "form": level,
               "teacher": user.uid,
               "assessment-type": assessmentType,
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

    
    
  } else {
    console.log("No token found. Booting back to login...");
    // Only redirect if we aren't already on the login page to avoid loops
    if (!window.location.pathname.includes("index.html")) {
       window.location.href = "index.html";
    }
  }
});

async function loadSubjects(userId) {
      const subjectsSelect = document.getElementById("subject");
      try {
        const userRef = doc(db, "users", userId);
    
        // FIX: Combined compound conditions using proper comma syntax
        const querySnapshot = await getDoc(userRef);
        console.log("subjects:", querySnapshot.data().subjects);

        if (querySnapshot.empty) {
          // would be worked on later....................................................................................
          alert("no data available");
          return;
        }
        ;
        querySnapshot.data().subjects.forEach((subject) => {
        // 1. Create the outer label element
        const option = document.createElement('option');
        option.setAttribute("value", subject);
        option.textContent = subject;

        // 2. Apply classes and attributes to the root element
        //option.className = 'flex items-start p-3 bg-white rounded-lg border border-gray-200 cursor-pointer hover:bg-blue-50/40 select-none transition space-x-3';

        // 3. Inject the inner HTML structure safely
        subjectSelect.appendChild(option);

      
        // checkBoxContainer.appendChild(label);
      });

  } catch (error) {
    console.error("Error fetching subjects:", error);
  }
}



