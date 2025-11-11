// app.js

document.addEventListener("DOMContentLoaded", () => {
    // Initialize Materialize components
    M.Collapsible.init(document.querySelectorAll(".collapsible"));
    M.updateTextFields(); 
  
    // Register service worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("service-worker.js")
        .then(() => console.log("Service Worker registered"))
        .catch((err) => console.error("Service Worker error:", err));
    }
  
    // --- Task Form and UI Elements ---
    const form = document.getElementById("taskForm");
    const titleInput = document.getElementById("taskTitle");
    const descInput = document.getElementById("taskDescription");
    const taskIdInput = document.getElementById("taskId"); // Hidden input for editing
    const formActionButton = form.querySelector("button[type='submit']");
  
    // --- Form Submission Handler (Handles ADD and EDIT) ---
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
  
      const title = titleInput.value.trim();
      const description = descInput.value.trim();
      const id = taskIdInput.value.trim(); // Get ID if editing
  
      if (!title) return;
  
      const taskData = { title, description, status: "pending" };
      
      if (id) {
        await handleEdit(id, taskData);
      } else {
        await handleAdd(taskData);
      }
      
      form.reset();
      taskIdInput.value = ''; // Clear hidden ID field
      formActionButton.textContent = "Add Task"; // Reset button text
      M.updateTextFields(); 
      loadTasks(); // Refresh UI
    });
});

// --- HELPER FUNCTIONS FOR FORM SUBMISSION ---

async function handleAdd(taskData) {
    if (navigator.onLine) {
        // Online: Add to Firebase, then save with Firebase ID
        const firebaseId = await addTask(taskData);
        saveTask({ ...taskData, id: firebaseId, synced: true });
    } else {
        // Offline: Use temp ID, save with synced: false
        const tempId = "temp-" + Date.now();
        saveTask({ ...taskData, id: tempId, synced: false });
    }
}

async function handleEdit(id, taskData) {
    const updatedData = { ...taskData };
    
    if (navigator.onLine) {
        // Online: Update Firebase, then update local as synced: true
        await updateTask(id, updatedData);
        saveTask({ ...updatedData, id, synced: true });
    } else {
        // Offline: Update local as synced: false
        saveTask({ ...updatedData, id, synced: false });
    }
}

// --- DELETION LOGIC (Handles online/offline states) ---

window.handleDelete = async function(id) {
    if (!confirm("Are you sure you want to delete this task?")) return;
    
    if (navigator.onLine) {
        // Online: Delete from Firebase, then delete from local
        try {
            await deleteTask(id);
        } catch (error) {
            console.error("Error deleting from Firebase (may not exist yet).", error);
        }
        deleteTaskById(id);
        
    } else {
        // Offline: Mark for deletion/handle temp IDs
        if (id.startsWith("temp-")) {
             // If it's a temp ID, just remove it locally
             deleteTaskById(id);
        } else {
             // Permanent ID: Mark for sync deletion (Week 9 requirement)
             const task = await getTaskById(id);
             if (task) {
                 // Save the task back to IndexedDB with a 'toDelete' flag
                 saveTask({...task, toDelete: true, synced: false});
             }
        }
    }
    loadTasks(); // Refresh UI
}


// --- DATA SYNC (The CORE of Week 9) ---

window.syncTasks = async function() {
    console.log("Attempting to sync tasks...");
    const unsyncedTasks = await getUnsyncedTasks();
    
    if (unsyncedTasks.length === 0) {
        console.log("No unsynced tasks found.");
        return;
    }

    for (const task of unsyncedTasks) {
        // Create an object without the local-only properties (id, synced, toDelete)
        const { id, synced, toDelete, ...taskToSync } = task; 

        if (toDelete) {
            // Case 1: Task marked for Deletion (Permanent ID, offline deletion)
            try {
                await deleteTask(id); // Delete from Firebase
                deleteTaskById(id);   // Delete from local DB
                console.log(`Synced deletion for task ${id}`);
            } catch (error) {
                console.error(`Failed to sync deletion for task ${id}`, error);
            }
        } else if (id.startsWith("temp-")) {
            // Case 2: New Task (Temporary ID, offline creation)
            try {
                const firebaseId = await addTask(taskToSync); // Push to Firebase
                deleteTaskById(id); // Delete old record with temp ID
                saveTask({ ...taskToSync, id: firebaseId, synced: true }); // Save new record with Firebase ID
                console.log(`Synced new task. New ID: ${firebaseId}`);
            } catch (error) {
                console.error(`Failed to sync new task ${id}`, error);
            }
        } else {
            // Case 3: Edited Task (Permanent ID, offline edit)
            try {
                await updateTask(id, taskToSync); // Update in Firebase
                saveTask({ ...task, synced: true }); // Update local record to synced: true
                console.log(`Synced update for task ${id}`);
            } catch (error) {
                console.error(`Failed to sync update for task ${id}`, error);
            }
        }
    }
    loadTasks(); // Refresh UI after sync
};


