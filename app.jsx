import { useState, useEffect } from 'react'

const STORAGE_KEY = "online-notes-app";

function App() {
  const [notes, setNotes] = useState(() => {
    const savedNotes = localStorage.getItem(STORAGE_KEY);
    if (!savedNotes) {
      return [];
    }

    try {
      return JSON.parse(savedNotes);
    } catch (error) {
      console.error('Error loading notes:', error);
      return [];
    }
  });
  const [editingId, setEditingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('updated');
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    color: 'yellow'
  });

  // Save notes to localStorage whenever notes change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  }, [notes]);

  const handleSubmit = (e) => {
    e.preventDefault();

    const { title, content, color } = formData;
    if (!title.trim() || !content.trim()) return;

    if (editingId) {
      // Update existing note
      setNotes(prevNotes =>
        prevNotes.map(note =>
          note.id === editingId
            ? { ...note, title: title.trim(), content: content.trim(), color, updatedAt: Date.now() }
            : note
        )
      );
      setEditingId(null);
    } else {
      // Create new note
      const newNote = {
        id: crypto.randomUUID(),
        title: title.trim(),
        content: content.trim(),
        color,
        pinned: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      setNotes(prevNotes => [newNote, ...prevNotes]);
    }

    // Reset form
    setFormData({ title: '', content: '', color: 'yellow' });
  };

  const handleEdit = (noteId) => {
    const note = notes.find(n => n.id === noteId);
    if (note) {
      setEditingId(noteId);
      setFormData({
        title: note.title,
        content: note.content,
        color: note.color
      });
    }
  };

  const handleDelete = (noteId) => {
    const note = notes.find(n => n.id === noteId);
    if (note && window.confirm(`Ștergi notița "${note.title}"?`)) {
      setNotes(prevNotes => prevNotes.filter(n => n.id !== noteId));
      if (editingId === noteId) {
        setEditingId(null);
        setFormData({ title: '', content: '', color: 'yellow' });
      }
    }
  };

  const togglePinned = (noteId) => {
    setNotes(prevNotes =>
      prevNotes.map(note =>
        note.id === noteId
          ? { ...note, pinned: !note.pinned, updatedAt: Date.now() }
          : note
      )
    );
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData({ title: '', content: '', color: 'yellow' });
  };

  // Filter and sort notes
  const getVisibleNotes = () => {
    const filtered = notes.filter(note => {
      const searchableText = `${note.title} ${note.content}`.toLowerCase();
      return searchableText.includes(searchQuery.toLowerCase());
    });

    return filtered.sort((a, b) => {
      // Pinned notes always come first
      if (a.pinned !== b.pinned) {
        return b.pinned - a.pinned;
      }

      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title, 'ro');
        case 'created':
          return b.createdAt - a.createdAt;
        default: // 'updated'
          return b.updatedAt - a.updatedAt;
      }
    });
  };

  const visibleNotes = getVisibleNotes();
  const pinnedCount = notes.filter(note => note.pinned).length;

  const formatDate = (timestamp) => {
    return new Intl.DateTimeFormat('ro-RO', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(timestamp));
  };

  return (
    <main className="app-shell">
      {/* Sidebar */}
      <section className="sidebar" aria-label="Panou creare notițe">
        <div className="brand">
          <div className="brand-mark" aria-hidden="true">N</div>
          <div>
            <h1>Notes</h1>
            <p>Notițele tale ordonate</p>
          </div>
        </div>

        <form className="note-form" onSubmit={handleSubmit}>
          <label htmlFor="noteTitle">Titlu:</label>
          <input
            id="noteTitle"
            type="text"
            placeholder="Ex: Idei proiect"
            maxLength="80"
            required
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          />

          <label htmlFor="noteContent">Conținut:</label>
          <textarea
            id="noteContent"
            placeholder="Scrie aici..."
            rows="9"
            required
            value={formData.content}
            onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
          />

          <fieldset className="color-picker">
            <legend>Culoare</legend>
            {['yellow', 'green', 'blue', 'pink'].map(color => (
              <label key={color} className={`swatch swatch-${color}`}>
                <input
                  type="radio"
                  name="noteColor"
                  value={color}
                  checked={formData.color === color}
                  onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                />
                <span>{color === 'yellow' ? 'Galben' : color === 'green' ? 'Verde' : color === 'blue' ? 'Albastru' : 'Roz'}</span>
              </label>
            ))}
          </fieldset>

          <button type="submit" id="submitButton">
            {editingId ? 'Salvează modificările' : 'Adaugă notiță'}
          </button>
          {editingId && (
            <button type="button" className="ghost" onClick={cancelEdit}>
              Anulează editarea
            </button>
          )}
        </form>
      </section>

      {/* Main Content */}
      <section className="workspace" aria-label="Lista notițe">
        <header className="toolbar">
          <div>
            <p className="eyebrow">Online Notes</p>
            <h2>Panou notițe</h2>
          </div>

          <div className="toolbar-actions">
            <input
              type="search"
              placeholder="Caută notițe..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <select
              aria-label="Sortare notițe"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="updated">Ultimele editate</option>
              <option value="created">Cele mai noi</option>
              <option value="title">Titlu A-Z</option>
            </select>
          </div>
        </header>

        <div className="stats" aria-live="polite">
          <span>{notes.length} {notes.length === 1 ? 'notiță' : 'notițe'}</span>
          <span>{pinnedCount} {pinnedCount === 1 ? 'fixată' : 'fixate'}</span>
        </div>

        <div className="notes-grid">
          {visibleNotes.length === 0 ? (
            <article className="empty-state">
              <h3>Nicio notiță găsită</h3>
              <p>{searchQuery ? 'Modifică termenul de căutare.' : 'Adaugă prima notiță pentru a începe.'}</p>
            </article>
          ) : (
            visibleNotes.map(note => (
              <article key={note.id} className={`note-card ${note.color} ${note.pinned ? 'is-pinned' : ''}`}>
                <div className="note-top">
                  <h3>{note.title}</h3>
                  <button
                    className="icon-button pin-button"
                    type="button"
                    title={note.pinned ? 'Scoate de la fixate' : 'Fixează notița'}
                    aria-label={note.pinned ? 'Scoate de la fixate' : 'Fixează notița'}
                    onClick={() => togglePinned(note.id)}
                  >
                    <span aria-hidden="true">★</span>
                  </button>
                </div>
                <p className="note-content">{note.content}</p>
                <div className="note-footer">
                  <time dateTime={new Date(note.updatedAt).toISOString()}>
                    {formatDate(note.updatedAt)}
                  </time>
                  <div className="note-actions">
                    <button className="small-button edit-button" type="button" onClick={() => handleEdit(note.id)}>
                      Editează
                    </button>
                    <button className="small-button danger delete-button" type="button" onClick={() => handleDelete(note.id)}>
                      Șterge
                    </button>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </main>
  );
}

export default App;