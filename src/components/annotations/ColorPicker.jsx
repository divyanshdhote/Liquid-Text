/**
 * ColorPicker — Curated 8-color palette for highlights, excerpts, and tags.
 *
 * @param {object} props
 * @param {string} props.activeColor - currently selected color name
 * @param {function} props.onColorSelect - callback when a color is picked
 * @param {boolean} props.compact - if true, renders smaller swatches
 */

const COLORS = [
  { name: 'yellow', hex: '#facc15', label: 'Yellow' },
  { name: 'green', hex: '#34d399', label: 'Green' },
  { name: 'blue', hex: '#60a5fa', label: 'Blue' },
  { name: 'pink', hex: '#f472b6', label: 'Pink' },
  { name: 'orange', hex: '#fb923c', label: 'Orange' },
  { name: 'purple', hex: '#a78bfa', label: 'Purple' },
  { name: 'red', hex: '#f87171', label: 'Red' },
  { name: 'teal', hex: '#2dd4bf', label: 'Teal' },
];

export default function ColorPicker({ activeColor = 'yellow', onColorSelect, compact = false }) {
  return (
    <div className={`color-picker ${compact ? 'color-picker--compact' : ''}`} id="color-picker">
      {COLORS.map((color) => (
        <button
          key={color.name}
          className={`color-picker__swatch ${activeColor === color.name ? 'color-picker__swatch--active' : ''}`}
          style={{ '--swatch-color': color.hex }}
          onClick={() => onColorSelect(color.name)}
          title={color.label}
          id={`color-${color.name}`}
        />
      ))}
    </div>
  );
}

export { COLORS };