// --- UI RENDERING (loadTasks) ---

window.loadTasks = async function() {
    const taskContainer = document.getElementById("taskListContainer");
    if (!taskContainer) return;

    taskContainer.innerHTML = ''; // Clear current tasks

    let tasks = [];

    // Fetch local data first
    const localTasks = await new Promise((resolve) => {
        const tx = localDB.transaction("tasks", "readonly");
        const store = tx.objectStore("tasks");
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
    });
    
    if (navigator.onLine) {
        // Online: Fetch from Firebase (source of truth)
        const firebaseTasks = await getTasks(); 
        
        // Merge: Use Firebase data, but include unsynced local data
        const firebaseMap = new Map(firebaseTasks.map(t => [t.id, t]));
        localTasks.forEach(t => {
            // If the local task is unsynced, keep the local version in the list
            if (t.synced === false) {
                 firebaseMap.set(t.id, t);
            }
        });
        tasks = Array.from(firebaseMap.values()).filter(t => !t.toDelete);
        
    } else {
        // Offline: Use only IndexedDB data, filter out items marked for deletion
        tasks = localTasks.filter(t => !t.toDelete);
    }

    if (tasks.length === 0) {
        taskContainer.innerHTML = '<p class="center-align">No tasks added yet!</p>';
        return;
    }

    // Sort tasks to show unsynced/to-delete items clearly (optional)
    tasks.sort((a, b) => (a.synced === false ? -1 : 1));

    // Render tasks
    const ul = document.createElement('ul');
    ul.className = 'collection with-header';

    tasks.forEach(task => {
        const li = document.createElement('li');
        li.className = 'collection-item';
        
        let statusText = '';
        if (task.synced === false && task.id.startsWith("temp-")) {
            statusText = '<span class="new badge red" data-badge-caption="offline add"></span>';
        } else if (task.synced === false) {
             statusText = '<span class="new badge orange" data-badge-caption="pending sync"></span>';
        }

        // Pass sanitized strings to openEditForm
        const sanitizedTitle = task.title.replace(/'/g, "\\'");
        const sanitizedDescription = (task.description || '').replace(/'/g, "\\'");


        li.innerHTML = `
            <div>
                <strong>${task.title}</strong>
                ${statusText}
                <p>${task.description || 'No description.'}</p>
                <a href="#!" class="secondary-content" onclick="handleDelete('${task.id}')">
                    <i class="material-icons red-text">delete</i>
                </a>
                <a href="#!" class="secondary-content" style="margin-right: 30px;" onclick="openEditForm('${task.id}', '${sanitizedTitle}', '${sanitizedDescription}')">
                    <i class="material-icons blue-text">edit</i>
                </a>
            </div>
        `;
        ul.appendChild(li);
    });
    taskContainer.appendChild(ul);
}

// --- EDIT FORM SETUP (To link with UI) ---

window.openEditForm = function(id, title, description) {
    const titleInput = document.getElementById("taskTitle");
    const descInput = document.getElementById("taskDescription");
    const taskIdInput = document.getElementById("taskId");
    const formActionButton = document.querySelector("#taskForm button[type='submit']");

    // Prefill the form
    titleInput.value = title;
    descInput.value = description;
    taskIdInput.value = id; // Set the ID for submission handler

    // Change button text
    formActionButton.textContent = "Edit Task";
    
    // Ensure labels float up
    M.updateTextFields(); 
    
    // Scroll to form 
    document.getElementById("taskForm").scrollIntoView({ behavior: 'smooth' });
};


// --- SYNC EVENTS ---

// Sync tasks when back online
window.addEventListener("online", () => {
  console.log("Back online — syncing tasks...");
  syncTasks(); 
});