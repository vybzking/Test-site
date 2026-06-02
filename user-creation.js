
const signup = async function() {
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
      password2Field.innerText = "password mismatch";
      password2Field.style.color = "red";
    }
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

window.login = async function(e) {
  e.preventDefault();
  alert(e);
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
      } 
      else if (userData.role === "student"){
        alert(`Welcome back, ${userData.displayName || ''}!`);
        window.location.href = "exams-scores.html"; 
      }
      else {
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
