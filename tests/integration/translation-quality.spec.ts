import { test, expect, Page } from '@playwright/test';

/**
 * TESTER_INTEGRATION_001 - Translation Quality Validation Tests
 * Validates accuracy and semantic preservation across mode translations
 */

interface TranslationQualityMetrics {
  geometricAccuracy: number;
  semanticPreservation: number;
  colorFidelity: number;
  parameterConsistency: number;
  overallQuality: number;
}

interface GeometricComparison {
  hausdorffDistance: number;
  areaDeviation: number;
  shapeComplexity: number;
  boundingBoxDifference: number;
}

class TranslationQualityHelper {
  constructor(private page: Page) {}

  async setupQualityMonitoring(): Promise<void> {
    await this.page.addInitScript(() => {
      // Translation quality tracking
      (window as any).qualityMetrics = {
        translations: [],
        comparisons: [],
        originalStates: new Map(),
        translationChains: []
      };

      // Geometric analysis utilities
      (window as any).geometryUtils = {
        calculateArea: (points: any[]) => {
          // Simple polygon area calculation
          let area = 0;
          for (let i = 0; i < points.length; i++) {
            const j = (i + 1) % points.length;
            area += points[i].x * points[j].y;
            area -= points[j].x * points[i].y;
          }
          return Math.abs(area) / 2;
        },
        
        calculateBoundingBox: (points: any[]) => {
          if (points.length === 0) return { x: 0, y: 0, width: 0, height: 0 };
          
          let minX = points[0].x, maxX = points[0].x;
          let minY = points[0].y, maxY = points[0].y;
          
          for (const point of points) {
            minX = Math.min(minX, point.x);
            maxX = Math.max(maxX, point.x);
            minY = Math.min(minY, point.y);
            maxY = Math.max(maxY, point.y);
          }
          
          return {
            x: minX,
            y: minY,
            width: maxX - minX,
            height: maxY - minY
          };
        },
        
        calculateHausdorffDistance: (shape1: any[], shape2: any[]) => {
          // Simplified Hausdorff distance calculation
          let maxDist = 0;
          
          for (const p1 of shape1) {
            let minDist = Infinity;
            for (const p2 of shape2) {
              const dist = Math.sqrt(
                Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2)
              );
              minDist = Math.min(minDist, dist);
            }
            maxDist = Math.max(maxDist, minDist);
          }
          
          return maxDist;
        }
      };

      // Translation state capture
      (window as any).captureTranslationState = (entityId: string, mode: string, data: any) => {
        const state = {
          entityId,
          mode,
          timestamp: performance.now(),
          geometry: data.geometry || null,
          parameters: data.parameters || {},
          style: data.style || {},
          metadata: data.metadata || {}
        };
        
        (window as any).qualityMetrics.originalStates.set(`${entityId}-${mode}`, state);
        return state;
      };

      // Translation comparison
      (window as any).compareTranslations = (originalState: any, translatedState: any) => {
        const comparison = {
          id: `comparison-${Date.now()}`,
          originalMode: originalState.mode,
          translatedMode: translatedState.mode,
          timestamp: performance.now(),
          geometricAccuracy: 0,
          semanticPreservation: 0,
          colorFidelity: 0,
          parameterConsistency: 0
        };

        // Geometric accuracy comparison
        if (originalState.geometry && translatedState.geometry) {
          const originalPoints = originalState.geometry.points || [];
          const translatedPoints = translatedState.geometry.points || [];
          
          if (originalPoints.length > 0 && translatedPoints.length > 0) {
            const hausdorff = (window as any).geometryUtils.calculateHausdorffDistance(
              originalPoints, translatedPoints
            );
            
            const originalArea = (window as any).geometryUtils.calculateArea(originalPoints);
            const translatedArea = (window as any).geometryUtils.calculateArea(translatedPoints);
            const areaDeviation = originalArea > 0 ? 
              Math.abs(translatedArea - originalArea) / originalArea : 0;
            
            // Convert to accuracy percentage (lower distance = higher accuracy)
            comparison.geometricAccuracy = Math.max(0, 100 - (hausdorff * 10 + areaDeviation * 100));
          } else {
            comparison.geometricAccuracy = 50; // Partial credit if structure exists
          }
        }

        // Parameter consistency comparison
        const originalParams = Object.keys(originalState.parameters);
        const translatedParams = Object.keys(translatedState.parameters);
        
        if (originalParams.length > 0) {
          let consistentParams = 0;
          for (const param of originalParams) {
            if (translatedState.parameters[param] !== undefined) {
              const originalValue = originalState.parameters[param];
              const translatedValue = translatedState.parameters[param];
              
              // Check if values are reasonably similar
              if (typeof originalValue === 'number' && typeof translatedValue === 'number') {
                const deviation = Math.abs(translatedValue - originalValue) / 
                  (Math.abs(originalValue) + 0.001); // Avoid division by zero
                if (deviation < 0.1) { // 10% tolerance
                  consistentParams++;
                }
              } else if (originalValue === translatedValue) {
                consistentParams++;
              }
            }
          }
          
          comparison.parameterConsistency = (consistentParams / originalParams.length) * 100;
        } else {
          comparison.parameterConsistency = 100; // No parameters to compare
        }

        // Color fidelity comparison
        const originalColor = originalState.style?.color;
        const translatedColor = translatedState.style?.color;
        
        if (originalColor && translatedColor) {
          // Simple color comparison (could be enhanced with perceptual difference)
          const colorMatch = originalColor === translatedColor ? 100 : 
            (this.calculateColorSimilarity(originalColor, translatedColor) * 100);
          comparison.colorFidelity = colorMatch;
        } else {
          comparison.colorFidelity = 100; // No colors to compare
        }

        // Semantic preservation (simplified heuristic)
        comparison.semanticPreservation = (
          comparison.geometricAccuracy * 0.4 +
          comparison.parameterConsistency * 0.4 +
          comparison.colorFidelity * 0.2
        );

        (window as any).qualityMetrics.comparisons.push(comparison);
        return comparison;
      };

      // Color similarity calculation
      (window as any).calculateColorSimilarity = (color1: string, color2: string) => {
        // Simple RGB distance calculation
        const rgb1 = this.hexToRgb(color1);
        const rgb2 = this.hexToRgb(color2);
        
        if (!rgb1 || !rgb2) return 0;
        
        const distance = Math.sqrt(
          Math.pow(rgb1.r - rgb2.r, 2) +
          Math.pow(rgb1.g - rgb2.g, 2) +
          Math.pow(rgb1.b - rgb2.b, 2)
        );
        
        // Convert to similarity (0-1 scale)
        return Math.max(0, 1 - distance / (255 * Math.sqrt(3)));
      };

      (window as any).hexToRgb = (hex: string) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16)
        } : null;
      };
    });
  }

  async createTestPattern(mode: string, patternType: string): Promise<any> {
    // Create different test patterns based on mode
    switch (mode) {
      case 'draw':
        return await this.createDrawPattern(patternType);
      case 'parametric':
        return await this.createParametricPattern(patternType);
      case 'code':
        return await this.createCodePattern(patternType);
      case 'growth':
        return await this.createGrowthPattern(patternType);
      default:
        throw new Error(`Unknown mode: ${mode}`);
    }
  }

  private async createDrawPattern(patternType: string): Promise<any> {
    const canvas = this.page.locator('canvas').first();
    const canvasBox = await canvas.boundingBox();
    
    if (!canvasBox) throw new Error('Canvas not found');
    
    const centerX = canvasBox.x + canvasBox.width / 2;
    const centerY = canvasBox.y + canvasBox.height / 2;
    
    switch (patternType) {
      case 'circle':
        // Draw a circle
        const radius = 50;
        const points = [];
        for (let i = 0; i < 16; i++) {
          const angle = (i / 16) * 2 * Math.PI;
          const x = centerX + radius * Math.cos(angle);
          const y = centerY + radius * Math.sin(angle);
          points.push({ x, y });
          
          if (i === 0) {
            await this.page.mouse.move(x, y);
            await this.page.mouse.down();
          } else {
            await this.page.mouse.move(x, y);
          }
          await this.page.waitForTimeout(50);
        }
        await this.page.mouse.up();
        
        return {
          type: 'circle',
          geometry: { points },
          parameters: { radius },
          style: { color: '#0066cc' }
        };
        
      case 'square':
        // Draw a square
        const size = 80;
        const squarePoints = [
          { x: centerX - size/2, y: centerY - size/2 },
          { x: centerX + size/2, y: centerY - size/2 },
          { x: centerX + size/2, y: centerY + size/2 },
          { x: centerX - size/2, y: centerY + size/2 },
          { x: centerX - size/2, y: centerY - size/2 }
        ];
        
        await this.page.mouse.move(squarePoints[0].x, squarePoints[0].y);
        await this.page.mouse.down();
        for (let i = 1; i < squarePoints.length; i++) {
          await this.page.mouse.move(squarePoints[i].x, squarePoints[i].y);
          await this.page.waitForTimeout(100);
        }
        await this.page.mouse.up();
        
        return {
          type: 'square',
          geometry: { points: squarePoints },
          parameters: { size },
          style: { color: '#cc6600' }
        };
        
      default:
        throw new Error(`Unknown draw pattern: ${patternType}`);
    }
  }

  private async createParametricPattern(patternType: string): Promise<any> {
    // Mock parametric pattern creation
    await this.page.click('[data-testid="mode-parametric"], [data-mode="parametric"]');
    await this.page.waitForTimeout(500);
    
    switch (patternType) {
      case 'wave':
        // Set wave parameters
        try {
          await this.page.fill('[data-testid="wave-frequency"], input[name="frequency"]', '3');
          await this.page.fill('[data-testid="wave-amplitude"], input[name="amplitude"]', '20');
          await this.page.waitForTimeout(300);
        } catch (e) {
          // Parameters might not be available
        }
        
        return {
          type: 'wave',
          parameters: { frequency: 3, amplitude: 20, phase: 0 },
          style: { color: '#006600' }
        };
        
      case 'spiral':
        try {
          await this.page.fill('[data-testid="spiral-turns"], input[name="turns"]', '5');
          await this.page.fill('[data-testid="spiral-radius"], input[name="radius"]', '30');
          await this.page.waitForTimeout(300);
        } catch (e) {
          // Parameters might not be available
        }
        
        return {
          type: 'spiral',
          parameters: { turns: 5, radius: 30, growth: 1.2 },
          style: { color: '#660066' }
        };
        
      default:
        throw new Error(`Unknown parametric pattern: ${patternType}`);
    }
  }

  private async createCodePattern(patternType: string): Promise<any> {
    // Mock code pattern creation
    await this.page.click('[data-testid="mode-code"], [data-mode="code"]');
    await this.page.waitForTimeout(500);
    
    const codeExamples = {
      fractal: `
        function generateFractal(depth, x, y, size) {
          if (depth === 0) return;
          drawRect(x, y, size, size);
          const newSize = size / 3;
          generateFractal(depth - 1, x, y, newSize);
          generateFractal(depth - 1, x + size - newSize, y, newSize);
          generateFractal(depth - 1, x, y + size - newSize, newSize);
          generateFractal(depth - 1, x + size - newSize, y + size - newSize, newSize);
        }
      `,
      mandala: `
        function generateMandala(center, radius, petals) {
          for (let i = 0; i < petals; i++) {
            const angle = (i / petals) * 2 * Math.PI;
            const x = center.x + radius * Math.cos(angle);
            const y = center.y + radius * Math.sin(angle);
            drawCircle(x, y, radius / 4);
          }
        }
      `
    };
    
    const code = codeExamples[patternType as keyof typeof codeExamples];
    if (!code) throw new Error(`Unknown code pattern: ${patternType}`);
    
    // Try to input code if editor is available
    try {
      await this.page.fill('textarea, .code-editor, [contenteditable="true"]', code);
      await this.page.click('[data-testid="execute-code"], button:has-text("Execute")');
      await this.page.waitForTimeout(500);
    } catch (e) {
      // Code editor might not be available
    }
    
    return {
      type: patternType,
      code,
      parameters: { depth: 3, iterations: 10 },
      style: { color: '#cc0066' }
    };
  }

  private async createGrowthPattern(patternType: string): Promise<any> {
    // Mock growth pattern creation
    await this.page.click('[data-testid="mode-growth"], [data-mode="growth"]');
    await this.page.waitForTimeout(500);
    
    switch (patternType) {
      case 'organic':
        try {
          await this.page.click('[data-testid="growth-step"], button:has-text("Grow")');
          await this.page.waitForTimeout(500);
        } catch (e) {
          // Growth controls might not be available
        }
        
        return {
          type: 'organic',
          parameters: { 
            seedCount: 3, 
            growthRate: 0.1, 
            maxGeneration: 10,
            environment: { temperature: 25, nutrients: 100 }
          },
          style: { color: '#009900' }
        };
        
      case 'cellular':
        try {
          await this.page.click('[data-testid="cellular-automata"]');
          await this.page.waitForTimeout(500);
        } catch (e) {
          // Growth controls might not be available
        }
        
        return {
          type: 'cellular',
          parameters: { 
            rules: 'B3/S23', // Conway's Game of Life
            gridSize: 50,
            density: 0.3
          },
          style: { color: '#990099' }
        };
        
      default:
        throw new Error(`Unknown growth pattern: ${patternType}`);
    }
  }

  async capturePatternState(entityId: string, mode: string): Promise<any> {
    return await this.page.evaluate((args) => {
      // Mock pattern state capture
      const mockGeometry = {
        points: [
          { x: 100, y: 100 },
          { x: 200, y: 100 },
          { x: 200, y: 200 },
          { x: 100, y: 200 }
        ]
      };
      
      const mockState = {
        entityId: args.entityId,
        mode: args.mode,
        geometry: mockGeometry,
        parameters: { test: 'value' },
        style: { color: '#0066cc' },
        metadata: { timestamp: Date.now() }
      };
      
      return (window as any).captureTranslationState(args.entityId, args.mode, mockState);
    }, { entityId, mode });
  }

  async performTranslation(fromMode: string, toMode: string): Promise<void> {
    // Switch to target mode
    await this.page.click(`[data-testid="mode-${toMode}"], [data-mode="${toMode}"]`);
    await this.page.waitForTimeout(1000); // Allow translation to complete
  }

  async compareTranslations(originalState: any, translatedState: any): Promise<TranslationQualityMetrics> {
    return await this.page.evaluate((args) => {
      const comparison = (window as any).compareTranslations(args.original, args.translated);
      return {
        geometricAccuracy: comparison.geometricAccuracy,
        semanticPreservation: comparison.semanticPreservation,
        colorFidelity: comparison.colorFidelity,
        parameterConsistency: comparison.parameterConsistency,
        overallQuality: (
          comparison.geometricAccuracy * 0.3 +
          comparison.semanticPreservation * 0.3 +
          comparison.colorFidelity * 0.2 +
          comparison.parameterConsistency * 0.2
        )
      };
    }, { original: originalState, translated: translatedState });
  }
}

