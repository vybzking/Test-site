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


async function loadMyGrades() {
  const userRoleBadge = document.getElementById('user-role-badge');
  const teacherControls = document.getElementById('teacher-controls');
  const studentSelect = document.getElementById('studentSelect');
  const scoresTbody = document.getElementById('scores-tbody');
  const studentSubtitle = document.getElementById('student-subtitle');

  // Track session configurations globally
  let currentUserProfile = null;

  // Run initial routing configuration on verification of user session state
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      console.log("Authenticated session UID:", user.uid);
      await initializePortal(user.uid);
    } else {
      console.log("No authorization token detected. Routing back to login...");
      window.location.href = "login.html";
    }
  });

  // Fetch role layout profile attributes from /users collection
  async function initializePortal(uid) {
    try {
      const userDocRef = doc(db, "users", uid);
      const userDocSnap = await getDoc(userDocRef);

      if (!userDocSnap.exists()) {
        scoresTbody.innerHTML = `<tr><td colspan="8" class="no-data">Profile reference missing in database. contact admin.</td></tr>`;
        return;
      }

      currentUserProfile = userDocSnap.data();
      userRoleBadge.textContent = currentUserProfile.role.toUpperCase();

      if (currentUserProfile.role === "teacher") {
        // Enforce View Setup for Teachers
        teacherControls.style.display = "flex";
        await loadStudentDropdown();
      } else {
        // Enforce View Setup for individual Student reports directly
        studentSubtitle.textContent = `Transcript Ledger for: ${currentUserProfile.displayName || 'Academic Account'}`;
        await fetchAndRenderScores(uid);
      }

    } catch (error) {
      console.error("Portal initialization breakdown:", error);
    }
  }

  // POPULATE DROPDOWN (For Teacher Accounts)
  async function loadStudentDropdown() {
    try {
      const q = query(collection(db, "users"), where("isAccountActive", "==", true), where("role", "==", "student"));
      const querySnapshot = await getDocs(q);

      studentSelect.innerHTML = '<option value="" disabled selected>Choose a student to review...</option>';
      
      if (querySnapshot.empty) {
        studentSelect.innerHTML = '<option value="" disabled>No active student registry documents found</option>';
        return;
      }

      querySnapshot.forEach((doc) => {
        const option = document.createElement('option');
        option.value = doc.id;
        option.textContent = doc.data().displayName || "Unnamed Account";
        studentSelect.appendChild(option);
      });

      studentSelect.disabled = false;
      scoresTbody.innerHTML = `<tr><td colspan="8" class="no-data">Select a student profile from the control filter choice above to pull grades.</td></tr>`;

      // Assign interaction updates
      studentSelect.addEventListener('change', (e) => {
        scoresTbody.innerHTML = `<tr><td colspan="8" class="loading">Retrieving records from exams data cluster...</td></tr>`;
        fetchAndRenderScores(e.target.value);
      });

    } catch (error) {
      console.error("Failed to build student directory layout dropdown:", error);
    }
  }

  // QUERY EXAMS AND BUILD ROWS (Protected by Security Rules structure)
  async function fetchAndRenderScores(targetStudentUid) {
    try {
      const scoresRef = collection(db, "exams_scores");
      
      // 🚨 CRITICAL: The security rule requires filtering precisely by studentUid string values
      const q = query(scoresRef, where("studentUid", "==", targetStudentUid));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        scoresTbody.innerHTML = `<tr><td colspan="8" class="no-data">No exam scores or assessment performance rows found for this account.</td></tr>`;
        return;
      }

      scoresTbody.innerHTML = ""; // Clear table row layout elements completely

      querySnapshot.forEach((doc) => {
        const record = doc.data();
        const tr = document.createElement('tr');

        // Check performance score range tier to assign colors dynamically
        const isHighGrade = record.percentage >= 75 ? "high" : "";

        tr.innerHTML = `
          <td style="font-weight: 600; text-transform: capitalize;">${record.subject}</td>
          <td>${record.form || 'N/A'}</td>
          <td>${record.term}</td>
          <td>${record.objectivesObtained} <span style="color: #94a3b8;">/ ${record.objectivesPossible}</span></td>
          <td>${record.theoryObtained} <span style="color: #94a3b8;">/ ${record.theoryPossible}</span></td>
          <td>${record.practicalsObtained} <span style="color: #94a3b8;">/ ${record.practicalsPossible}</span></td>
          <td style="font-weight: 600;">${record.totalObtained} <span style="font-weight: normal; color: #94a3b8;">/ ${record.totalPossible}</span></td>
          <td><span class="percentage-badge ${isHighGrade}">${record.percentage}%</span></td>
        `;
        scoresTbody.appendChild(tr);
      });

    } catch (error) {
      console.error("Error reading exam sheets:", error);
      scoresTbody.innerHTML = `<tr><td colspan="8" class="no-data" style="color: #b91c1c;">Permission Denied: Unable to fetch scores records block.</td></tr>`;
    }
  }




  
  const currentStudent = auth.currentUser;
  if (!currentStudent) return;

  try {
    const scoresRef = collection(db, "exams_scores");
    
    // 🚨 This 'where' constraint mirrors your security rule perfectly
    const q = query(scoresRef, where("studentUid", "==", currentStudent.uid));
    
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach( doc => {
      const examData = doc.data();
      console.log(`Subject: ${examData.subject}, Grade Total: ${examData.totalObtained}`);
      // Build your UI tables/cards here...
    });
  } catch (error) {
    console.error("Error loading personal grades:", error);
  }
}
