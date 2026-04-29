import { useState } from 'react';
import {
  Home, Undo2, Redo2,
  Share, Search, HelpCircle, MoreHorizontal,
  PenLine, Highlighter, Eraser, SquareDashed
} from 'lucide-react';
import usePdfStore from '../../stores/pdfStore.js';
import ColorPicker from '../annotations/ColorPicker.jsx';

function getColorHex(name) {
  const colors = {
    yellow: '#fef08a',
    green: '#bbf7d0',
    blue: '#bfdbfe',
    red: '#fecaca',
    purple: '#e9d5ff',
    black: '#000000',
    white: '#ffffff',
  };
  return colors[name] || name;
}

export default function ViewerToolbar({ fileName, onHome }) {
  const { toolMode, setToolMode, activeColor, setActiveColor, isSearchOpen, setSearchOpen } = usePdfStore();
  const [colorPickerOpen, setColorPickerOpen] = useState(false);

  return (
    <div className="viewer-toolbar">
      {/* Left Group */}
      <div className="viewer-toolbar__group">
        <button className="viewer-toolbar__btn" onClick={onHome} title="Home">
          <Home size={18} strokeWidth={1.5} />
        </button>
        <button className="viewer-toolbar__btn" title="Undo">
          <Undo2 size={18} strokeWidth={1.5} />
        </button>
        <button className="viewer-toolbar__btn" title="Redo">
          <Redo2 size={18} strokeWidth={1.5} />
        </button>
      </div>

      {/* Center Group - Tools & Filename */}
      <div className="viewer-toolbar__center">
        <div className="viewer-toolbar__filename">{fileName || 'Untitled Document'}</div>
        <div className="viewer-toolbar__tools">
          <button 
            className={`viewer-toolbar__btn ${toolMode === 'select' ? 'viewer-toolbar__btn--active' : ''}`}
            onClick={() => setToolMode('select')}
            title="Text Selection"
          >
            <div className="viewer-toolbar__text-icon">A</div>
          </button>

          <button 
            className={`viewer-toolbar__btn ${toolMode === 'ink' ? 'viewer-toolbar__btn--active' : ''}`}
            onClick={() => setToolMode('ink')}
            title="Pen Tool"
          >
            <PenLine size={18} strokeWidth={1.5} />
          </button>

          <button 
            className={`viewer-toolbar__btn ${toolMode === 'highlight' ? 'viewer-toolbar__btn--active' : ''}`}
            onClick={() => setToolMode('highlight')}
            title="Highlighter"
          >
            <Highlighter size={18} strokeWidth={1.5} />
          </button>

          <button 
            className={`viewer-toolbar__btn ${toolMode === 'eraser' ? 'viewer-toolbar__btn--active' : ''}`}
            onClick={() => setToolMode('eraser')}
            title="Eraser"
          >
            <Eraser size={18} strokeWidth={1.5} />
          </button>

          <button 
            className="viewer-toolbar__btn"
            title="Select Area"
          >
            <SquareDashed size={18} strokeWidth={1.5} />
          </button>
          
          <div className="viewer-toolbar__color-wrapper">
             <button
               className="viewer-toolbar__color-swatch"
               style={{ backgroundColor: getColorHex(activeColor) }}
               onClick={() => setColorPickerOpen(!colorPickerOpen)}
             />
             {colorPickerOpen && (
               <div className="viewer-toolbar__color-dropdown fade-in-scale">
                 <ColorPicker
                   activeColor={activeColor}
                   onColorSelect={(c) => { setActiveColor(c); setColorPickerOpen(false); }}
                   compact
                 />
               </div>
             )}
          </div>
        </div>
      </div>

      {/* Right Group */}
      <div className="viewer-toolbar__group viewer-toolbar__group--right">
        <button className="viewer-toolbar__btn-pill" title="Share">
          <Share size={14} />
          <span>Share</span>
        </button>
        <button 
          className={`viewer-toolbar__btn ${isSearchOpen ? 'viewer-toolbar__btn--active' : ''}`}
          title="Search"
          onClick={() => setSearchOpen(!isSearchOpen)}
        >
          <Search size={18} strokeWidth={1.5} />
        </button>
        <button className="viewer-toolbar__btn" title="Help">
          <HelpCircle size={18} strokeWidth={1.5} />
        </button>
        <button className="viewer-toolbar__btn" title="More">
          <MoreHorizontal size={18} strokeWidth={1.5} />
        </button>
      </div>
    </div>
  );
}
