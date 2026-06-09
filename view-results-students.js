
// Global Auth Observer Tracking Sessions
onAuthStateChanged(auth, async (user) => {
  if (user) {
    const student_records = await loadStudentAssessment(user);
    console.log("Logged in user verified:", user.uid);
  } else {
    console.log("No token found. Booting back to login...");
    // Only redirect if we aren't already on the login page to avoid loops
    if (!window.location.pathname.includes("index.html")) {
       window.location.href = "index.html";
    }
  }
});

// ==========================================
// 2. CONSTRUCT PAYLOAD & SAVE TO FIRESTORE
// ==========================================
async function loadStudentAssessment(user) {
  try {
    const resultRef = doc(db, "exams_scores", where("student", "==", user.uid));
    const exams_records = await getDoc(resultRef);
    if (!records){
      return
    }

    const result = exams_records.data();
    
    alert(`✅ Assessment successfully uploaded into root 'exams_scores' for ${payload.studentName}!`);
    return { success: true };
  } catch (error) {
    alert("❌ Firestore Save Operation Failed: " + error.message);
    throw error;
  }
}

// Handling Marks Submission Event

