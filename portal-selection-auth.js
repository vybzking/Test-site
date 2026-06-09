  import { db, auth} from "./config.js";
  import { getFirestore, collection, query, where, getDocs, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
  import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

  // 🔐 Remember to replace this with your actual Firebase Configuration key variables
  
  // DOM Handles
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
    // 1. Mark that we have passed validation
    isUserAlreadyVerified = true; 
    
    console.log("Authenticated session UID:", user.uid);
    await initializePortal(user.uid);
  } else {
    // 2. ONLY redirect if a user was never found in the first place
    if (isUserAlreadyVerified) {
      console.log("Ignored temporary auth cycling state.");
      return; 
    }

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
