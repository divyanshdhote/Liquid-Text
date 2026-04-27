import { useState, useRef, useEffect } from 'react';

/**
 * SplitPane — A simple resizable split pane layout.
 *
 * @param {object} props
 * @param {React.ReactNode} props.left - Left pane content
 * @param {React.ReactNode} props.right - Right pane content
 * @param {number} props.initialLeftWidth - Initial width of the left pane in percentage (0-100)
 */
export default function SplitPane({ left, right, initialLeftWidth = 50 }) {
  const [leftWidth, setLeftWidth] = useState(initialLeftWidth);
  const isDragging = useRef(false);
  const containerRef = useRef(null);

  const handleMouseDown = (e) => {
    isDragging.current = true;
    document.body.style.cursor = 'col-resize';
  };

  const handleMouseUp = () => {
    isDragging.current = false;
    document.body.style.cursor = 'default';
  };

  const handleMouseMove = (e) => {
    if (!isDragging.current || !containerRef.current) return;
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const newLeftWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
    
    // Constrain width between 20% and 80%
    if (newLeftWidth > 20 && newLeftWidth < 80) {
      setLeftWidth(newLeftWidth);
    }
  };

  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  return (
    <div className="split-pane" ref={containerRef}>
      <div className="split-pane__pane" style={{ width: `${leftWidth}%` }}>
        {left}
      </div>
      <div 
        className="split-pane__divider" 
        onMouseDown={handleMouseDown}
        title="Drag to resize"
      >
        <div className="split-pane__divider-handle" />
      </div>
      <div className="split-pane__pane" style={{ width: `${100 - leftWidth}%` }}>
        {right}
      </div>
    </div>
  );
}
