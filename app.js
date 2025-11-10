document.addEventListener("DOMContentLoaded", () => {
    // Initialize Materialize components
    M.Collapsible.init(document.querySelectorAll(".collapsible"));
    M.updateTextFields(); // Fixes label visibility for form inputs
  
    // Register service worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("service-worker.js")
        .then(() => console.log("Service Worker registered"))
        .catch((err) => console.error("Service Worker error:", err));
    }
  
    // Form logic
    const form = document.getElementById("taskForm");
    const titleInput = document.getElementById("taskTitle");
    const descInput = document.getElementById("taskDescription");
  
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
  
      const title = titleInput.value.trim();
      const description = descInput.value.trim();
  
      if (!title) return;
  
      const taskData = {
        title,
        description,
        status: "pending"
      };
  
      if (navigator.onLine) {
        const firebaseId = await addTask(taskData);
        saveTask({ ...taskData, id: firebaseId, synced: true });
      } else {
        const tempId = "temp-" + Date.now();
        saveTask({ ...taskData, id: tempId, synced: false });
      }
  
      form.reset();
      M.updateTextFields(); // Reset floating labels
    });
  });
  
  // Sync tasks when back online
  window.addEventListener("online", () => {
    console.log("Back online — syncing tasks...");
    if (typeof syncTasks === "function") {
      syncTasks();
    }
  });
  