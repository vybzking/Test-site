
import {auth, db} from "./config.js";
import { collection, addDoc, serverTimestamp, doc, getDoc, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { onAuthStateChanged} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const teacherSelect = document.getElementById('teacherSelect');
// const wassceForm = document.getElementById('wassce-score-form');

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

onAuthStateChanged(auth, async (user) => {
  if (user) {
    console.log("Logged in user verified:", user.uid);
    if (user.role === "admin"){
      await loadActiveTeachers();
    }
  } else {
    console.log("No token found. Booting back to login...");
    // Only redirect if we aren't already on the login page to avoid loops
    if (!window.location.pathname.includes("index.html")) {
       window.location.href = "index.html";
    }
  }
});


document.addEventListener('DOMContentLoaded', () => {
            const availablePool = document.getElementById('availablePool');
            const assignedPool = document.getElementById('assignedPool');
            const emptyPlaceholder = document.getElementById('emptyStatePlaceholder');
            const saveBtn = document.getElementById('saveAllocationBtn');
            const teacherSelect = document.getElementById('teacherSelect');
            const statusAlert = document.getElementById('statusAlert');

            // 1. Toggling items back and forth between lists via event delegation
            document.body.addEventListener('click', (e) => {
                const card = e.target.closest('.subject-card');
                if (!card) return;

                const parentPool = card.parentElement.id;

                if (parentPool === 'availablePool') {
                    // Move to assigned column
                    card.querySelector('span').innerHTML = '&times;'; // Change arrow to delete symbol
                    card.querySelector('span').className = 'text-red-500 font-bold text-lg';
                    assignedPool.appendChild(card);
                } else {
                    // Move back to available column
                    card.querySelector('span').innerHTML = '&rarr;'; // Restore arrow symbol
                    card.querySelector('span').className = 'text-blue-500 font-bold text-lg';
                    availablePool.appendChild(card);
                }

                togglePlaceholder();
            });

            // 2. Manage visual placeholder when right side is empty
            function togglePlaceholder() {
                const assignedItems = assignedPool.querySelectorAll('.subject-card');
                if (assignedItems.length > 0) {
                    emptyPlaceholder.classList.add('hidden');
                } else {
                    emptyPlaceholder.classList.remove('hidden');
                }
            }

            // 3. Collect active allocation array data on Save
            saveBtn.addEventListener('click', () => {
                const teacherId = teacherSelect.value;
                
                if (!teacherId) {
                    showAlert('Please select a teacher before saving assignments.', false);
                    return;
                }

                // Gather subject IDs from the cards currently inside the assigned column
                const assignedCards = assignedPool.querySelectorAll('.subject-card');
                const assignedSubjectIds = Array.from(assignedCards).map(card => card.getAttribute('data-id'));

                console.log(`Payload for Teacher [${teacherId}]:`, assignedSubjectIds);
                
                showAlert(`Successfully assigned ${assignedSubjectIds.length} subject(s) to the teacher! Check database schema logic.`, true);
            });

            function showAlert(msg, isSuccess) {
                statusAlert.textContent = msg;
                statusAlert.className = `p-4 text-sm rounded-lg ${isSuccess ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`;
                statusAlert.classList.remove('hidden');
            }
        });
