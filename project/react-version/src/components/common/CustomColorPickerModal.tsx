import { useState, useEffect, useRef, useCallback } from 'react';
import type { ColorTheme } from '../../utils/colorThemes';

interface CustomColorPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTheme: ColorTheme;
  customColor?: string;
  onChangeColor: (hex: string | undefined) => void;
}

const PRESET_SWATCHES = [
  '#000000',
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#67e8f9',
  '#8b5cf6',
  '#3730a3',
  '#ec4899',
];

/* ── Color conversion helpers ── */
function hexToHsv(hex: string): { h: number; s: number; v: number } {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d + 6) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
  }
  const s = max === 0 ? 0 : d / max;
  return { h, s, v: max };
}

function hsvToHex(h: number, s: number, v: number): string {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let r = 0, g = 0, b = 0;
  if (h < 60) { r = c; g = x; }
  else if (h < 120) { r = x; g = c; }
  else if (h < 180) { g = c; b = x; }
  else if (h < 240) { g = x; b = c; }
  else if (h < 300) { r = x; b = c; }
  else { r = c; b = x; }
  const toHex = (n: number) => Math.round((n + m) * 255).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function hueToHex(h: number): string {
  return hsvToHex(h, 1, 1);
}

export function CustomColorPickerModal({
  isOpen,
  onClose,
  currentTheme,
  customColor,
  onChangeColor,
}: CustomColorPickerModalProps) {
  const defaultThemeHex = currentTheme.accent;
  const activeHex = customColor || defaultThemeHex;

  const initialHsv = hexToHsv(activeHex);
  const [hue, setHue] = useState(initialHsv.h);
  const [sat, setSat] = useState(initialHsv.s);
  const [val, setVal] = useState(initialHsv.v);
  const [hexInput, setHexInput] = useState(activeHex);

  const spectrumRef = useRef<HTMLDivElement>(null);
  const hueRef = useRef<HTMLDivElement>(null);
  const isDraggingSpectrum = useRef(false);
  const isDraggingHue = useRef(false);

  // Sync state when external color changes
  useEffect(() => {
    const hsv = hexToHsv(activeHex);
    setHue(hsv.h);
    setSat(hsv.s);
    setVal(hsv.v);
    setHexInput(activeHex);
  }, [activeHex, isOpen]);

  const applyColor = useCallback((h: number, s: number, v: number) => {
    const hex = hsvToHex(h, s, v);
    setHexInput(hex);
    onChangeColor(hex);
  }, [onChangeColor]);

  /* ── Spectrum (Saturation/Value) handlers ── */
  const handleSpectrumInteraction = useCallback((clientX: number, clientY: number) => {
    if (!spectrumRef.current) return;
    const rect = spectrumRef.current.getBoundingClientRect();
    const newSat = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const newVal = Math.max(0, Math.min(1, 1 - (clientY - rect.top) / rect.height));
    setSat(newSat);
    setVal(newVal);
    applyColor(hue, newSat, newVal);
  }, [hue, applyColor]);

  const handleSpectrumMouseDown = (e: React.MouseEvent) => {
    isDraggingSpectrum.current = true;
    handleSpectrumInteraction(e.clientX, e.clientY);
  };

  /* ── Hue slider handlers ── */
  const handleHueInteraction = useCallback((clientY: number) => {
    if (!hueRef.current) return;
    const rect = hueRef.current.getBoundingClientRect();
    const newHue = Math.max(0, Math.min(360, ((clientY - rect.top) / rect.height) * 360));
    setHue(newHue);
    applyColor(newHue, sat, val);
  }, [sat, val, applyColor]);

  const handleHueMouseDown = (e: React.MouseEvent) => {
    isDraggingHue.current = true;
    handleHueInteraction(e.clientY);
  };

  /* ── Global mouse move/up ── */
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingSpectrum.current) handleSpectrumInteraction(e.clientX, e.clientY);
      if (isDraggingHue.current) handleHueInteraction(e.clientY);
    };
    const handleMouseUp = () => {
      isDraggingSpectrum.current = false;
      isDraggingHue.current = false;
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleSpectrumInteraction, handleHueInteraction]);

  const handleHexInput = (value: string) => {
    setHexInput(value);
    const clean = value.startsWith('#') ? value : `#${value}`;
    if (/^#([A-Fa-f0-9]{6})$/.test(clean)) {
      const hsv = hexToHsv(clean);
      setHue(hsv.h);
      setSat(hsv.s);
      setVal(hsv.v);
      onChangeColor(clean);
    }
  };

  const handleReset = () => {
    const hsv = hexToHsv(defaultThemeHex);
    setHue(hsv.h);
    setSat(hsv.s);
    setVal(hsv.v);
    setHexInput(defaultThemeHex);
    onChangeColor(undefined);
  };

  if (!isOpen) return null;

  const currentHex = hsvToHex(hue, sat, val);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0, 0, 0, 0.35)',
        backdropFilter: 'blur(2px)',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '320px',
          background: '#ffffff',
          borderRadius: '14px',
          padding: '20px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0,0,0,0.05)',
          color: '#1f2937',
          fontFamily: "'Inter', sans-serif",
          animation: 'fadeInDown 0.2s ease',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#111827' }}>
            Choose Color
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#9ca3af',
              fontSize: 18,
              cursor: 'pointer',
              padding: '2px 6px',
              borderRadius: 4,
              lineHeight: 1,
            }}
          >
            ✕
          </button>
        </div>

        {/* Spectrum + Hue Slider */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
          {/* Saturation/Value Gradient Square */}
          <div
            ref={spectrumRef}
            onMouseDown={handleSpectrumMouseDown}
            style={{
              flex: 1,
              height: 200,
              borderRadius: 8,
              position: 'relative',
              cursor: 'crosshair',
              background: `
                linear-gradient(to top, #000000, transparent),
                linear-gradient(to right, #ffffff, ${hueToHex(hue)})
              `,
              overflow: 'hidden',
              border: '1px solid #e5e7eb',
            }}
          >
            {/* Picker circle */}
            <div style={{
              position: 'absolute',
              left: `${sat * 100}%`,
              top: `${(1 - val) * 100}%`,
              width: 14,
              height: 14,
              borderRadius: '50%',
              border: '2px solid #ffffff',
              boxShadow: '0 0 4px rgba(0,0,0,0.4)',
              transform: 'translate(-50%, -50%)',
              pointerEvents: 'none',
              background: currentHex,
            }} />
          </div>

          {/* Hue Vertical Slider */}
          <div
            ref={hueRef}
            onMouseDown={handleHueMouseDown}
            style={{
              width: 22,
              height: 200,
              borderRadius: 8,
              position: 'relative',
              cursor: 'pointer',
              background: 'linear-gradient(to bottom, #ff0000, #ff8000, #ffff00, #00ff00, #00ffff, #0000ff, #8000ff, #ff00ff, #ff0000)',
              border: '1px solid #e5e7eb',
            }}
          >
            {/* Hue handle */}
            <div style={{
              position: 'absolute',
              left: '50%',
              top: `${(hue / 360) * 100}%`,
              width: 18,
              height: 10,
              borderRadius: 5,
              border: '2px solid #ffffff',
              boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
              transform: 'translate(-50%, -50%)',
              pointerEvents: 'none',
              background: hueToHex(hue),
            }} />
          </div>
        </div>

        {/* Hex Input Row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          {/* Eyedropper icon placeholder */}
          <div style={{
            width: 32, height: 32, borderRadius: 6,
            background: currentHex,
            border: '1px solid #e5e7eb',
            flexShrink: 0,
            boxShadow: `0 0 8px ${currentHex}44`,
          }} />
          <div style={{ display: 'flex', alignItems: 'center', flex: 1, background: '#f9fafb', border: '1px solid #d1d5db', borderRadius: 6, overflow: 'hidden' }}>
            <span style={{ padding: '0 8px', fontSize: 13, color: '#9ca3af', fontWeight: 500 }}>#</span>
            <input
              type="text"
              value={hexInput.replace('#', '').toUpperCase()}
              onChange={(e) => handleHexInput(`#${e.target.value}`)}
              placeholder="00D2FF"
              maxLength={6}
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                padding: '7px 8px 7px 0',
                color: '#1f2937',
                fontSize: 13,
                fontWeight: 600,
                fontFamily: 'monospace',
                outline: 'none',
              }}
            />
          </div>
        </div>

        {/* Last Used / Preset Swatches */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', marginBottom: 8 }}>Last Used</div>
          <div style={{ display: 'flex', gap: 6 }}>
            {PRESET_SWATCHES.map((hex) => {
              const isSelected = activeHex.toLowerCase() === hex.toLowerCase();
              return (
                <button
                  key={hex}
                  onClick={() => {
                    const hsv = hexToHsv(hex);
                    setHue(hsv.h);
                    setSat(hsv.s);
                    setVal(hsv.v);
                    setHexInput(hex);
                    onChangeColor(hex);
                  }}
                  title={hex}
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 6,
                    background: hex,
                    border: isSelected ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    flexShrink: 0,
                    boxShadow: isSelected ? `0 0 6px ${hex}88` : 'none',
                  }}
                />
              );
            })}
          </div>
        </div>

        {/* Footer: Reset */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 10, borderTop: '1px solid #f3f4f6' }}>
          <button
            onClick={handleReset}
            style={{
              background: '#f9fafb',
              border: '1px solid #d1d5db',
              color: '#6b7280',
              padding: '6px 14px',
              borderRadius: 6,
              fontSize: 11,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            Reset to Default
          </button>
        </div>
      </div>
    </div>
  );
}
