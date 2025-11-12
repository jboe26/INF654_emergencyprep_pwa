// firebaseDB.js

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDC6JoO8EBCGEwJqpFBIsnXKhhxikcopUQ", 
  authDomain: "taskmanagerpwa-2cb19.firebaseapp.com",
  projectId: "taskmanagerpwa-2cb19",
  storageBucket: "taskmanagerpwa-2cb19.firebasestorage.app",
  messagingSenderId: "87980517677",
  appId: "1:87980517677:web:38fa3ac380ea95bdf40ba4",
  measurementId: "G-RKWWN1E0VK"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const tasksCollection = db.collection("tasks"); // Reference to the 'tasks' collection

// ----------------------------------------------------
// CRUD functions for Firebase
// ----------------------------------------------------

window.addTask = async function(taskData) {
  try {
    const docRef = await tasksCollection.add(taskData);
    console.log("Task added to Firebase:", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("Error adding task to Firebase:", error);
  }
};

window.getTasks = async function() {
  try {
    const snapshot = await tasksCollection.get();
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error fetching tasks from Firebase:", error);
    return [];
  }
};

window.deleteTask = async function(id) {
  try {
    await tasksCollection.doc(id).delete();
    console.log("Task deleted from Firebase:", id);
  } catch (error) {
    console.error("Error deleting task from Firebase:", error);
  }
};

window.updateTask = async function(id, updatedData) {
  try {
    await tasksCollection.doc(id).update(updatedData);
    console.log("Task updated in Firebase:", id);
  } catch (error) {
    console.error("Error updating task in Firebase:", error);
  }
};

// ----------------------------------------------------
// Sync logic between IndexedDB and Firebase
// ----------------------------------------------------

window.syncTasks = async function() {
  if (typeof getUnsyncedTasks !== "function") {
    console.error("getUnsyncedTasks not available from db.js");
    return;
  }

  const unsynced = await getUnsyncedTasks();
  for (const task of unsynced) {
    try {
      await tasksCollection.doc(task.id).set(task);
      task.synced = true;
      if (typeof saveTask === "function") {
        saveTask(task); // update local copy in IndexedDB
      }
      console.log("Task synced to Firebase:", task.id);
    } catch (error) {
      console.error("Error syncing task:", error);
    }
  }
};

// ----------------------------------------------------
// Online event listener to trigger sync
// ----------------------------------------------------
window.addEventListener("online", () => {
  console.log("Back online, syncing tasks...");
  window.syncTasks();
});

// ----------------------------------------------------
// Optional: Real-time listener for live updates
// ----------------------------------------------------
tasksCollection.onSnapshot((snapshot) => {
  snapshot.docChanges().forEach((change) => {
    if (change.type === "added") {
      console.log("New task from Firebase:", change.doc.data());
    }
    if (change.type === "modified") {
      console.log("Task updated in Firebase:", change.doc.data());
    }
    if (change.type === "removed") {
      console.log("Task deleted in Firebase:", change.doc.id);
    }
  });
});
