
import {auth, db} from "./config.js";
import { collection, addDoc, serverTimestamp, doc, getDoc, getDocs, query, where, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { onAuthStateChanged} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const teacherSelect = document.getElementById('teacherSelect');
// const wassceForm = document.getElementById('wassce-score-form');


onAuthStateChanged(auth, async (user) => {
 const docSnap = await getDoc(doc(db, "users", user.uid));
    
    // Verify the document exists before pulling data
    if (docSnap.exists()) {
        const userProfile = docSnap.data();
        
        if (userProfile.role === "admin") {
            await loadActiveTeachers();
            await loadSubjects();
        }
    } 
    else {
        console.log("User document does not exist in Firestore.");
    }

    // if (!window.location.pathname.includes("index.html")) {
    //    window.location.href = "index.html";
    // }
});



async function loadActiveTeachers() {
  if (!teacherSelect) return;
  try {
    const usersRef = collection(db, "users");
    
    // FIX: Combined compound conditions using proper comma syntax
    const q = query(usersRef, where("isAccountActive", "==", true), where("role", "==", "teacher"));
    const querySnapshot = await getDocs(q);
    console.log("teachers", querySnapshot);

    teacherSelect.innerHTML = '<option value="" disabled selected>Choose a teacher...</option>';

    if (querySnapshot.empty) {
      teacherSelect.innerHTML = '<option value="" disabled>No active teachers found</option>';
      return;
    }

    querySnapshot.forEach((doc) => {
      const teacherData = doc.data();
      const option = document.createElement('option');
      option.value = doc.id; 
      option.textContent = teacherData.displayName || "Unnamed Teacher";
      teacherSelect.appendChild(option);
    });

    teacherSelect.disabled = false;

  } catch (error) {
    console.error("Error fetching students:", error);
    teacherSelect.innerHTML = '<option value="" disabled>Failed to load teachers</option>';
  }
}


async function loadSubjects() {
  const checkBoxContainer = document.getElementById("checkBoxContainer");
  try {
    const usersRef = collection(db, "subjects");
    
    // FIX: Combined compound conditions using proper comma syntax
    const querySnapshot = await getDocs(usersRef);
    console.log("subjects", querySnapshot);

    if (querySnapshot.empty) {
      // would be worked on later....................................................................................
      alert("no data available");
      return;
    }
    ;
    querySnapshot.forEach((doc) => {
      const subjectData = doc.data();
      console.log(subjectData);
      // 1. Create the outer label element
      const label = document.createElement('label');

      // 2. Apply classes and attributes to the root element
      label.className = 'flex items-start p-3 bg-white rounded-lg border border-gray-200 cursor-pointer hover:bg-blue-50/40 select-none transition space-x-3';

      // 3. Inject the inner HTML structure safely
      label.innerHTML = `
      <input type="checkbox" value="${subjectData.code}" class="subject-checkbox w-4 h-4 mt-0.5 text-blue-600 border-gray-300 rounded focus:ring-blue-500">
      <div class="text-sm">
        <p class="font-semibold text-gray-800">${subjectData.name}</p>
        <p class="text-xs text-gray-500">${subjectData.code}</p>
      </div>
    `;

      
      checkBoxContainer.appendChild(label);
    });

  } catch (error) {
    console.error("Error fetching subjects:", error);
  }
}


document.addEventListener('DOMContentLoaded', () => {
            const teacherSelect = document.getElementById('teacherSelect');
            const saveBtn = document.getElementById('assign-button');
            const statusAlert = document.getElementById('statusAlert');
            
            // console.log("checkBoxes: ",checkboxes);
            // let subjectsSelected = [];
            // Simulated Teacher Pre-assigned Data Mockup
            const TeacherAssignments = {
                
            };

            // Listen for teacher selection to automatically check/uncheck items
            teacherSelect.addEventListener('change', (e) => {
                const teacherId = e.target.value;
                statusAlert.classList.add('hidden'); // Hide old messages

                if (!teacherId) {
                    // Reset all checkboxes if no teacher is selected
                    checkboxes.forEach(cb => cb.checked = false);
                    saveBtn.disabled = true;
                    return;
                }

                // Enable the save button
                saveBtn.disabled = false;

                // Load assignments for this teacher from our mock data loop
                
                
                // checkboxes.forEach((cb) => {
                //     cb.checked = assignedIds.includes(cb.value);
                // });
            });


            // Handle Save Button Clicks
            saveBtn.addEventListener('click', () => {
                const checkboxes = document.querySelectorAll('.subject-checkbox');
                const selections = Array.from(checkboxes).map(cb => cb.value);
                console.log("data from checkbox: ", selections);
                const teacherId = teacherSelect.value;

                // Collect values of all checked boxes

                // const selectedSubjectIds = Array.from(checkedBoxes).map(cb => cb.value);

                // Update our local mock state
                TeacherAssignments[teacherId] = selections;

                await updateDoc(doc(db, "users", teacherId), {
                 "subjects": selections
                });

                // Show visual confirmation alert
                statusAlert.textContent = `Successfully updated assignments for ${teacherId}! Assigned codes: [${selections.join(', ')}]`;
                statusAlert.className = "p-4 text-sm rounded-lg bg-green-100 text-green-700";
                statusAlert.classList.remove('hidden');
            });
        });



