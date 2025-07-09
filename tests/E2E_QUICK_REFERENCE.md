# Genshi Studio E2E Testing - Quick Reference

## 🚀 Quick Start

```bash
# Run all tests
./run-e2e-tests.sh

# Run specific test suite
./run-e2e-tests.sh drawing
./run-e2e-tests.sh performance
./run-e2e-tests.sh accessibility

# Run in specific browser
./run-e2e-tests.sh all chromium
./run-e2e-tests.sh visual firefox

# Run and open report
./run-e2e-tests.sh all all --open
```

## 📁 Key Files

- `playwright.config.ts` - Main configuration
- `tests/e2e/specs/` - Test specifications
- `tests/e2e/pages/` - Page objects
- `tests/reports/html/index.html` - Test report

## 🎯 Test Suites

1. **Loading Tests** (`01-app-loading.spec.ts`)
   - App initialization
   - Performance metrics
   - PWA features

2. **Drawing Tests** (`02-drawing-tools.spec.ts`)
   - Canvas operations
   - Tool functionality
   - Export features

3. **Pattern Tests** (`03-cultural-patterns.spec.ts`)
   - Pattern generation
   - Customization
   - Layering

4. **Performance Tests** (`04-performance.spec.ts`)
   - 60fps validation
   - Memory limits
   - Load times

5. **Accessibility Tests** (`05-accessibility.spec.ts`)
   - WCAG compliance
   - Keyboard navigation
   - Screen readers

6. **Visual Tests** (`06-visual-regression.spec.ts`)
   - UI consistency
   - Cross-browser visuals
   - Responsive design

## 📊 Quality Requirements

- ✅ **90%+ Pass Rate** - Mandatory for deployment
- ✅ **60fps** - Canvas rendering performance
- ✅ **<512MB** - Memory usage limit
- ✅ **<3s** - Page load time
- ✅ **WCAG AA** - Accessibility compliance

## 🛠️ Common Commands

```bash
# Install/update Playwright
npm install @playwright/test

# Install browsers
npx playwright install

# Run specific test file
npx playwright test tests/e2e/specs/02-drawing-tools.spec.ts

# Run with UI mode
npx playwright test --ui

# Debug mode
npx playwright test --debug

# Generate report
npx playwright show-report
```

## 🐛 Debugging

1. **Failed Tests**: Check `tests/results/` for screenshots/videos
2. **Visual Diffs**: Compare in `tests/screenshots/`
3. **Performance**: Review metrics in JSON reports
4. **Accessibility**: Check axe-core violations in console

## 📈 CI/CD Integration

```yaml
# GitHub Actions example
- name: Run E2E Tests
  run: ./run-e2e-tests.sh
- name: Upload Results
  uses: actions/upload-artifact@v3
  with:
    name: test-results
    path: tests/reports/
```

---

**Need Help?** Check the full documentation in `E2E_TESTING_IMPLEMENTATION_SUMMARY.md`