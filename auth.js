const auth = firebase.auth();

// Use global db if already declared in firebaseDB.js
const db = window.db; // 

// ----------------------------------------------------
// DOM Helpers
// ----------------------------------------------------
const $ = (id) => document.getElementById(id);
const show = (el) => el && (el.style.display = "block");
const hide = (el) => el && (el.style.display = "none");

// ----------------------------------------------------
// Auth State Listener
// ----------------------------------------------------
auth.onAuthStateChanged(async (user) => {
  if (user) {
    let name = user.displayName || user.email;

    // 🔁 Fallback: try Firestore if displayName is missing
    if (!user.displayName) {
      try {
        const doc = await db.collection("users").doc(user.uid).get();
        if (doc.exists) {
          const data = doc.data();
          name = data.name || name;
          console.log("Fetched name from Firestore:", name);
        } else {
          console.warn("No Firestore user document found");
        }
      } catch (err) {
        console.error("Error fetching name from Firestore:", err);
      }
    }

    console.log("Signed in as:", name);

    if ($("authStatus")) {
      $("authStatus").innerHTML = `Welcome, <strong>${name}</strong>`;
    }

    hide($("signInForm"));
    hide($("signUpForm"));
    show($("logoutBtn"));

    if (window.location.pathname.endsWith("auth.html")) {
      window.location.href = "notes.html";
    }
  } else {
    console.log("No user signed in");
    show($("signInForm"));
    hide($("signUpForm"));
    hide($("logoutBtn"));
  }
});


// ----------------------------------------------------
// Sign Up Handler
// ----------------------------------------------------
$("signUpForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = $("signUpName").value.trim();
  const email = $("signUpEmail").value.trim();
  const password = $("signUpPassword").value;

  try {
    const { user } = await auth.createUserWithEmailAndPassword(email, password);
    await user.updateProfile({ displayName: name });

    await db.collection("users").doc(user.uid).set({
      name,
      email,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    });

    M.toast({ html: "Account created! Please sign in.", classes: "green darken-2" });
    hide($("signUpForm"));
    show($("signInForm"));
  } catch (error) {
    M.toast({ html: error.message, classes: "red darken-2" });
  }
});

// ----------------------------------------------------
// Sign In Handler
// ----------------------------------------------------
$("signInForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = $("signInEmail").value.trim();
  const password = $("signInPassword").value;

  try {
    await auth.signInWithEmailAndPassword(email, password);
    M.toast({ html: "Signed in successfully!", classes: "green darken-2" });
  } catch (error) {
    M.toast({ html: error.message, classes: "red darken-2" });
  }
});

// ----------------------------------------------------
// Logout Handler
// ----------------------------------------------------
$("logoutBtn")?.addEventListener("click", async () => {
  await auth.signOut();
  M.toast({ html: "Logged out!", classes: "blue darken-2" });
  window.location.href = "auth.html";
});
