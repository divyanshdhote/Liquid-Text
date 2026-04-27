import { useRef, useEffect, useState, useCallback, memo } from 'react';
import { COLORS } from './ColorPicker.jsx';

/**
 * InkCanvas — Freehand drawing canvas overlay on a PDF page.
 *
 * Active only when toolMode is 'ink'. Captures pointer events to draw
 * strokes, which are serialized as point arrays and saved as annotations.
 *
 * @param {object} props
 * @param {boolean} props.isActive - whether ink mode is active
 * @param {number} props.pageWidth - rendered page width in px
 * @param {number} props.pageHeight - rendered page height in px
 * @param {string} props.color - stroke color name
 * @param {number} props.strokeWidth - stroke width in px
 * @param {Array} props.existingStrokes - previously saved ink annotations
 * @param {function} props.onStrokeComplete - callback with the completed stroke points
 */
const InkCanvas = memo(function InkCanvas({
  isActive = false,
  pageWidth,
  pageHeight,
  color = 'red',
  strokeWidth = 2,
  existingStrokes = [],
  onStrokeComplete,
}) {
  const canvasRef = useRef(null);
  const isDrawingRef = useRef(false);
  const pointsRef = useRef([]);

  const getColorHex = (colorName) => {
    const c = COLORS.find((c) => c.name === colorName);
    return c ? c.hex : '#f87171';
  };

  // Draw existing strokes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !pageWidth || !pageHeight) return;

    canvas.width = pageWidth;
    canvas.height = pageHeight;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, pageWidth, pageHeight);

    // Render existing ink strokes
    existingStrokes.forEach((stroke) => {
      if (!stroke.points || stroke.points.length < 2) return;

      ctx.beginPath();
      ctx.strokeStyle = getColorHex(stroke.color);
      ctx.lineWidth = stroke.strokeWidth || 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      const firstPt = stroke.points[0];
      ctx.moveTo(firstPt.x * pageWidth, firstPt.y * pageHeight);

      for (let i = 1; i < stroke.points.length; i++) {
        const pt = stroke.points[i];
        ctx.lineTo(pt.x * pageWidth, pt.y * pageHeight);
      }
      ctx.stroke();
    });
  }, [existingStrokes, pageWidth, pageHeight]);

  const getPointerPos = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / pageWidth,
      y: (e.clientY - rect.top) / pageHeight,
    };
  }, [pageWidth, pageHeight]);

  const handlePointerDown = useCallback((e) => {
    if (!isActive) return;
    e.preventDefault();
    e.stopPropagation();
    isDrawingRef.current = true;
    pointsRef.current = [getPointerPos(e)];

    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.setPointerCapture(e.pointerId);

    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.strokeStyle = getColorHex(color);
    ctx.lineWidth = strokeWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const pt = pointsRef.current[0];
    ctx.moveTo(pt.x * pageWidth, pt.y * pageHeight);
  }, [isActive, color, strokeWidth, pageWidth, pageHeight, getPointerPos]);

  const handlePointerMove = useCallback((e) => {
    if (!isDrawingRef.current) return;
    e.preventDefault();

    const pos = getPointerPos(e);
    pointsRef.current.push(pos);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.lineTo(pos.x * pageWidth, pos.y * pageHeight);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(pos.x * pageWidth, pos.y * pageHeight);
  }, [getPointerPos, pageWidth, pageHeight]);

  const handlePointerUp = useCallback((e) => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;

    const canvas = canvasRef.current;
    if (canvas) canvas.releasePointerCapture(e.pointerId);

    if (pointsRef.current.length >= 2) {
      onStrokeComplete?.({
        points: [...pointsRef.current],
        color,
        strokeWidth,
      });
    }
    pointsRef.current = [];
  }, [color, strokeWidth, onStrokeComplete]);

  return (
    <canvas
      ref={canvasRef}
      className={`ink-canvas ${isActive ? 'ink-canvas--active' : ''}`}
      width={pageWidth}
      height={pageHeight}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: `${pageWidth}px`,
        height: `${pageHeight}px`,
        pointerEvents: isActive ? 'auto' : 'none',
        cursor: isActive ? 'crosshair' : 'default',
        touchAction: 'none',
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    />
  );
});

export default InkCanvas;
