// firebaseDB.js

// ----------------------------------------------------
// Firebase Initialization
// ----------------------------------------------------
const firebaseConfig = {
  apiKey: "AIzaSyDC6JoO8EBCGEwJqpFBIsnXKhhxikcopUQ", 
  authDomain: "taskmanagerpwa-2cb19.firebaseapp.com",
  projectId: "taskmanagerpwa-2cb19",
  storageBucket: "taskmanagerpwa-2cb19.firebasestorage.app",
  messagingSenderId: "87980517677",
  appId: "1:87980517677:web:38fa3ac380ea95bdf40ba4",
  measurementId: "G-RKWWN1E0VK"
};

firebase.initializeApp(firebaseConfig);
window.db = firebase.firestore(); // safe global reference


// ----------------------------------------------------
// Task Collection Reference
// ----------------------------------------------------
const tasksCollection = db.collection("tasks");

// ----------------------------------------------------
// Task CRUD Operations
// ----------------------------------------------------
window.addTask = async (taskData) => {
  try {
    const docRef = await tasksCollection.add(taskData);
    console.log("Task added to Firebase:", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("Error adding task to Firebase:", error);
  }
};

window.getTasks = async () => {
  try {
    const snapshot = await tasksCollection.get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error fetching tasks from Firebase:", error);
    return [];
  }
};

window.updateTask = async (id, updatedData) => {
  try {
    await tasksCollection.doc(id).update(updatedData);
    console.log("Task updated in Firebase:", id);
  } catch (error) {
    console.error("Error updating task in Firebase:", error);
  }
};

window.deleteTask = async (id) => {
  try {
    await tasksCollection.doc(id).delete();
    console.log("Task deleted from Firebase:", id);
  } catch (error) {
    console.error("Error deleting task from Firebase:", error);
  }
};

// ----------------------------------------------------
// Sync Unsynced Tasks from IndexedDB to Firebase
// ----------------------------------------------------
window.syncTasks = async () => {
  if (typeof getUnsyncedTasks !== "function") {
    console.error("getUnsyncedTasks not available from db.js");
    return;
  }

  const unsynced = await getUnsyncedTasks();
  for (const task of unsynced) {
    try {
      await tasksCollection.doc(task.id.toString()).set(task);
      task.synced = true;
      if (typeof saveTask === "function") {
        saveTask(task); // update local copy
      }
      console.log("Task synced to Firebase:", task.id);
    } catch (error) {
      console.error("Error syncing task:", error);
    }
  }
};

// ----------------------------------------------------
// Online Sync Trigger
// ----------------------------------------------------
window.addEventListener("online", () => {
  console.log("Back online, syncing tasks...");
  window.syncTasks();
});

// ----------------------------------------------------
// Real-Time Listener (Optional)
// ----------------------------------------------------
tasksCollection.onSnapshot((snapshot) => {
  snapshot.docChanges().forEach((change) => {
    const data = change.doc.data();
    if (change.type === "added") {
      console.log("New task from Firebase:", data);
    } else if (change.type === "modified") {
      console.log("Task updated in Firebase:", data);
    } else if (change.type === "removed") {
      console.log("Task deleted in Firebase:", change.doc.id);
    }
  });
});
