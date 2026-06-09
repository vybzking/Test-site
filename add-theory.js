document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('dynamic-fields-container');
    const addBtn = document.getElementById('add-field-btn');
    const form = document.getElementById('assignment-form');

    // 1. Function to create a new input row
    addBtn.addEventListener('click', () => {
        const newRow = document.createElement('div');
        newRow.classList.add('form-row');

        // Markup for the new inputs
        newRow.innerHTML = `
            <input type="number" name="question-numbers[]" placeholder="Question number" min="1" max="100" required>
            <input type="text" name="questions[]" placeholder="Question" required>
            <button type="button" class="remove-btn">×</button>
        `;

        // Append the new row to our container
        container.appendChild(newRow);
    });

    // 2. Event Delegation for removing rows
    // (Handles clicking buttons that didn't exist when the page first loaded)
    container.addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-btn')) {
            const rows = container.querySelectorAll('.form-row');
            
            // Optional: Prevent removing the very last row if you want at least one entry
            if (rows.length > 1) {
                e.target.parentElement.remove();
            } else {
                alert("You must keep at least one student field.");
            }
        }
    });

    // 3. Handling Form Submission (Extracting data for Firebase)
    form.addEventListener('submit', (e) => {
        e.preventDefault();

        // Target all generated input arrays
        const questionNumbers = document.querySelectorAll('input[name="question-numbers[]"]');
        const questions = document.querySelectorAll('input[name="questions[]"]');
        
        const assignmentData = [];

        // Loop through inputs and pair them up into objects
        const questionNumbersExtract = Array.from(questionNumbers).map(questionNumber=>questionNumber.value);
        const questionsExtract = Array.from(questions).map(question=>question.value);
        for (i = 0; i < questionNumbersExtract.length; i++){
             console.log(`${questionNumbersExtract[i]}. ${questionsExtract[i]}`);
        }
       
        // Next step: Loop through 'rosterData' and pass to your Firebase addDoc() function
        });
    
});
