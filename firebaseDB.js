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
// Helpers: get user-scoped collection
// ----------------------------------------------------
function getUserTasksCollection() {
  const user = firebase.auth().currentUser;
  if (!user) throw new Error("No user signed in");
  return db.collection("users").doc(user.uid).collection("tasks");
}

// ----------------------------------------------------
// Task CRUD Operations (user-scoped)
// ----------------------------------------------------
window.addTask = async (taskData) => {
  try {
    const tasksCollection = getUserTasksCollection();
    const docRef = await tasksCollection.add(taskData);
    console.log("Task added to Firebase:", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("Error adding task to Firebase:", error);
    throw error;
  }
};

window.getTasks = async () => {
  try {
    const tasksCollection = getUserTasksCollection();
    const snapshot = await tasksCollection.get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error fetching tasks from Firebase:", error);
    return [];
  }
};

window.updateTask = async (id, updatedData) => {
  try {
    const tasksCollection = getUserTasksCollection();
    await tasksCollection.doc(id).update(updatedData);
    console.log("Task updated in Firebase:", id);
  } catch (error) {
    console.error("Error updating task in Firebase:", error);
  }
};

window.deleteTask = async (id) => {
  try {
    const tasksCollection = getUserTasksCollection();
    await tasksCollection.doc(id).delete();
    console.log("Task deleted from Firebase:", id);
  } catch (error) {
    console.error("Error deleting task from Firebase:", error);
  }
};

// ----------------------------------------------------
// Real-Time Listener (Optional)
// ----------------------------------------------------
firebase.auth().onAuthStateChanged((user) => {
  if (!user) return;
  const tasksCollection = getUserTasksCollection();
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
});
