console.log("db.js is executing");

let localDB = null;

// ----------------------------------------------------
// IndexedDB Initialization
// ----------------------------------------------------

if (!window.indexedDB) {
  console.error("IndexedDB is not supported in this browser.");
} else {
  const request = indexedDB.open("emergencyPrepDB", 2);

  request.onupgradeneeded = (event) => {
    const db = event.target.result;

    if (!db.objectStoreNames.contains("tasks")) {
      db.createObjectStore("tasks", { keyPath: "id" });
      console.log("Object store 'tasks' created");
    }

    if (!db.objectStoreNames.contains("notes")) {
      db.createObjectStore("notes", { keyPath: "id" });
      console.log("Object store 'notes' created");
    }
  };

  request.onsuccess = (event) => {
    localDB = event.target.result;
    console.log("IndexedDB opened successfully");

    if (navigator.storage?.persist) {
      navigator.storage.persist().then(granted => {
        console.log(granted ? "Persistent storage granted" : "Persistent storage not granted");
      });
    }

    if (typeof loadTasks === "function") loadTasks();

    if (navigator.onLine) {
      console.log("Online: triggering sync");
      if (typeof syncTasks === "function") syncTasks();
      if (typeof syncNotes === "function") syncNotes();
    }
  };

  request.onerror = (event) => {
    console.error("IndexedDB error:", event.target.error || event);
  };
}

// ----------------------------------------------------
// Task Operations
// ----------------------------------------------------

window.getTaskById = (id) => {
  return new Promise((resolve, reject) => {
    if (!localDB) return reject("IndexedDB not initialized");
    const tx = localDB.transaction("tasks", "readonly");
    const store = tx.objectStore("tasks");
    const req = store.get(id);

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => resolve(null);
  });
};

window.saveTask = (task) => {
  if (!localDB) return console.error("IndexedDB not initialized");
  const tx = localDB.transaction("tasks", "readwrite");
  const store = tx.objectStore("tasks");
  store.put(task);
};

window.getUnsyncedTasks = () => {
  return new Promise((resolve) => {
    if (!localDB) return resolve([]);
    const tx = localDB.transaction("tasks", "readonly");
    const store = tx.objectStore("tasks");
    const req = store.getAll();

    req.onsuccess = () => {
      const unsynced = req.result.filter(task => task.synced === false);
      resolve(unsynced);
    };
    req.onerror = () => resolve([]);
  });
};

window.deleteTaskById = (id) => {
  if (!localDB) return console.error("IndexedDB not initialized");
  const tx = localDB.transaction("tasks", "readwrite");
  const store = tx.objectStore("tasks");
  store.delete(id);
};

// ----------------------------------------------------
// Note Operations
// ----------------------------------------------------

window.saveNoteOffline = (note) => {
  if (!localDB) return console.error("IndexedDB not initialized");
  const tx = localDB.transaction("notes", "readwrite");
  const store = tx.objectStore("notes");
  store.put(note);
};

window.getOfflineNotes = () => {
  return new Promise((resolve) => {
    if (!localDB) return resolve([]);
    const tx = localDB.transaction("notes", "readonly");
    const store = tx.objectStore("notes");
    const req = store.getAll();

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => resolve([]);
  });
};

window.deleteOfflineNote = (id) => {
  if (!localDB) return console.error("IndexedDB not initialized");
  const tx = localDB.transaction("notes", "readwrite");
  const store = tx.objectStore("notes");
  store.delete(id);
};

window.getUnsyncedNotes = () => {
  return new Promise((resolve) => {
    if (!localDB) return resolve([]);
    const tx = localDB.transaction("notes", "readonly");
    const store = tx.objectStore("notes");
    const req = store.getAll();

    req.onsuccess = () => {
      const unsynced = req.result.filter(note => note.synced === false);
      resolve(unsynced);
    };
    req.onerror = () => resolve([]);
  });
};
