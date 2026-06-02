
async function createUser(e) {
  e.preventDefault();
  const fullname = document.getElementById('fullname').value;
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const password2 = document.getElementById('password2').value;
  
  const emailField = document.getElementById('email');
  const emailError = document.getElementById('email-error');
  const password1Field = document.getElementById('password');
  const passwordError = document.getElementById('password-error');
  const password2Field = document.getElementById('password2');
  const password2Error = document.getElementById('password2-error');

  user = null;
  try {
    if (password !== password2){
      password2Field.style.outline = "tomato";
      password2Error.innerText = "password mismatch";
      password2Error.style.color = "red";
    }
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    if (userCredential === null){
      emailField.style.outline = "tomato";
      emailError.innerText = "This user does not exist";
      emailError.style.color = "red";
    }
    const user = userCredential.user;

    await setDoc(doc(db, "users", user.uid), {
      displayName: fullname,
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

