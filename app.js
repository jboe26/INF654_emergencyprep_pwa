document.addEventListener("DOMContentLoaded", () => {
  // Initialize Materialize components
  const collapsibles = document.querySelectorAll(".collapsible");
  M.Collapsible.init(collapsibles);
  M.updateTextFields();

  // Register service worker
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker
      .register("service-worker.js")
      .then(() => console.log("Service Worker registered"))
      .catch((err) => console.error("Service Worker error:", err));
  }

  // --- Task Form Elements ---
  const form = document.getElementById("taskForm");
  const titleInput = document.getElementById("taskTitle");
  const descInput = document.getElementById("taskDescription");
  const taskIdInput = document.getElementById("taskId"); // Hidden input for editing
  const formActionButton = form.querySelector("button[type='submit']");

  // --- Form Submission Handler (Add/Edit) ---
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const title = titleInput.value.trim();
    const description = descInput.value.trim();
    const id = taskIdInput.value.trim();

    if (!title) {
      M.toast({ html: "Please enter a task title", classes: "red darken-2" });
      return;
    }

    const taskData = { title, description, status: "pending" };

    if (id) {
      await handleEdit(id, taskData);
    } else {
      await handleAdd(taskData);
    }

    form.reset();
    taskIdInput.value = "";
    formActionButton.textContent = "Add Task";
    M.updateTextFields();
    loadTasks();
  });
});

// ----------------------------------------------------
// Helper Functions
// ----------------------------------------------------

async function handleAdd(taskData) {
  try {
    if (navigator.onLine) {
      const firebaseId = await addTask(taskData);
      saveTask({ ...taskData, id: firebaseId, synced: true });
    } else {
      const tempId = "temp-" + Date.now();
      saveTask({ ...taskData, id: tempId, synced: false });
    }
  } catch (err) {
    console.error("handleAdd error:", err);
    M.toast({ html: "Failed to add task", classes: "red darken-2" });
  }
}

async function handleEdit(id, taskData) {
  try {
    if (navigator.onLine) {
      await updateTask(id, taskData);
      saveTask({ ...taskData, id, synced: true });
    } else {
      saveTask({ ...taskData, id, synced: false });
    }
  } catch (err) {
    console.error("handleEdit error:", err);
    M.toast({ html: "Failed to edit task", classes: "red darken-2" });
  }
}

window.handleDelete = async function (id) {
  if (!confirm("Are you sure you want to delete this task?")) return;

  if (navigator.onLine) {
    try {
      await deleteTask(id);
    } catch (error) {
      console.error("Error deleting from Firebase:", error);
    }
    deleteTaskById(id);
  } else {
    if (id.startsWith("temp-")) {
      deleteTaskById(id);
    } else {
      const task = await getTaskById(id);
      if (task) {
        saveTask({ ...task, toDelete: true, synced: false });
      }
    }
  }

  loadTasks();
};

// ----------------------------------------------------
// Sync Logic
// ----------------------------------------------------

window.syncTasks = async function () {
  console.log("Attempting to sync tasks...");
  const unsyncedTasks = await getUnsyncedTasks();

  if (unsyncedTasks.length === 0) {
    console.log("No unsynced tasks found.");
    return;
  }

  for (const task of unsyncedTasks) {
    const { id, synced, toDelete, ...taskToSync } = task;

    try {
      if (toDelete) {
        await deleteTask(id);
        deleteTaskById(id);
        console.log(`Synced deletion for task ${id}`);
      } else if (id.startsWith("temp-")) {
        const firebaseId = await addTask(taskToSync);
        deleteTaskById(id);
        saveTask({ ...taskToSync, id: firebaseId, synced: true });
        console.log(`Synced new task. New ID: ${firebaseId}`);
      } else {
        await updateTask(id, taskToSync);
        saveTask({ ...task, synced: true });
        console.log(`Synced update for task ${id}`);
      }
    } catch (error) {
      console.error(`Failed to sync task ${id}`, error);
      M.toast({ html: `Sync failed for task ${id}`, classes: "orange darken-2" });
    }
  }

  loadTasks();
};

// ----------------------------------------------------
// UI Rendering
// ----------------------------------------------------

window.loadTasks = async function () {
  const taskContainer = document.getElementById("taskListContainer");
  if (!taskContainer) return;

  taskContainer.innerHTML = "";

  if (!window.localDB) {
    setTimeout(() => window.loadTasks(), 200);
    return;
  }

  const localTasks = await new Promise((resolve) => {
    const tx = localDB.transaction("tasks", "readonly");
    const store = tx.objectStore("tasks");
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
  });

  let tasks = [];

  if (navigator.onLine) {
    const firebaseTasks = await getTasks();
    const firebaseMap = new Map(firebaseTasks.map((t) => [t.id, t]));

    localTasks.forEach((t) => {
      if (t.synced === false) firebaseMap.set(t.id, t);
    });

    tasks = Array.from(firebaseMap.values()).filter((t) => !t.toDelete);
  } else {
    tasks = localTasks.filter((t) => !t.toDelete);
  }

  if (tasks.length === 0) {
    taskContainer.innerHTML = '<p class="center-align">No tasks added yet!</p>';
    return;
  }

  tasks.sort((a, b) => (a.synced === false ? -1 : 1));

  const ul = document.createElement("ul");
  ul.className = "collection with-header";

  tasks.forEach((task) => {
    const li = document.createElement("li");
    li.className = "collection-item";

    let statusText = "";
    if (task.synced === false && task.id.startsWith("temp-")) {
      statusText = '<span class="new badge red" data-badge-caption="offline add"></span>';
    } else if (task.synced === false) {
      statusText = '<span class="new badge orange" data-badge-caption="pending sync"></span>';
    }

    const sanitizedTitle = task.title.replace(/'/g, "\\'");
    const sanitizedDescription = (task.description || "").replace(/'/g, "\\'");

    li.innerHTML = `
      <div>
        <strong>${task.title}</strong>
        ${statusText}
        <p>${task.description || "No description."}</p>
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
};

// ----------------------------------------------------
// Edit Form Setup
// ----------------------------------------------------

window.openEditForm = function (id, title, description) {
  const titleInput = document.getElementById("taskTitle");
  const descInput = document.getElementById("taskDescription");
  const taskIdInput = document.getElementById("taskId");
  const formActionButton = document.querySelector("#taskForm button[type='submit']");

  titleInput.value = title;
  descInput.value = description;
  taskIdInput.value = id;

  formActionButton.textContent = "Edit Task";
  M.updateTextFields();
  document.getElementById("taskForm").scrollIntoView({ behavior: "smooth" });
};

// ----------------------------------------------------
// Sync Events
// ----------------------------------------------------

window.addEventListener("online", () => {
  console.log("Back online — syncing tasks...");
  syncTasks();
});