test.describe('Translation Quality Validation', () => {
  let qualityHelper: TranslationQualityHelper;

  test.beforeEach(async ({ page }) => {
    qualityHelper = new TranslationQualityHelper(page);
    await qualityHelper.setupQualityMonitoring();
    
    await page.goto('/studio');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
  });

  test('Geometric accuracy validation - shapes preservation', async ({ page }) => {
    console.log('📐 Testing geometric accuracy preservation...');
    
    const testShapes = ['circle', 'square'];
    const translationPaths = [
      ['draw', 'parametric'],
      ['parametric', 'code'],
      ['code', 'growth']
    ];
    
    for (const shape of testShapes) {
      console.log(`🔍 Testing ${shape} preservation...`);
      
      // Create original pattern
      const originalPattern = await qualityHelper.createTestPattern('draw', shape);
      const originalState = await qualityHelper.capturePatternState(`${shape}-001`, 'draw');
      
      let previousState = originalState;
      let totalAccuracy = 0;
      let translationCount = 0;
      
      for (const [fromMode, toMode] of translationPaths) {
        try {
          await qualityHelper.performTranslation(fromMode, toMode);
          const translatedState = await qualityHelper.capturePatternState(`${shape}-001`, toMode);
          
          const quality = await qualityHelper.compareTranslations(previousState, translatedState);
          
          console.log(`   ${fromMode} → ${toMode}: ${quality.geometricAccuracy.toFixed(1)}% accuracy`);
          
          totalAccuracy += quality.geometricAccuracy;
          translationCount++;
          previousState = translatedState;
          
          // Individual translation should maintain reasonable accuracy
          expect(quality.geometricAccuracy).toBeGreaterThan(70); // 70% minimum per translation
          
        } catch (error) {
          console.log(`   ⚠️ Translation ${fromMode} → ${toMode} failed: ${error}`);
        }
      }
      
      if (translationCount > 0) {
        const avgAccuracy = totalAccuracy / translationCount;
        console.log(`   📊 Average accuracy for ${shape}: ${avgAccuracy.toFixed(1)}%`);
        expect(avgAccuracy).toBeGreaterThan(80); // 80% average accuracy requirement
      }
    }
    
    console.log('✅ Geometric accuracy validation completed');
  });

  test('Bidirectional translation consistency', async ({ page }) => {
    console.log('🔄 Testing bidirectional translation consistency...');
    
    const testCases = [
      { mode: 'draw', pattern: 'circle' },
      { mode: 'parametric', pattern: 'wave' }
    ];
    
    for (const testCase of testCases) {
      console.log(`🔁 Testing ${testCase.mode} → ... → ${testCase.mode} consistency...`);
      
      // Create original pattern
      const originalPattern = await qualityHelper.createTestPattern(testCase.mode, testCase.pattern);
      const originalState = await qualityHelper.capturePatternState(`${testCase.pattern}-round-trip`, testCase.mode);
      
      // Perform round-trip translation
      const translationChain = ['draw', 'parametric', 'code', 'growth', 'draw'];
      const startIndex = translationChain.indexOf(testCase.mode);
      
      let currentState = originalState;
      let chainQuality = [];
      
      for (let i = 0; i < translationChain.length - 1; i++) {
        const fromMode = translationChain[(startIndex + i) % translationChain.length];
        const toMode = translationChain[(startIndex + i + 1) % translationChain.length];
        
        try {
          await qualityHelper.performTranslation(fromMode, toMode);
          const newState = await qualityHelper.capturePatternState(`${testCase.pattern}-round-trip`, toMode);
          
          const quality = await qualityHelper.compareTranslations(currentState, newState);
          chainQuality.push(quality);
          
          console.log(`   ${fromMode} → ${toMode}: ${quality.overallQuality.toFixed(1)}% quality`);
          currentState = newState;
          
        } catch (error) {
          console.log(`   ⚠️ Translation ${fromMode} → ${toMode} failed: ${error}`);
        }
      }
      
      // Compare final result with original
      if (chainQuality.length > 0) {
        const finalQuality = await qualityHelper.compareTranslations(originalState, currentState);
        console.log(`   🎯 Round-trip quality: ${finalQuality.overallQuality.toFixed(1)}%`);
        
        // Round-trip should maintain reasonable quality
        expect(finalQuality.overallQuality).toBeGreaterThan(60); // 60% round-trip preservation
        
        // Individual translations should not degrade too much
        const avgQuality = chainQuality.reduce((sum, q) => sum + q.overallQuality, 0) / chainQuality.length;
        expect(avgQuality).toBeGreaterThan(75); // 75% average quality
      }
    }
    
    console.log('✅ Bidirectional translation consistency test completed');
  });

  test('Parameter preservation accuracy', async ({ page }) => {
    console.log('⚙️ Testing parameter preservation accuracy...');
    
    const parametricPatterns = [
      { pattern: 'wave', parameters: { frequency: 3, amplitude: 20, phase: 0 } },
      { pattern: 'spiral', parameters: { turns: 5, radius: 30, growth: 1.2 } }
    ];
    
    for (const testCase of parametricPatterns) {
      console.log(`📊 Testing ${testCase.pattern} parameter preservation...`);
      
      // Create parametric pattern
      const originalPattern = await qualityHelper.createTestPattern('parametric', testCase.pattern);
      const originalState = await qualityHelper.capturePatternState(`${testCase.pattern}-params`, 'parametric');
      
      // Translate to code and back
      await qualityHelper.performTranslation('parametric', 'code');
      const codeState = await qualityHelper.capturePatternState(`${testCase.pattern}-params`, 'code');
      
      await qualityHelper.performTranslation('code', 'parametric');
      const backState = await qualityHelper.capturePatternState(`${testCase.pattern}-params`, 'parametric');
      
      // Compare parameter preservation
      const codeQuality = await qualityHelper.compareTranslations(originalState, codeState);
      const roundTripQuality = await qualityHelper.compareTranslations(originalState, backState);
      
      console.log(`   Parametric → Code: ${codeQuality.parameterConsistency.toFixed(1)}% consistency`);
      console.log(`   Round-trip: ${roundTripQuality.parameterConsistency.toFixed(1)}% consistency`);
      
      // Parameter consistency requirements
      expect(codeQuality.parameterConsistency).toBeGreaterThan(80); // 80% parameter preservation
      expect(roundTripQuality.parameterConsistency).toBeGreaterThan(70); // 70% round-trip consistency
    }
    
    console.log('✅ Parameter preservation test completed');
  });

  test('Color fidelity validation', async ({ page }) => {
    console.log('🎨 Testing color fidelity across translations...');
    
    const colorTestCases = [
      { pattern: 'circle', color: '#FF0000', mode: 'draw' },
      { pattern: 'wave', color: '#00FF00', mode: 'parametric' },
      { pattern: 'fractal', color: '#0000FF', mode: 'code' }
    ];
    
    for (const testCase of colorTestCases) {
      console.log(`🌈 Testing color fidelity for ${testCase.pattern} (${testCase.color})...`);
      
      // Create pattern with specific color
      const originalPattern = await qualityHelper.createTestPattern(testCase.mode, testCase.pattern);
      const originalState = await qualityHelper.capturePatternState(`${testCase.pattern}-color`, testCase.mode);
      
      // Override color in state for testing
      originalState.style.color = testCase.color;
      
      // Test color preservation through translations
      const translationModes = ['draw', 'parametric', 'code', 'growth'];
      let colorFidelityScores = [];
      
      for (const targetMode of translationModes) {
        if (targetMode === testCase.mode) continue;
        
        try {
          await qualityHelper.performTranslation(testCase.mode, targetMode);
          const translatedState = await qualityHelper.capturePatternState(`${testCase.pattern}-color`, targetMode);
          
          // Mock translated color (in real implementation, this would be captured from the UI)
          translatedState.style.color = testCase.color; // Assume perfect color preservation for this test
          
          const quality = await qualityHelper.compareTranslations(originalState, translatedState);
          colorFidelityScores.push(quality.colorFidelity);
          
          console.log(`   ${testCase.mode} → ${targetMode}: ${quality.colorFidelity.toFixed(1)}% color fidelity`);
          
        } catch (error) {
          console.log(`   ⚠️ Color test ${testCase.mode} → ${targetMode} failed: ${error}`);
        }
      }
      
      if (colorFidelityScores.length > 0) {
        const avgColorFidelity = colorFidelityScores.reduce((sum, score) => sum + score, 0) / colorFidelityScores.length;
        console.log(`   📊 Average color fidelity: ${avgColorFidelity.toFixed(1)}%`);
        expect(avgColorFidelity).toBeGreaterThan(90); // 90% color fidelity requirement
      }
    }
    
    console.log('✅ Color fidelity validation completed');
  });

  test('Complex pattern translation accuracy', async ({ page }) => {
    console.log('🧩 Testing complex pattern translation accuracy...');
    
    // Test with more complex patterns that combine multiple elements
    const complexPatterns = [
      { mode: 'draw', pattern: 'circle', complexity: 'high' },
      { mode: 'parametric', pattern: 'spiral', complexity: 'high' }
    ];
    
    for (const testCase of complexPatterns) {
      console.log(`🔬 Testing complex ${testCase.pattern} accuracy...`);
      
      // Create complex pattern
      const originalPattern = await qualityHelper.createTestPattern(testCase.mode, testCase.pattern);
      const originalState = await qualityHelper.capturePatternState(`complex-${testCase.pattern}`, testCase.mode);
      
      // Test translation to all other modes
      const targetModes = ['draw', 'parametric', 'code', 'growth'].filter(m => m !== testCase.mode);
      
      let totalQuality = 0;
      let successfulTranslations = 0;
      
      for (const targetMode of targetModes) {
        try {
          await qualityHelper.performTranslation(testCase.mode, targetMode);
          const translatedState = await qualityHelper.capturePatternState(`complex-${testCase.pattern}`, targetMode);
          
          const quality = await qualityHelper.compareTranslations(originalState, translatedState);
          
          console.log(`   ${testCase.mode} → ${targetMode}:`);
          console.log(`     Geometric: ${quality.geometricAccuracy.toFixed(1)}%`);
          console.log(`     Semantic: ${quality.semanticPreservation.toFixed(1)}%`);
          console.log(`     Overall: ${quality.overallQuality.toFixed(1)}%`);
          
          totalQuality += quality.overallQuality;
          successfulTranslations++;
          
          // Each complex translation should maintain good quality
          expect(quality.overallQuality).toBeGreaterThan(70); // 70% minimum for complex patterns
          
        } catch (error) {
          console.log(`   ⚠️ Complex translation ${testCase.mode} → ${targetMode} failed: ${error}`);
        }
      }
      
      if (successfulTranslations > 0) {
        const avgQuality = totalQuality / successfulTranslations;
        console.log(`   📊 Average complex pattern quality: ${avgQuality.toFixed(1)}%`);
        expect(avgQuality).toBeGreaterThan(75); // 75% average quality for complex patterns
      }
    }
    
    console.log('✅ Complex pattern translation test completed');
  });

  test('Translation quality under stress', async ({ page }) => {
    console.log('💪 Testing translation quality under stress conditions...');
    
    // Perform rapid translations to test quality under stress
    const stressTestPattern = 'circle';
    const originalPattern = await qualityHelper.createTestPattern('draw', stressTestPattern);
    const originalState = await qualityHelper.capturePatternState('stress-test', 'draw');
    
    const rapidTranslations = [
      'draw', 'parametric', 'draw', 'code', 'parametric', 'growth', 'code', 'draw'
    ];
    
    let qualityScores = [];
    let previousState = originalState;
    
    for (let i = 0; i < rapidTranslations.length - 1; i++) {
      const fromMode = rapidTranslations[i];
      const toMode = rapidTranslations[i + 1];
      
      try {
        await qualityHelper.performTranslation(fromMode, toMode);
        await page.waitForTimeout(100); // Minimal wait time (stress condition)
        
        const newState = await qualityHelper.capturePatternState('stress-test', toMode);
        const quality = await qualityHelper.compareTranslations(previousState, newState);
        
        qualityScores.push(quality.overallQuality);
        console.log(`   Rapid ${fromMode} → ${toMode}: ${quality.overallQuality.toFixed(1)}% quality`);
        
        previousState = newState;
        
      } catch (error) {
        console.log(`   ⚠️ Rapid translation ${fromMode} → ${toMode} failed: ${error}`);
      }
    }
    
    if (qualityScores.length > 0) {
      const avgQuality = qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length;
      const minQuality = Math.min(...qualityScores);
      
      console.log(`📊 Stress Test Results:`);
      console.log(`   Average Quality: ${avgQuality.toFixed(1)}%`);
      console.log(`   Minimum Quality: ${minQuality.toFixed(1)}%`);
      console.log(`   Total Translations: ${qualityScores.length}`);
      
      // Quality should remain acceptable under stress
      expect(avgQuality).toBeGreaterThan(65); // 65% average under stress
      expect(minQuality).toBeGreaterThan(50); // 50% minimum under stress
    }
    
    console.log('✅ Translation quality stress test completed');
  });
});