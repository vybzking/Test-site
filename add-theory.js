import { auth, db, cloudinaryConfig } from "./config.js";

import {
  collection,
  addDoc,
  doc,
  getDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";


// DOM references
const subjectField = document.getElementById('subject-field');
const levelField = document.getElementById('level-field');
const assessmentTypeField = document.getElementById('assessment-type-field');

let selectedFiles = [];

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    console.log("No token found. Redirecting...");

    if (!window.location.pathname.includes("index.html")) {
      window.location.href = "index.html";
    }
    return;
  }

  console.log("Logged in user verified:", user.uid);

  await loadSubjects(user.uid);

  const container = document.getElementById('dynamic-fields-container');
  const addBtn = document.getElementById('add-field-btn');
  const form = document.getElementById('assignment-form');
  const fileInput = document.getElementById("files");

  let questionNum = 2;

  // Add question fields
  addBtn?.addEventListener('click', () => {
    const newRow = document.createElement('div');
    newRow.classList.add('form-row');

    newRow.innerHTML = `
      <span>${questionNum}.</span>
      <input type="text" name="questions[]" placeholder="Question" required>
      <button type="button" class="remove-btn">×</button>
    `;

    questionNum++;
    container.appendChild(newRow);
  });

  // Remove fields
  container?.addEventListener('click', (e) => {
    if (e.target.classList.contains('remove-btn')) {
      const rows = container.querySelectorAll('.form-row');

      if (rows.length > 1) {
        e.target.parentElement.remove();
      } else {
        alert("You must keep at least one field.");
      }
    }
  });

  // File validation
  fileInput?.addEventListener("change", () => {
    const MAX_SIZE = 2 * 1024 * 1024; // 2MB
    const files = fileInput.files;

    selectedFiles = [];

    if (files.length > 3) {
      alert("Maximum 3 files allowed.");
      fileInput.value = "";
      return;
    }

    for (const file of files) {
      const isPDF = file.type === "application/pdf";
      const isDocx =
        file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        file.name.endsWith(".doc") ||
        file.name.endsWith(".docx");

      if (!isPDF && !isDocx) {
        alert(`${file.name} is not allowed. Only PDF and DOC/DOCX.`);
        fileInput.value = "";
        return;
      }

      if (file.size > MAX_SIZE) {
        alert(`${file.name} exceeds 2MB limit.`);
        fileInput.value = "";
        return;
      }

      selectedFiles.push(file);
    }

    console.log("Files validated:", selectedFiles.length);
  });

  // Submit form
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const questionsExtract = Array.from(
      document.querySelectorAll('input[name="questions[]"]')
    ).map(q => q.value);

    try {
      // Save questions
      for (let i = 0; i < questionsExtract.length; i++) {
        await addDoc(collection(db, "questions"), {
          question_number: i + 1,
          question: questionsExtract[i],
          subject: subjectField?.value || "",
          level: levelField?.value || "",
          teacher: user.uid,
          assessment_type: assessmentTypeField?.value || "",
          created_at: serverTimestamp()
        });
      }

      // Upload files to Cloudinary
      const uploadResults = [];

      for (const file of selectedFiles) {
        const formData = new FormData();

        formData.append("file", file);
        formData.append("upload_preset", cloudinaryConfig.uploadPreset);
        formData.append("folder", "documents/assignments");
        console.log(file);
        const response = await fetch(
          cloudinaryConfig.assignmentURI,
          {
            method: "POST",
            body: formData
          }
        );

        const data = await response.json();

        if (!data.secure_url) {
          throw new Error("Cloudinary upload failed");
        }

        uploadResults.push({
          url: data.secure_url,
          public_id: data.public_id,
          format: data.format
        });

        console.log("Uploaded:", data.secure_url);
      }

      console.log("All uploads:", uploadResults);

      alert("Saved successfully!");

      form.reset();
      selectedFiles = [];

    } catch (error) {
      console.error("Error:", error);
      alert("Failed to save data.");
    }
  });
});


// Load subjects
async function loadSubjects(userId) {
  const subjectsSelect = document.getElementById("subject");
  if (!subjectsSelect) return;

  try {
    const userRef = doc(db, "users", userId);
    const snap = await getDoc(userRef);

    if (!snap.exists() || !snap.data().subjects) {
      alert("No subjects found.");
      return;
    }

    subjectsSelect.innerHTML = "";

    snap.data().subjects.forEach(subject => {
      const option = document.createElement("option");
      option.value = subject;
      option.textContent = subject;
      subjectsSelect.appendChild(option);
    });

  } catch (err) {
    console.error("Error loading subjects:", err);
  }
}
