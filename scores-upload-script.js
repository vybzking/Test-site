import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
    import { getFirestore, collection, query, where, getDocs, addDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

    // Your actual Firebase Project keys
    const firebaseConfig = {
      apiKey: "YOUR_API_KEY",
      authDomain: "YOUR_AUTH_DOMAIN",
      projectId: "YOUR_PROJECT_ID",
      storageBucket: "YOUR_STORAGE_BUCKET",
      messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
      appId: "YOUR_APP_ID"
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
        const q = query(usersRef, where("isAccountActive", "==", true));
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
    loadActiveStudents();


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
