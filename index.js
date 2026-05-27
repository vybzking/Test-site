import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
  getFirestore, 
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

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyCP8QucUl9sS_z5x7syJYJps8mAmocdjbo",
  authDomain: "trial-project-33cbb.firebaseapp.com",
  projectId: "trial-project-33cbb",
  storageBucket: "trial-project-33cbb.firebasestorage.app",
  messagingSenderId: "453484633595",
  appId: "1:453484633595:web:2cc944c931387521fdff5e",
  measurementId: "G-N9QJPYSGQM"
};

// Initialize Firebase Services
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// DOM Elements (Check if they exist before usage to protect script logic)
const studentSelect = document.getElementById('studentSelect');
const wassceForm = document.getElementById('wassce-score-form');

// ==========================================
// 1. FETCH ACTIVE STUDENTS ON AUTH VERIFICATION
// ==========================================
async function loadActiveStudents() {
  if (!studentSelect) return;
  try {
    const usersRef = collection(db, "users");
    
    // FIX: Combined compound conditions using proper comma syntax
    const q = query(usersRef, where("isAccountActive", "==", true), where("role", "==", "student"));
    const querySnapshot = await getDocs(q);

    studentSelect.innerHTML = '<option value="" disabled selected>Choose a student...</option>';

    if (querySnapshot.empty) {
      studentSelect.innerHTML = '<option value="" disabled>No active students found</option>';
      return;
    }

    querySnapshot.forEach((doc) => {
      const studentData = doc.data();
      const option = document.createElement('option');
      option.value = doc.id; 
      option.textContent = studentData.displayName || "Unnamed Student";
      studentSelect.appendChild(option);
    });

    studentSelect.disabled = false;

  } catch (error) {
    console.error("Error fetching students:", error);
    studentSelect.innerHTML = '<option value="" disabled>Failed to load students</option>';
  }
}

// Global Auth Observer Tracking Sessions
onAuthStateChanged(auth, async (user) => {
  if (user) {
    console.log("Logged in user verified:", user.uid);
    await loadActiveStudents();
  } else {
    console.log("No token found. Booting back to login...");
    // Only redirect if we aren't already on the login page to avoid loops
    if (!window.location.pathname.includes("login.html")) {
       window.location.href = "login.html";
    }
  }
});

// ==========================================
// 2. CONSTRUCT PAYLOAD & SAVE TO FIRESTORE
// ==========================================
async function saveStudentAssessment(payload) {
  try {
    const customDocId = `${payload.studentUid}_${payload.form}_${payload.term}_${payload.subject}`;
    alert(customDocId);
    const newScoreRef = doc(db, "exams_scores", customDocId);
    await setDoc(newScoreRef, payload);
    
    alert(`✅ Assessment successfully uploaded into root 'exams_scores' for ${payload.studentName}!`);
    return { success: true };
  } catch (error) {
    alert("❌ Firestore Save Operation Failed: " + error.message);
    throw error;
  }
}

// Handling Marks Submission Event
if (wassceForm) {
  wassceForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const studentUid = studentSelect.value || "";
    const studentName = studentSelect.options[studentSelect.selectedIndex]?.text || "Unknown Student";
    const subject = document.getElementById('subject').value || "General";
    const term = document.getElementById('terms').value || "";
    const class_form = document.getElementById('forms').value || "";

    const objectivesScore = parseInt(document.getElementById('objectives').value, 10) || 0;
    const objectivesTotal = parseInt(document.getElementById('objectivesTotal').value, 10) ||50;
    const theoryScore = parseInt(document.getElementById('theory').value, 10) || 0;
    const theoryTotal = parseInt(document.getElementById('theoryTotal').value, 10) || 50;
    const practicalsScore = parseInt(document.getElementById('practicals').value, 10) || 0;
    const practicalsTotal = parseInt(document.getElementById('practicalsTotal').value, 10) || 0;

    if (objectivesScore > objectivesTotal || theoryScore > theoryTotal || practicalsScore > practicalsTotal) {
      alert("Error: A student's score cannot exceed the Expected Total Marks.");
      return;
    }

    const grandTotalObtained = objectivesScore + theoryScore + practicalsScore;
    const grandTotalPossible = objectivesTotal + theoryTotal + practicalsTotal;
    const calculatedPercentage = grandTotalPossible > 0 ? ((grandTotalObtained / grandTotalPossible) * 100).toFixed(1) : "0.0";

    const assessmentPayload = {
      studentUid,
      studentName,
      term,
      form: class_form,
      subject: subject.toLowerCase().trim(),
      objectivesObtained: Number(objectivesScore),
      objectivesPossible: Number(objectivesTotal),
      theoryObtained: Number(theoryScore),
      theoryPossible: Number(theoryTotal),
      practicalsObtained: Number(practicalsScore),
      practicalsPossible: Number(practicalsTotal),
      totalObtained: Number(grandTotalObtained),
      totalPossible: Number(grandTotalPossible),
      percentage: Number(calculatedPercentage), 
      recordedAt: serverTimestamp(),
      recorded_by: auth.currentUser.uid
    };

    await saveStudentAssessment(assessmentPayload);

    // Form resets
    studentSelect.selectedIndex = 0;
    document.getElementById('objectives').value = '';
    document.getElementById('theory').value = '';
    document.getElementById('practicals').value = '0';
  });
}

// ==========================================
// 3. AUTHENTICATION (SIGNUP & LOGIN)
// ==========================================

// Expose functions to window object if using inline HTML element event listeners
window.signup = async function() {
  const fullName = document.getElementById('fullName').value;
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    await setDoc(doc(db, "users", user.uid), {
      displayName: fullName,
      email: email,
      role: "student",         
      isAccountActive: true,   
      createdAt: serverTimestamp() // FIX: Replaced client-side new Date() with serverTimestamp()
    });

    alert(`Account successfully created for ${fullName}!`);
  } catch (error) {
    console.error("Registration Error:", error);
    alert(`Registration failed: ${error.message}`);
  }
}

window.login = async function() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    const userDocRef = doc(db, "users", user.uid);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
      const userData = userDocSnap.data();
      
      if (userData.role === "teacher") {
        alert(`Welcome back, Instructor ${userData.displayName || ''}!`);
        window.location.href = "score-uploads.html"; 
      } else {
        alert("Access Denied: This portal is reserved for teachers.");
        await signOut(auth); 
      }
    } else {
      alert("Login error: Profile document missing.");
      await signOut(auth);
    }
  } catch (error) {
    console.error("Login Error:", error);
    alert(`Login failed: ${error.message}`);
  }
}
