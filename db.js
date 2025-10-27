console.log("db.js is executing");

let db;

const request = indexedDB.open("emergencyPrepDB", 1);

request.onupgradeneeded = function (event) {
  db = event.target.result;
  if (!db.objectStoreNames.contains("checklist")) {
    db.createObjectStore("checklist", { keyPath: "id" });
    console.log("Object store 'checklist' created");
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
  
