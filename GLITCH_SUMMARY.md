# Genshi Studio Display Glitches - Quick Reference

## Critical Display Issues Found

### 1. Font Rendering Issues
- **Problem**: SF Pro Display font won't load on Windows/Linux
- **User Impact**: Different font appearance, potential layout shifts
- **Fix**: Add fallback fonts: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif`

### 2. Canvas Performance Issues  
- **Problem**: Pattern generation blocks UI thread
- **User Impact**: Frozen/unresponsive controls during pattern updates
- **Fix**: Implement Web Workers for background processing

### 3. Mobile Display Problems
- **Problem**: Canvas may be cut off, touch issues on iOS
- **User Impact**: Poor mobile experience, unusable on some devices
- **Fix**: Better viewport handling, touch event optimization

### 4. No Error Handling
- **Problem**: If canvas fails, entire app breaks with white screen
- **User Impact**: Complete app failure with no recovery
- **Fix**: Add try-catch blocks and fallback UI

### 5. Large Initial Load
- **Problem**: 47KB inline HTML file
- **User Impact**: Slow initial load on mobile/slow connections
- **Fix**: Consider code splitting or lazy loading

## Browser Compatibility Issues
- Uses modern ES6+ without transpilation
- No polyfills for older browsers
- May fail completely on IE11 or older Safari

## Quick Test Checklist
- [ ] Test on Windows with Chrome/Firefox/Edge
- [ ] Test on iPhone Safari (check touch events)
- [ ] Test on Android Chrome
- [ ] Test with slow 3G throttling
- [ ] Test with screen reader
- [ ] Check memory usage over time

---
**Report Date**: 2025-07-09  
**Full Report**: [genshi-studio-display-glitches-report.md](./genshi-studio-display-glitches-report.md)