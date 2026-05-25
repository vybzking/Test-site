import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
    import { getFirestore, collection, query, where, getDocs, addDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

    // Your actual Firebase Project keys
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

    const studentSelect = document.getElementById('studentSelect');

    // 1. FETCH ACTIVE STUDENTS FROM FIRESTORE ON PAGE LOAD
    async function loadActiveStudents() {
      try {
        // Point to the 'users' collection
        const usersRef = collection(db, "users");
        
        // Query to filter where field 'isAccountActive' (or whatever flag you use) is true
        const q = query(usersRef, where("isAccountActive", "==", true) && where("role", "==", "student"));
        const querySnapshot = await getDocs(q);

        // Clear the loading message
        studentSelect.innerHTML = '<option value="" disabled selected>Choose a student...</option>';

        if (querySnapshot.empty) {
          studentSelect.innerHTML = '<option value="" disabled>No active students found</option>';
          return;
        }

        // Loop through Firestore records and build dropdown options
        querySnapshot.forEach((doc) => {
          const studentData = doc.data();
          const option = document.createElement('option');
          
          // Use the unique Firestore document ID (UID) as the option value
          option.value = doc.id; 
          // Show the student's name to the administrator
          option.textContent = studentData.displayName || "Unnamed Student";
          
          studentSelect.appendChild(option);
        });

        // Enable the input element now that data is loaded
        studentSelect.disabled = false;

      } catch (error) {
        console.error("Error fetching students:", error);
        studentSelect.innerHTML = '<option value="" disabled>Failed to load students</option>';
      }
    }

    // Trigger the fetch process immediately
    onAuthStateChanged(auth, async (user) => {
  if (user) {
    console.log("Logged in user verified:", user.uid);
    // Token is safely loaded and attached! Now it's safe to fetch the students
    await loadActiveStudents();
  } else {
    console.log("No token found. Booting back to login...");
    window.location.href = "login.html";
  }
});

    // 2. SUBMIT COMPILED MARKS TO FIRESTORE
    document.getElementById('wassce-score-form').addEventListener('submit', async (e) => {
      e.preventDefault();

      const studentUid = studentSelect.value;
      // Get the readable name from the selected dropdown text alternative
      const studentName = studentSelect.options[studentSelect.selectedIndex].text;
      const subject = document.getElementById('subject').value;
      
      const objectivesScore = parseFloat(document.getElementById('objectives').value) || 0;
      const objectivesTotal = parseFloat(document.getElementById('objectivesTotal').value) || 0;
      
      const theoryScore = parseFloat(document.getElementById('theory').value) || 0;
      const theoryTotal = parseFloat(document.getElementById('theoryTotal').value) || 0;
      
      const practicalsScore = parseFloat(document.getElementById('practicals').value) || 0;
      const practicalsTotal = parseFloat(document.getElementById('practicalsTotal').value) || 0;

      if (objectivesScore > objectivesTotal || theoryScore > theoryTotal || practicalsScore > practicalsTotal) {
        alert("Error: A student's score cannot exceed the Expected Total Marks.");
        return;
      }

      const grandTotalObtained = objectivesScore + theoryScore + practicalsScore;
      const grandTotalPossible = objectivesTotal + theoryTotal + practicalsTotal;
      const calculatedPercentage = grandTotalPossible > 0 ? ((grandTotalObtained / grandTotalPossible) * 100).toFixed(2) : 0;

      const assessmentPayload = {
        studentUid,   // Links the score directly to their unique profile ID
        studentName,
        subject,
        breakdown: {
          objectives: { obtained: objectivesScore, possible: objectivesTotal },
          theory: { obtained: theoryScore, possible: theoryTotal },
          practicals: { obtained: practicalsScore, possible: practicalsTotal }
        },
        summary: {
          totalObtained: grandTotalObtained,
          totalPossible: grandTotalPossible,
          percentage: calculatedPercentage + '%'
        },
        recordedAt: new Date()
      };

      try {
        // Save into a new global collection called 'grades' or 'exam_records'
        await addDoc(collection(db, "exam_records"), assessmentPayload);
        
        alert(`Performance record successfully uploaded for ${studentName}!`);
        
        // Reset scores for next input, keep the total benchmarks
        studentSelect.selectedIndex = 0;
        document.getElementById('objectives').value = '';
        document.getElementById('theory').value = '';
        document.getElementById('practicals').value = '0';

      } catch (error) {
        console.error("Error saving grades:", error);
        alert("Failed to save grade record to database: " + error.message);
      }
    });

async function sinup(){
    
      // Gather input values
      const fullName = document.getElementById('fullName').value;
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;

      try {
        // Step 1: Create the user credential profile in Firebase Authentication
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        console.log("Auth account built successfully. UID assigned:", user.uid);

        // Step 2: Write extended profile data into Firestore using Auth UID as the Document ID
        await setDoc(doc(db, "users", user.uid), {
          displayName: fullName,
          email: email,
          role: "student",          // Default role for standard registrants
          isAccountActive: true,    // This ensures they show up in your score entry dropdown
          createdAt: new Date()
        });

        alert(`Account successfully created for ${fullName}!`);
        
        // Step 3: Send them over to a landing page or student dashboard
        // window.location.href = "student-dashboard.html";

      } catch (error) {
        console.error("Registration Error encountered:", error.code, error.message);
        
        // Friendly alerts for basic Firebase auth validation issues
        if (error.code === 'auth/email-already-in-use') {
          alert("Registration failed: This email address is already registered.");
        } else {
          alert(`Registration failed: ${error.message}`);
        }
      }
    
}

async function login(){
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;

      try {
        // Step 1: Sign the user in via Firebase Authentication
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        console.log("Authenticated successfully. Fetching user database role...");

        // Step 2: Fetch their user profile document from Firestore to read their role
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          
          // Step 3: Check permissions. Only teachers should access the score entry page.
          if (userData.role === "teacher") {
            alert(`Welcome back, Instructor ${userData.displayName || ''}!`);
            
            // Redirect straight to your score uploading page
            window.location.href = "score-uploads.html"; 
          } else {
            // It's a student trying to access the upload portal! Kick them out.
            alert("Access Denied: This portal is reserved for teachers and administrators only.");
            await auth.signOut(); // Immediately terminate their session
          }
        } else {
          alert("Login error: Your user profile document was not found in the database.");
          await auth.signOut();
        }

      } catch (error) {
        console.error("Login Error encountered:", error.code, error.message);
        
        // Handle typical authentication failures gracefully
        if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
          alert("Login failed: Incorrect email address or password.");
        } else {
          alert(`Login failed: ${error.message}`);
        }
      }
    
}

async function uploads(){
     
}
