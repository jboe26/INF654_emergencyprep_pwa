// firebaseDB.js

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

// CRUD functions for Firebase
// ----------------------------------------------------

window.addTask = async function(taskData) {
// Uses addDoc and returns the new Firebase ID
const docRef = await tasksCollection.add(taskData);
return docRef.id;
};

window.getTasks = async function() {
// Reads all tasks from Firebase
const snapshot = await tasksCollection.get();
return snapshot.docs.map(doc => ({
  id: doc.id,
  ...doc.data()
}));
};

window.deleteTask = async function(id) {
// Deletes a task by its Firebase ID
await tasksCollection.doc(id).delete();
};

window.updateTask = async function(id, updatedData) {
// Updates a task by its Firebase ID
await tasksCollection.doc(id).update(updatedData);
};