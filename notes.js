// notes.js

// ----------------------------------------------------
// Save a new note (online or offline)
// ----------------------------------------------------
async function saveNote() {
  const noteInput = document.getElementById("noteInput");
  const noteText = noteInput.value.trim();
  if (!noteText) return;

  const user = firebase.auth().currentUser;
  if (!user) {
    alert("You must be signed in to save notes.");
    return;
  }

  const note = {
    id: Date.now(),
    text: noteText,
    timestamp: new Date().toISOString(),
    synced: navigator.onLine
  };

  if (navigator.onLine) {
    await db.collection("users")
      .doc(user.uid)
      .collection("notes")
      .doc(note.id.toString())
      .set(note);
  } else {
    saveNoteOffline(note);
  }

  noteInput.value = "";
  renderNotes();
}

// ----------------------------------------------------
// Render notes list (online or offline)
// ----------------------------------------------------
async function renderNotes() {
  const notesList = document.getElementById("notesList");
  notesList.innerHTML = "";

  const user = firebase.auth().currentUser;
  if (!user) return;

  let notes = [];
  if (navigator.onLine) {
    const snapshot = await db.collection("users")
      .doc(user.uid)
      .collection("notes")
      .orderBy("timestamp", "desc")
      .get();
    notes = snapshot.docs.map(doc => doc.data());
  } else {
    notes = await getOfflineNotes();
  }

  notes.forEach(note => {
    const li = document.createElement("li");
    li.className = "collection-item";

    const span = document.createElement("span");
    span.textContent = `${note.text} (${new Date(note.timestamp).toLocaleString()})`;
    span.contentEditable = true;
    span.style.cursor = "text";

    span.addEventListener("blur", async () => {
      if (navigator.onLine) {
        await db.collection("users")
          .doc(user.uid)
          .collection("notes")
          .doc(note.id.toString())
          .update({ text: span.textContent.trim() });
      } else {
        note.text = span.textContent.trim();
        note.synced = false;
        saveNoteOffline(note);
      }
    });

    const delBtn = document.createElement("button");
    delBtn.textContent = "Delete";
    delBtn.className = "btn-small red darken-2 right";
    delBtn.style.marginLeft = "10px";
    delBtn.addEventListener("click", async () => {
      if (navigator.onLine) {
        await db.collection("users")
          .doc(user.uid)
          .collection("notes")
          .doc(note.id.toString())
          .delete();
      } else {
        deleteOfflineNote(note.id);
      }
      renderNotes();
    });

    li.appendChild(span);
    li.appendChild(delBtn);
    notesList.appendChild(li);
  });
}

// ----------------------------------------------------
// Sync offline notes when back online
// ----------------------------------------------------
async function syncNotes() {
  const user = firebase.auth().currentUser;
  if (!user) return;

  const unsynced = await getUnsyncedNotes();
  const notesRef = db.collection("users").doc(user.uid).collection("notes");

  for (const note of unsynced) {
    await notesRef.doc(note.id.toString()).set({
      text: note.text,
      timestamp: note.timestamp,
      synced: true
    });
    await deleteOfflineNote(note.id);
  }
}

window.addEventListener("online", syncNotes);

// ----------------------------------------------------
// On page load
// ----------------------------------------------------
document.addEventListener("DOMContentLoaded", renderNotes);
