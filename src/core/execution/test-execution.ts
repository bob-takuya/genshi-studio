/**
 * Test script for code execution pipeline
 */

import { CodeExecutionEngine } from './CodeExecutionEngine';

async function testCodeExecution() {
  console.log('Testing Code Execution Engine...\n');

  const engine = new CodeExecutionEngine();

  // Test 1: Simple TypeScript code
  console.log('Test 1: Simple TypeScript code');
  const simpleCode = `
    console.log('Hello from Genshi Studio!');
    const x: number = 10;
    const y: number = 20;
    console.log('Sum:', x + y);
  `;

  const result1 = await engine.execute(simpleCode);
  console.log('Result:', result1);
  console.log('---\n');

  // Test 2: Drawing shapes
  console.log('Test 2: Drawing shapes');
  const drawingCode = `
    canvas.background('#f0f0f0');
    
    draw.fill('#3b82f6');
    draw.strokeWidth(2);
    draw.stroke('#1e40af');
    
    shapes.rect(100, 100, 200, 150);
    shapes.circle(300, 300, 50);
    
    console.log('Shapes drawn successfully!');
  `;

  const result2 = await engine.execute(drawingCode);
  console.log('Result:', result2);
  console.log('---\n');

  // Test 3: Error handling
  console.log('Test 3: Error handling');
  const errorCode = `
    // This should cause an error
    const badCode = ;
  `;

  const result3 = await engine.execute(errorCode);
  console.log('Result:', result3);
  console.log('---\n');

  // Test 4: Complex pattern
  console.log('Test 4: Complex pattern');
  const patternCode = `
    canvas.background('#ffffff');
    
    // Create a grid pattern
    const gridSize = 20;
    const rows = Math.floor(canvas.height / gridSize);
    const cols = Math.floor(canvas.width / gridSize);
    
    draw.noFill();
    draw.stroke('#e5e7eb');
    draw.strokeWidth(1);
    
    for (let i = 0; i <= rows; i++) {
      shapes.line(0, i * gridSize, canvas.width, i * gridSize);
    }
    
    for (let j = 0; j <= cols; j++) {
      shapes.line(j * gridSize, 0, j * gridSize, canvas.height);
    }
    
    // Add some colored circles
    draw.fill('#ef4444');
    draw.noStroke();
    
    for (let i = 0; i < 5; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const radius = 20 + Math.random() * 30;
      shapes.circle(x, y, radius);
    }
    
    console.log('Pattern created!');
  `;

  const result4 = await engine.execute(patternCode);
  console.log('Result:', result4);
  
  // Cleanup
  engine.destroy();
  console.log('\nTests completed!');
}

// Run tests if this file is executed directly
if (require.main === module) {
  testCodeExecution().catch(console.error);
}

export { testCodeExecution };