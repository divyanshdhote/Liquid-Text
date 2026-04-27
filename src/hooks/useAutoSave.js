import { useEffect, useRef, useCallback } from 'react';

/**
 * useAutoSave — Debounced auto-save hook.
 * 
 * Watches a value and calls a save function after a debounce delay.
 * Used to persist state changes to Dexie without saving on every keystroke.
 * 
 * @param {*} value - The value to watch for changes
 * @param {Function} saveFn - Async function to call when saving
 * @param {number} delay - Debounce delay in ms (default: 500)
 * @param {boolean} enabled - Whether auto-save is enabled (default: true)
 * 
 * Usage:
 *   useAutoSave(noteText, (text) => updateNote(annotationId, text), 500);
 */
export default function useAutoSave(value, saveFn, delay = 500, enabled = true) {
  const timeoutRef = useRef(null);
  const savedValueRef = useRef(value);
  const saveFnRef = useRef(saveFn);

  // Keep saveFn ref up to date without triggering re-renders
  saveFnRef.current = saveFn;

  const save = useCallback(() => {
    if (savedValueRef.current !== value) {
      savedValueRef.current = value;
      saveFnRef.current(value);
    }
  }, [value]);

  useEffect(() => {
    if (!enabled) return;

    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new debounced save
    timeoutRef.current = setTimeout(save, delay);

    // Cleanup on unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, delay, enabled, save]);

  // Save immediately on unmount (flush pending changes)
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        save();
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Return a manual save trigger
  return { saveNow: save };
}
