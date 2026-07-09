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

// Global constant definition
const romanNumerals = ["i", "ii", "iii", "iv", "v", "vi", "vii"];

// 1. Fire DOMContentLoaded first at the root level
document.addEventListener('DOMContentLoaded', () => {
  const quizWrapper = document.getElementById('quiz-wrapper');
  const addQuestionBtn = document.getElementById('add-question-btn');
  const examForm = document.getElementById('exam-form');
  let questionCounter = 1;

  // 2. Track authentication states securely inside your app cycle
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      console.log("No token found. Redirecting...");
      if (!window.location.pathname.includes("index.html")) {
        window.location.href = "index.html";
      }
      return;
    }
    // You can attach user object details here if needed
  });

  // Handle structural layout display switches based on dropdown state selection
  quizWrapper.addEventListener('change', (e) => {
    if (e.target.classList.contains('type-select')) {
      const qBlock = e.target.closest('.question-block');
      const romanSection = qBlock.querySelector('.roman-section');
      const statementInputs = qBlock.querySelectorAll('.statement-input');
      const optionInputs = qBlock.querySelectorAll('.option-input');

      if (e.target.value === 'WAEC_ROMAN') {
        romanSection.classList.remove('hidden');
        statementInputs.forEach(input => input.required = true);
        optionInputs.forEach((input, i) => {
          if(i === 0) input.placeholder = "e.g., i only";
          if(i === 1) input.placeholder = "e.g., i and ii only";
        });
      } else {
        romanSection.classList.add('hidden');
        statementInputs.forEach(input => {
          input.required = false;
          input.value = ""; 
        });
        optionInputs.forEach((input, i) => {
          input.placeholder = `Option ${String.fromCharCode(65 + i)}`;
        });
      }
    }
  });

  // Add a clean dynamic blank question
  addQuestionBtn.addEventListener('click', () => {
    questionCounter++;
    const qBlock = document.createElement('div');
    qBlock.classList.add('question-block');
    qBlock.setAttribute('data-question-id', questionCounter);

    qBlock.innerHTML = `
      <div class="question-header">
        <span class="question-title">Question ${questionCounter}</span>
        <select class="type-select">
          <option value="STANDARD">Standard MCQ (A, B, C, D)</option>
          <option value="WAEC_ROMAN">WAEC Type (i, ii, iii Statements)</option>
        </select>
        <button type="button" class="btn btn-danger delete-q-btn"><i class="fa-solid fa-trash-can"></i> Remove</button>
      </div>
      <input type="text" class="question-input" placeholder="Type your question prompt here..." required>
      
      <div class="roman-section wrapper hidden">
        <div class="section-title">
          <span>Statements / Premises</span>
          <button type="button" class="btn btn-sm-add add-statement-btn"><i class="fa-solid fa-plus"></i> Add Statement</button>
        </div>
        <div class="statements-container">
          <div class="statement-row"><span class="roman-label">i.</span><input type="text" class="statement-input" placeholder="Statement i"><button type="button" class="btn btn-danger remove-stmt-btn">&times;</button></div>
          <div class="statement-row"><span class="roman-label">ii.</span><input type="text" class="statement-input" placeholder="Statement ii"><button type="button" class="btn btn-danger remove-stmt-btn">&times;</button></div>
        </div>
      </div>

      <div class="section-title">Options & Correct Answer Selection</div>
      <div class="options-container">
        <div class="option-row"><input type="radio" name="correct-ans-${questionCounter}" class="correct-radio" checked required><span class="alpha-label">A.</span><input type="text" class="option-input" placeholder="Option A" required></div>
        <div class="option-row"><input type="radio" name="correct-ans-${questionCounter}" class="correct-radio"><span class="alpha-label">B.</span><input type="text" class="option-input" placeholder="Option B" required></div>
        <div class="option-row"><input type="radio" name="correct-ans-${questionCounter}" class="correct-radio"><span class="alpha-label">C.</span><input type="text" class="option-input" placeholder="Option C" required></div>
        <div class="option-row"><input type="radio" name="correct-ans-${questionCounter}" class="correct-radio"><span class="alpha-label">D.</span><input type="text" class="option-input" placeholder="Option D" required></div>
      </div>
    `;
    quizWrapper.appendChild(qBlock);
    reindexQuestions();
  });

  // Handle Nested click interactions
  quizWrapper.addEventListener('click', (e) => {
    const target = e.target;

    if (target.closest('.add-statement-btn')) {
      const container = target.closest('.question-block').querySelector('.statements-container');
      if (container.querySelectorAll('.statement-row').length >= romanNumerals.length) return;

      const row = document.createElement('div');
      row.classList.add('statement-row');
      row.innerHTML = `<span class="roman-label"></span><input type="text" class="statement-input" placeholder="New premise statement" required><button type="button" class="btn btn-danger remove-stmt-btn">&times;</button>`;
      container.appendChild(row);
      updateRomanLabels(container);
    }

    if (target.closest('.remove-stmt-btn')) {
      const container = target.closest('.statements-container');
      if (container.querySelectorAll('.statement-row').length > 1) {
        target.closest('.statement-row').remove();
        updateRomanLabels(container);
      }
    }

    if (target.closest('.delete-q-btn')) {
      if (quizWrapper.querySelectorAll('.question-block').length > 1) {
        target.closest('.question-block').remove();
        reindexQuestions();
      }
    }
  });

  function updateRomanLabels(container) {
    container.querySelectorAll('.statement-row').forEach((row, idx) => {
      row.querySelector('.roman-label').textContent = `${romanNumerals[idx] || (idx + 1)}.`;
    });
  }

  function reindexQuestions() {
    quizWrapper.querySelectorAll('.question-block').forEach((block, qIdx) => {
      const num = qIdx + 1;
      block.setAttribute('data-question-id', num);
      block.querySelector('.question-title').textContent = `Question ${num}`;
      block.querySelectorAll('.correct-radio').forEach(radio => radio.setAttribute('name', `correct-ans-${num}`));
    });
  }

  // 3. FIXED: Added the missing async keyword here
  examForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const examPayload = [];

    quizWrapper.querySelectorAll('.question-block').forEach((block, bIdx) => {
      const type = block.querySelector('.type-select').value;
      const questionText = block.querySelector('.question-input').value;
      
      const options = [];
      let correctIndex = 0;
      block.querySelectorAll('.option-row').forEach((row, rIdx) => {
        options.push(row.querySelector('.option-input').value);
        if (row.querySelector('.correct-radio').checked) correctIndex = rIdx;
      });

      const questionData = {
        question_number: bIdx + 1,
        question_type: type, 
        question_text: questionText,
        options: options,
        correct_option_index: correctIndex
      };

      if (type === 'WAEC_ROMAN') {
        const statements = [];
        block.querySelectorAll('.statement-input').forEach(input => statements.push(input.value));
        questionData.statements = statements;
      }

      examPayload.push(questionData);
    });

    try {
      // 4. IMPORTANT NOTE: This writes to a collection as an array layout block.
      // If saving a unified single exam paper blueprint, bundle this array inside a wrapper object.
      const examDocument = {
        title: "Dynamic Mock Exam",
        created_at: serverTimestamp(),
        questions: examPayload
      };

      await addDoc(collection(db, "exams"), examDocument);

      console.log("Successfully compiled and saved document package:", examDocument);
      alert("Success! Exam saved to Firestore.");
    } catch (error) {
      console.error("Error saving document to database: ", error);
      alert("Error saving exam details.");
    }
  });
});
