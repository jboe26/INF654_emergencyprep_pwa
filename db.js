console.log("db.js is executing");

let db;

const request = indexedDB.open("emergencyPrepDB", 1);

request.onupgradeneeded = function (event) {
  db = event.target.result;
  if (!db.objectStoreNames.contains("tasks")) {
    db.createObjectStore("tasks", { keyPath: "id" });
    console.log("Object store 'tasks' created");
  }  
};

request.onsuccess = function (event) {
  db = event.target.result;
  console.log("IndexedDB opened successfully");
};

request.onerror = function (event) {
  console.error("IndexedDB error:", event.target.errorCode);
};

function saveChecklistItem(id, checked) {
  const tx = db.transaction("checklist", "readwrite");
  const store = tx.objectStore("checklist");
  store.put({ id, checked });
}

function saveTask(task) {
  const tx = db.transaction("tasks", "readwrite");
  const store = tx.objectStore("tasks");
  store.put(task);
}

function getUnsyncedTasks() {
  return new Promise((resolve) => {
    const tx = db.transaction("tasks", "readonly");
    const store = tx.objectStore("tasks");
    const request = store.getAll();
    request.onsuccess = () => {
      const unsynced = request.result.filter(task => task.synced === false);
      resolve(unsynced);
    };
  });
}

function deleteTaskById(id) {
  const tx = db.transaction("tasks", "readwrite");
  const store = tx.objectStore("tasks");
  store.delete(id);
}

  
