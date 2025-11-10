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
  
  // Make functions globally accessible
  window.addTask = async function(taskData) {
    const docRef = await db.collection("tasks").add(taskData);
    return docRef.id;
  };
  
  window.getTasks = async function() {
    const snapshot = await db.collection("tasks").get();
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  };
  
  window.deleteTask = async function(id) {
    await db.collection("tasks").doc(id).delete();
  };
  
  window.updateTask = async function(id, updatedData) {
    await db.collection("tasks").doc(id).update(updatedData);
  };
  