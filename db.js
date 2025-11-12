// db.js

console.log("db.js is executing");

let localDB;

// ----------------------------------------------------
// IndexedDB Initialization
// ----------------------------------------------------

const request = indexedDB.open("emergencyPrepDB", 1);

request.onupgradeneeded = (event) => {
  localDB = event.target.result;
  if (!localDB.objectStoreNames.contains("tasks")) {
    localDB.createObjectStore("tasks", { keyPath: "id" });
    console.log("Object store 'tasks' created");
  }
};

request.onsuccess = (event) => {
  localDB = event.target.result;
  console.log("IndexedDB opened successfully");

  // Request persistent storage so tasks aren't auto-deleted under low device storage
  if (navigator.storage && navigator.storage.persist) {
    navigator.storage.persist().then((granted) => {
      console.log(granted ? "Persistent storage granted" : "Persistent storage not granted");
    });
  }

  // Initial load and sync check
  loadTasks();
  if (navigator.onLine) {
    syncTasks();
  }
};

request.onerror = (event) => {
  console.error("IndexedDB error:", event.target.errorCode);
};

// ----------------------------------------------------
// Task Operations
// ----------------------------------------------------

// Get a single task by ID (critical for offline delete/edit)
window.getTaskById = (id) => {
  return new Promise((resolve) => {
    const tx = localDB.transaction("tasks", "readonly");
    const store = tx.objectStore("tasks");
    const req = store.get(id);

    req.onsuccess = () => resolve(req.result);
    req.onerror = (e) => {
      console.error("Error fetching single task:", e);
      resolve(null);
    };
  });
};

// Save or update a task in IndexedDB
window.saveTask = (task) => {
  const tx = localDB.transaction("tasks", "readwrite");
  const store = tx.objectStore("tasks");
  const req = store.put(task);

  req.onsuccess = () => console.log("Task saved locally:", task.id);
  req.onerror = (e) => console.error("Error saving task:", e);
};

// Get all unsynced tasks (new tasks and offline edits/deletions)
window.getUnsyncedTasks = () => {
  return new Promise((resolve) => {
    const tx = localDB.transaction("tasks", "readonly");
    const store = tx.objectStore("tasks");
    const req = store.getAll();

    req.onsuccess = () => {
      const unsynced = req.result.filter((task) => task.synced === false);
      resolve(unsynced);
    };
    req.onerror = (e) => {
      console.error("Error fetching unsynced tasks:", e);
      resolve([]);
    };
  });
};

// Delete a task by ID in IndexedDB
window.deleteTaskById = (id) => {
  const tx = localDB.transaction("tasks", "readwrite");
  const store = tx.objectStore("tasks");
  const req = store.delete(id);

  req.onsuccess = () => console.log("Task deleted locally:", id);
  req.onerror = (e) => console.error("Error deleting task:", e);
};
