import { useState, useMemo, useRef } from 'react';
import {
  FolderOpen, FileText, Trash2, Search,
  ArrowUpDown, Pencil, Check, ChevronLeft, FolderPlus, X, Plus, ChevronRight,
} from 'lucide-react';

function formatDate(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  const day = date.getDate();
  const month = date.toLocaleString('default', { month: 'short' });
  const year = date.getFullYear();
  const hours = date.getHours();
  const mins = String(date.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const h12 = hours % 12 || 12;
  const now = new Date();

  if (now.getFullYear() === year) {
    return `Edited ${day} ${month} at ${h12}:${mins} ${ampm}`;
  }
  return `Edited ${day} ${month} ${year}`;
}

/**
 * ProjectManager — Nested folder file browser.
 *
 * Props:
 *   folders        — sub-folders at current level
 *   documents      — documents at current level
 *   folderPath     — [{id, name}, ...] navigation breadcrumb
 *   onEnterFolder  — enter a sub-folder
 *   onNavigateBack — go up one level
 *   onDeleteFolder — delete a folder
 *   onCreateFolder — create a new folder at current level
 *   onOpenFile     — open file picker
 *   onOpenDocument — open a document
 *   onDeleteDocument — delete a document
 */
export default function ProjectManager({
  folders = [],
  documents = [],
  folderPath = [],
  onEnterFolder,
  onNavigateBack,
  onDeleteFolder,
  onCreateFolder,
  onOpenFile,
  onOpenDocument,
  onDeleteDocument,
}) {
  const [editMode, setEditMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [sortBy, setSortBy] = useState('date');
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState(null);

  const isRoot = folderPath.length === 0;
  const currentName = isRoot ? 'Home' : folderPath[folderPath.length - 1].name;

  const items = useMemo(() => {
    const folderItems = folders.map((f) => ({
      id: `folder-${f.id}`,
      realId: f.id,
      name: f.name,
      type: 'folder',
      date: f.updatedAt || f.createdAt,
      raw: f,
    }));
    const docItems = documents.map((d) => ({
      id: `file-${d.id}`,
      realId: d.id,
      name: d.fileName?.replace('.pdf', '') || 'Untitled',
      type: 'file',
      date: d.createdAt,
      raw: d,
    }));

    let list = [...folderItems, ...docItems];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((item) => item.name.toLowerCase().includes(q));
    }

    list.sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'date') return new Date(b.date) - new Date(a.date);
      return 0;
    });

    return list;
  }, [folders, documents, searchQuery, sortBy]);

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleDeleteSelected = () => {
    selectedIds.forEach((compositeId) => {
      if (typeof compositeId === 'string' && compositeId.startsWith('folder-')) {
        onDeleteFolder?.(Number(compositeId.replace('folder-', '')));
      } else if (typeof compositeId === 'string' && compositeId.startsWith('file-')) {
        onDeleteDocument?.(Number(compositeId.replace('file-', '')));
      }
    });
    setSelectedIds(new Set());
    setEditMode(false);
  };

  const handleItemClick = (item) => {
    if (editMode) {
      toggleSelect(item.id);
      return;
    }
    if (item.type === 'folder') {
      onEnterFolder(item.realId);
    } else {
      onOpenDocument?.(item.raw);
    }
  };

  const handleCreateFolder = () => {
    if (newFolderName !== null && newFolderName.trim()) {
      onCreateFolder(newFolderName.trim());
      setNewFolderName(null);
    } else {
      setNewFolderName('New Folder');
    }
  };

  const handleNewFolderKeyDown = (e) => {
    if (e.key === 'Enter') {
      if (newFolderName.trim()) onCreateFolder(newFolderName.trim());
      setNewFolderName(null);
    } else if (e.key === 'Escape') {
      setNewFolderName(null);
    }
  };

  const sortLabel = sortBy === 'name' ? '▲ By Name' : '▲ By Date';

  return (
    <div className="home-screen" id="home-screen">
      {/* Sidebar */}
      <aside className="home-sidebar">
        <h3 className="home-sidebar__title">Open Document</h3>
        <button className="home-sidebar__btn" onClick={onOpenFile} id="btn-sidebar-open">
          <div className="home-sidebar__icon"><FileText size={20} /></div>
          <span>Open File</span>
        </button>
      </aside>

      {/* Main content */}
      <div className="home-content">
        {/* Single top bar */}
        <div className="home-topbar" id="home-topbar">
          <div className="home-topbar__left">
            {/* Back button moved to title row */}
            {editMode && selectedIds.size > 0 && (
              <button className="home-topbar__btn home-topbar__btn--danger" onClick={handleDeleteSelected}>
                <Trash2 size={13} />
                Delete ({selectedIds.size})
              </button>
            )}
            {searchOpen && (
              <div className="home-topbar__search">
                <Search size={13} />
                <input
                  type="text"
                  className="home-topbar__search-input"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                />
                {searchQuery && (
                  <button className="home-topbar__search-clear" onClick={() => setSearchQuery('')}>
                    <X size={11} />
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="home-topbar__right">
            <button
              className={`home-topbar__btn ${editMode ? 'home-topbar__btn--active' : ''}`}
              onClick={() => { setEditMode(!editMode); setSelectedIds(new Set()); }}
            >
              {editMode ? 'Done' : 'Edit'}
            </button>

            <div style={{ position: 'relative' }}>
              <button className="home-topbar__btn" onClick={() => setSortDropdownOpen(!sortDropdownOpen)}>
                {sortLabel}
              </button>
              {sortDropdownOpen && (
                <div className="home-sort-menu fade-in-scale" id="sort-menu">
                  <button
                    className={`home-sort-menu__item ${sortBy === 'name' ? 'home-sort-menu__item--active' : ''}`}
                    onClick={() => { setSortBy('name'); setSortDropdownOpen(false); }}
                  >By Name</button>
                  <button
                    className={`home-sort-menu__item ${sortBy === 'date' ? 'home-sort-menu__item--active' : ''}`}
                    onClick={() => { setSortBy('date'); setSortDropdownOpen(false); }}
                  >By Date</button>
                </div>
              )}
            </div>

            <button className="home-topbar__btn" onClick={handleCreateFolder}>
              <FolderPlus size={14} />
            </button>

            <button className="home-topbar__btn" onClick={onOpenFile}>
              <Plus size={14} />
            </button>

            <button
              className={`home-topbar__btn ${searchOpen ? 'home-topbar__btn--active' : ''}`}
              onClick={() => { setSearchOpen(!searchOpen); if (searchOpen) setSearchQuery(''); }}
            >
              <Search size={14} />
            </button>
          </div>
        </div>

        {/* Title Row with inline Back button */}
        <div className="home-title-row">
          {!isRoot && (
            <button
              className="btn btn-ghost btn-sm home-title-back"
              onClick={() => { onNavigateBack(); setEditMode(false); setSelectedIds(new Set()); setSearchOpen(false); setSearchQuery(''); }}
            >
              <ChevronLeft size={16} />
              Back
            </button>
          )}
          <h2 className="home-content__title">{currentName}</h2>
        </div>

        {/* Grid */}
        {items.length === 0 && newFolderName === null ? (
          <div className="home-empty">
            <FolderOpen size={40} strokeWidth={1} />
            <p>{searchQuery ? 'No results found.' : 'Empty folder. Add files or create a sub-folder.'}</p>
          </div>
        ) : (
          <div className="home-grid" id="project-grid">
            {newFolderName !== null && (
              <div className="home-card home-card--new">
                <div className="home-card__thumb home-card__thumb--new">
                  <div className="home-card__thumb-inner"><FolderOpen size={32} strokeWidth={1.2} /></div>
                </div>
                <div className="home-card__info">
                  <input
                    className="home-card__name-input"
                    type="text"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    onKeyDown={handleNewFolderKeyDown}
                    onBlur={() => { if (newFolderName.trim()) onCreateFolder(newFolderName.trim()); setNewFolderName(null); }}
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </div>
            )}

            {items.map((item) => {
              const isSelected = selectedIds.has(item.id);
              return (
                <div
                  key={item.id}
                  className={`home-card ${isSelected ? 'home-card--selected' : ''} ${editMode ? 'home-card--edit-mode' : ''}`}
                  onClick={() => handleItemClick(item)}
                  id={`item-${item.type}-${item.id}`}
                >
                  {editMode && (
                    <div className={`home-card__checkbox ${isSelected ? 'home-card__checkbox--checked' : ''}`}>
                      {isSelected && <Check size={10} />}
                    </div>
                  )}

                  <div className={`home-card__thumb ${item.type === 'file' ? 'home-card__thumb--file' : ''}`}>
                    <div className="home-card__thumb-inner">
                      {item.type === 'folder' ? <FolderOpen size={32} strokeWidth={1.2} /> : <FileText size={28} strokeWidth={1.2} />}
                    </div>
                  </div>

                  <div className="home-card__info">
                    <span className="home-card__name" title={item.name}>{item.name}</span>
                    <span className="home-card__meta">{formatDate(item.date)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
