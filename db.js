// db.js

console.log("db.js is executing");

let localDB;

const request = indexedDB.open("emergencyPrepDB", 1);

request.onupgradeneeded = function (event) {
  localDB = event.target.result;
  if (!localDB.objectStoreNames.contains("tasks")) {
    localDB.createObjectStore("tasks", { keyPath: "id" });
    console.log("Object store 'tasks' created");
  }  
};

request.onsuccess = function (event) {
  localDB = event.target.result;
  console.log("IndexedDB opened successfully");
  
  // *** Initial load and sync check when DB is ready ***
  loadTasks(); 
  if (navigator.onLine) {
     syncTasks(); // Attempt to sync immediately if online
  }
};

request.onerror = function (event) {
  console.error("IndexedDB error:", event.target.errorCode);
};

// Function to get a single task by ID (CRITICAL FOR OFFLINE DELETE/EDIT)
window.getTaskById = function(id) {
    return new Promise((resolve) => {
        const tx = localDB.transaction("tasks", "readonly");
        const store = tx.objectStore("tasks");
        const request = store.get(id);
        request.onsuccess = () => resolve(request.result);
        request.onerror = (e) => {
            console.error("Error fetching single task:", e);
            resolve(null);
        };
    });
};

// Function to save/update a task in IndexedDB
window.saveTask = function(task) { 
  const tx = localDB.transaction("tasks", "readwrite");
  const store = tx.objectStore("tasks");
  const req = store.put(task);
  req.onsuccess = () => console.log("Task saved locally:", task.id);
  req.onerror = (e) => console.error("Error saving task:", e);
};

// Function to get ALL unsynced data (new tasks and offline edits/deletions)
window.getUnsyncedTasks = function() {
  return new Promise((resolve) => {
    const tx = localDB.transaction("tasks", "readonly");
    const store = tx.objectStore("tasks");
    const request = store.getAll();
    request.onsuccess = () => {
      // Return all tasks where the synced flag is explicitly false
      const unsynced = request.result.filter(task => task.synced === false);
      resolve(unsynced);
    };
    request.onerror = (e) => {
        console.error("Error fetching unsynced tasks:", e);
        resolve([]);
    };
  });
};

// Function to delete a task by ID in IndexedDB
window.deleteTaskById = function(id) {
  const tx = localDB.transaction("tasks", "readwrite");
  const store = tx.objectStore("tasks");
  const req = store.delete(id);
  req.onsuccess = () => console.log("Task deleted locally:", id);
  req.onerror = (e) => console.error("Error deleting task:", e);
};