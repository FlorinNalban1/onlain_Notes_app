const STORAGE_KEY = "online-notes-app";

const noteForm = document.querySelector("#noteForm");
const titleInput = document.querySelector("#noteTitle");
const contentInput = document.querySelector("#noteContent");
const submitButton = document.querySelector("#submitButton");
const cancelEditButton = document.querySelector("#cancelEditButton");
const searchInput = document.querySelector("#searchInput");
const sortSelect = document.querySelector("#sortSelect");
const notesGrid = document.querySelector("#notesGrid");
const emptyState = document.querySelector("#emptyState");
const notesCount = document.querySelector("#notesCount");
const pinnedCount = document.querySelector("#pinnedCount");
const noteTemplate = document.querySelector("#noteTemplate");

let notes = loadNotes();
let editingId = null;

renderNotes();

noteForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const title = titleInput.value.trim();
  const content = contentInput.value.trim();
  const color = new FormData(noteForm).get("noteColor");

  if (!title || !content) {
    return;
  }

  if (editingId) {
    notes = notes.map((note) =>
      note.id === editingId
        ? {
            ...note,
            title,
            content,
            color,
            updatedAt: Date.now(),
          }
        : note,
    );
  } else {
    notes.unshift({
      id: crypto.randomUUID(),
      title,
      content,
      color,
      pinned: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  }

  saveNotes();
  resetForm();
  renderNotes();
});

cancelEditButton.addEventListener("click", resetForm);
searchInput.addEventListener("input", renderNotes);
sortSelect.addEventListener("change", renderNotes);

notesGrid.addEventListener("click", (event) => {
  const button = event.target.closest("button");

  if (!button) {
    return;
  }

  const card = button.closest(".note-card");
  const noteId = card.dataset.id;

  if (button.classList.contains("pin-button")) {
    togglePinned(noteId);
  }

  if (button.classList.contains("edit-button")) {
    startEditing(noteId);
  }

  if (button.classList.contains("delete-button")) {
    deleteNote(noteId);
  }
});

function loadNotes() {
  const savedNotes = localStorage.getItem(STORAGE_KEY);

  if (!savedNotes) {
    return [];
  }

  try {
    return JSON.parse(savedNotes);
  } catch {
    return [];
  }
}

function saveNotes() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}

function renderNotes() {
  const visibleNotes = getVisibleNotes();
  notesGrid.innerHTML = "";

  visibleNotes.forEach((note) => {
    const noteElement = noteTemplate.content.firstElementChild.cloneNode(true);
    noteElement.dataset.id = note.id;
    noteElement.classList.add(note.color);
    noteElement.classList.toggle("is-pinned", note.pinned);

    noteElement.querySelector("h3").textContent = note.title;
    noteElement.querySelector(".note-content").textContent = note.content;
    noteElement.querySelector("time").dateTime = new Date(note.updatedAt).toISOString();
    noteElement.querySelector("time").textContent = formatDate(note.updatedAt);

    const pinButton = noteElement.querySelector(".pin-button");
    pinButton.title = note.pinned ? "Scoate de la fixate" : "Fixeaza notita";
    pinButton.setAttribute("aria-label", pinButton.title);

    notesGrid.append(noteElement);
  });

  emptyState.classList.toggle("hidden", visibleNotes.length > 0);
  notesCount.textContent = `${notes.length} ${notes.length === 1 ? "notita" : "notite"}`;

  const pinnedTotal = notes.filter((note) => note.pinned).length;
  pinnedCount.textContent = `${pinnedTotal} ${pinnedTotal === 1 ? "fixata" : "fixate"}`;
}

function getVisibleNotes() {
  const query = searchInput.value.trim().toLowerCase();
  const filteredNotes = notes.filter((note) => {
    const searchableText = `${note.title} ${note.content}`.toLowerCase();
    return searchableText.includes(query);
  });

  return filteredNotes.sort((first, second) => {
    if (first.pinned !== second.pinned) {
      return Number(second.pinned) - Number(first.pinned);
    }

    if (sortSelect.value === "title") {
      return first.title.localeCompare(second.title, "ro");
    }

    if (sortSelect.value === "created") {
      return second.createdAt - first.createdAt;
    }

    return second.updatedAt - first.updatedAt;
  });
}

function togglePinned(noteId) {
  notes = notes.map((note) =>
    note.id === noteId ? { ...note, pinned: !note.pinned, updatedAt: Date.now() } : note,
  );
  saveNotes();
  renderNotes();
}

function startEditing(noteId) {
  const note = notes.find((item) => item.id === noteId);

  if (!note) {
    return;
  }

  editingId = note.id;
  titleInput.value = note.title;
  contentInput.value = note.content;
  noteForm.elements.noteColor.value = note.color;
  submitButton.textContent = "Salveaza modificarile";
  cancelEditButton.classList.remove("hidden");
  titleInput.focus();
}

function deleteNote(noteId) {
  const note = notes.find((item) => item.id === noteId);

  if (!note || !confirm(`Stergi notita "${note.title}"?`)) {
    return;
  }

  notes = notes.filter((item) => item.id !== noteId);
  saveNotes();

  if (editingId === noteId) {
    resetForm();
  }

  renderNotes();
}

function resetForm() {
  editingId = null;
  noteForm.reset();
  submitButton.textContent = "Adauga notita";
  cancelEditButton.classList.add("hidden");
}

function formatDate(timestamp) {
  return new Intl.DateTimeFormat("ro-RO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(timestamp));
}
