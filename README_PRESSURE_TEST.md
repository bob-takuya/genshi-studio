# Pressure-Sensitive Drawing Test

## Quick Start

### Option 1: Direct File Access
Simply open `pressure-test.html` in your web browser.

### Option 2: Local Server (Recommended)
```bash
python3 serve-pressure-test.py
# Then open http://localhost:8080/pressure-test.html
```

## Supported Devices

✅ **Tablets with Stylus**
- Wacom (Intuos, Cintiq, One)
- Apple iPad with Apple Pencil
- Microsoft Surface with Surface Pen
- Huion Tablets
- XP-Pen Tablets

✅ **Fallback Support**
- Mouse (simulated pressure)
- Touch (basic pressure if supported)
- Trackpad

## Features to Test

1. **Pressure Sensitivity**
   - Light touch = thin, transparent strokes
   - Heavy pressure = thick, opaque strokes

2. **Dynamic Controls**
   - Adjust "Pressure → Size" slider
   - Adjust "Pressure → Opacity" slider
   - Try different base brush sizes

3. **Device Detection**
   - Check device info panel (bottom right)
   - Verify pressure support indicator

4. **Brush vs Eraser**
   - Switch between tools
   - Both support pressure

## Keyboard Shortcuts

- `[` - Decrease brush size
- `]` - Increase brush size
- `B` - Brush tool
- `E` - Eraser tool

## Troubleshooting

**No Pressure Detected?**
1. Ensure tablet drivers are installed
2. Check tablet is in "pen mode" not "mouse mode"
3. Try a different browser (Chrome/Edge recommended)

**Laggy Performance?**
1. Close other tabs
2. Check GPU acceleration is enabled
3. Reduce brush size

## Technical Details

- Uses PointerEvent API for pressure
- Falls back to Touch/Mouse events
- 60fps target with WebGL rendering
- Cross-browser compatible