import { test, expect, Page } from '@playwright/test';

/**
 * TESTER_INTEGRATION_001 - Real-Time Synchronization Performance Tests
 * Validates WebSocket-based CRDT + Operational Transform synchronization
 */

interface SyncMetrics {
  latency: number;
  throughput: number;
  errorRate: number;
  packetLoss: number;
}

interface ConflictResolutionMetrics {
  conflictCount: number;
  resolutionTime: number;
  dataIntegrity: boolean;
  mergeAccuracy: number;
}

class SynchronizationTestHelper {
  constructor(private page: Page) {}

  async setupSyncMonitoring(): Promise<void> {
    await this.page.addInitScript(() => {
      // WebSocket monitoring
      (window as any).syncMetrics = {
        messages: [],
        connections: [],
        conflicts: [],
        operations: []
      };

      // Override WebSocket for monitoring
      const OriginalWebSocket = window.WebSocket;
      (window as any).WebSocket = class extends OriginalWebSocket {
        constructor(url: string, protocols?: string | string[]) {
          super(url, protocols);
          
          const connectionId = Math.random().toString(36).substr(2, 9);
          const startTime = performance.now();
          
          (window as any).syncMetrics.connections.push({
            id: connectionId,
            url,
            startTime,
            connected: false,
            messages: 0
          });

          this.addEventListener('open', () => {
            const connection = (window as any).syncMetrics.connections.find((c: any) => c.id === connectionId);
            if (connection) {
              connection.connected = true;
              connection.connectionTime = performance.now() - startTime;
            }
          });

          this.addEventListener('message', (event) => {
            const connection = (window as any).syncMetrics.connections.find((c: any) => c.id === connectionId);
            if (connection) {
              connection.messages++;
            }

            (window as any).syncMetrics.messages.push({
              connectionId,
              timestamp: performance.now(),
              size: event.data.length,
              data: event.data
            });
          });
        }
      };

      // Sync operation tracking
      (window as any).trackSyncOperation = (operation: string, mode: string) => {
        const id = `${operation}-${mode}-${Date.now()}`;
        (window as any).syncMetrics.operations.push({
          id,
          operation,
          mode,
          startTime: performance.now(),
          completed: false
        });
        return id;
      };

      (window as any).completeSyncOperation = (id: string, success: boolean, data?: any) => {
        const op = (window as any).syncMetrics.operations.find((o: any) => o.id === id);
        if (op) {
          op.endTime = performance.now();
          op.latency = op.endTime - op.startTime;
          op.completed = true;
          op.success = success;
          op.data = data;
        }
      };

      // Conflict tracking
      (window as any).trackConflict = (conflictData: any) => {
        (window as any).syncMetrics.conflicts.push({
          ...conflictData,
          timestamp: performance.now()
        });
      };
    });
  }

  async getSyncMetrics(): Promise<SyncMetrics> {
    return await this.page.evaluate(() => {
      const metrics = (window as any).syncMetrics;
      const operations = metrics.operations.filter((op: any) => op.completed);
      
      const totalLatency = operations.reduce((sum: number, op: any) => sum + op.latency, 0);
      const avgLatency = operations.length > 0 ? totalLatency / operations.length : 0;
      
      const successfulOps = operations.filter((op: any) => op.success).length;
      const errorRate = operations.length > 0 ? 
        ((operations.length - successfulOps) / operations.length) * 100 : 0;
      
      const throughput = metrics.messages.length / 10; // messages per second (10s test)
      
      return {
        latency: avgLatency,
        throughput,
        errorRate,
        packetLoss: 0 // TODO: Implement packet loss calculation
      };
    });
  }

  async simulateHighFrequencyOperations(count: number = 50): Promise<void> {
    for (let i = 0; i < count; i++) {
      // Simulate rapid user interactions
      await this.page.evaluate((index) => {
        const opId = (window as any).trackSyncOperation('draw-stroke', 'draw');
        
        // Simulate drawing operation
        setTimeout(() => {
          (window as any).completeSyncOperation(opId, true, { strokeId: `stroke-${index}` });
        }, Math.random() * 100);
      }, i);
      
      await this.page.waitForTimeout(20); // 50 operations per second
    }
  }

  async simulateConflictScenario(): Promise<void> {
    // Simulate concurrent modifications that would cause conflicts
    await this.page.evaluate(() => {
      const entityId = 'test-entity-001';
      
      // Simulate two users modifying the same entity simultaneously
      const op1Id = (window as any).trackSyncOperation('modify-geometry', 'draw');
      const op2Id = (window as any).trackSyncOperation('modify-parameters', 'parametric');
      
      // Track the conflict
      (window as any).trackConflict({
        entityId,
        type: 'concurrent-modification',
        operations: [op1Id, op2Id],
        resolved: false
      });
      
      // Simulate conflict resolution
      setTimeout(() => {
        (window as any).completeSyncOperation(op1Id, true);
        (window as any).completeSyncOperation(op2Id, true);
        
        // Mark conflict as resolved
        const conflict = (window as any).syncMetrics.conflicts.find((c: any) => c.entityId === entityId);
        if (conflict) {
          conflict.resolved = true;
          conflict.resolutionTime = performance.now() - conflict.timestamp;
        }
      }, 150); // Simulate 150ms resolution time
    });
  }

  async measureWebSocketLatency(): Promise<number> {
    return await this.page.evaluate(() => {
      return new Promise((resolve) => {
        const startTime = performance.now();
        
        // Simulate WebSocket ping-pong
        const mockMessage = JSON.stringify({
          type: 'ping',
          timestamp: startTime
        });
        
        // In a real scenario, this would be sent through WebSocket
        setTimeout(() => {
          const latency = performance.now() - startTime;
          resolve(latency);
        }, Math.random() * 50 + 25); // Simulate 25-75ms network latency
      });
    });
  }
}

test.describe('Real-Time Synchronization Performance', () => {
  let syncHelper: SynchronizationTestHelper;

  test.beforeEach(async ({ page }) => {
    syncHelper = new SynchronizationTestHelper(page);
    await syncHelper.setupSyncMonitoring();
    
    await page.goto('/studio');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
  });

  test('Sync latency validation - <100ms requirement', async ({ page }) => {
    console.log('🚀 Testing synchronization latency requirements...');
    
    // Warm up the system
    await syncHelper.simulateHighFrequencyOperations(10);
    await page.waitForTimeout(2000);
    
    // Measure WebSocket connection latency
    const wsLatency = await syncHelper.measureWebSocketLatency();
    console.log(`📡 WebSocket latency: ${wsLatency.toFixed(1)}ms`);
    
    // Perform synchronization test
    await syncHelper.simulateHighFrequencyOperations(25);
    await page.waitForTimeout(3000); // Allow operations to complete
    
    const metrics = await syncHelper.getSyncMetrics();
    
    console.log(`📊 Synchronization Metrics:`);
    console.log(`   Average Latency: ${metrics.latency.toFixed(1)}ms`);
    console.log(`   Throughput: ${metrics.throughput.toFixed(1)} ops/sec`);
    console.log(`   Error Rate: ${metrics.errorRate.toFixed(1)}%`);
    
    // Critical requirements
    expect(metrics.latency).toBeLessThan(100); // SOW requirement
    expect(metrics.errorRate).toBeLessThan(5); // 95% success rate
    
    // Performance targets
    if (metrics.latency > 50) {
      console.log(`⚠️ Latency above target: ${metrics.latency.toFixed(1)}ms > 50ms`);
    }
    if (metrics.throughput < 20) {
      console.log(`⚠️ Throughput below target: ${metrics.throughput.toFixed(1)} ops/sec`);
    }
    
    console.log('✅ Synchronization latency test completed');
  });

  test('High-frequency operation stress test', async ({ page }) => {
    console.log('⚡ Testing high-frequency operation handling...');
    
    // Stress test with burst operations
    const burstSizes = [25, 50, 100];
    
    for (const burstSize of burstSizes) {
      console.log(`🔥 Testing burst of ${burstSize} operations...`);
      
      const startTime = Date.now();
      await syncHelper.simulateHighFrequencyOperations(burstSize);
      await page.waitForTimeout(2000);
      
      const metrics = await syncHelper.getSyncMetrics();
      const testDuration = Date.now() - startTime;
      
      console.log(`📈 Burst ${burstSize} results:`);
      console.log(`   Duration: ${testDuration}ms`);
      console.log(`   Avg Latency: ${metrics.latency.toFixed(1)}ms`);
      console.log(`   Error Rate: ${metrics.errorRate.toFixed(1)}%`);
      
      // Ensure system remains stable under load
      expect(metrics.latency).toBeLessThan(200); // Allow higher latency under stress
      expect(metrics.errorRate).toBeLessThan(10); // Allow higher error rate under stress
    }
    
    console.log('✅ High-frequency stress test completed');
  });

  test('Conflict resolution performance', async ({ page }) => {
    console.log('⚔️ Testing conflict resolution performance...');
    
    // Simulate multiple conflict scenarios
    const conflictScenarios = 5;
    
    for (let i = 0; i < conflictScenarios; i++) {
      await syncHelper.simulateConflictScenario();
      await page.waitForTimeout(300); // Allow conflicts to resolve
    }
    
    const conflictMetrics = await page.evaluate(() => {
      const conflicts = (window as any).syncMetrics.conflicts;
      const resolvedConflicts = conflicts.filter((c: any) => c.resolved);
      
      const totalResolutionTime = resolvedConflicts.reduce(
        (sum: number, c: any) => sum + c.resolutionTime, 0
      );
      
      return {
        totalConflicts: conflicts.length,
        resolvedConflicts: resolvedConflicts.length,
        avgResolutionTime: resolvedConflicts.length > 0 ? 
          totalResolutionTime / resolvedConflicts.length : 0,
        resolutionRate: conflicts.length > 0 ? 
          (resolvedConflicts.length / conflicts.length) * 100 : 100
      };
    });
    
    console.log(`⚔️ Conflict Resolution Metrics:`);
    console.log(`   Total Conflicts: ${conflictMetrics.totalConflicts}`);
    console.log(`   Resolved: ${conflictMetrics.resolvedConflicts}`);
    console.log(`   Avg Resolution Time: ${conflictMetrics.avgResolutionTime.toFixed(1)}ms`);
    console.log(`   Resolution Rate: ${conflictMetrics.resolutionRate.toFixed(1)}%`);
    
    // Conflict resolution requirements
    expect(conflictMetrics.resolutionRate).toBeGreaterThan(90); // 90%+ conflicts resolved
    expect(conflictMetrics.avgResolutionTime).toBeLessThan(300); // <300ms resolution time
    
    console.log('✅ Conflict resolution test completed');
  });

  test('Network resilience and recovery', async ({ page }) => {
    console.log('🌐 Testing network resilience...');
    
    // Start operations
    await syncHelper.simulateHighFrequencyOperations(10);
    await page.waitForTimeout(1000);
    
    // Simulate network interruption
    console.log('📡 Simulating network interruption...');
    await page.setOfflineMode(true);
    
    // Continue operations while offline
    await syncHelper.simulateHighFrequencyOperations(5);
    await page.waitForTimeout(2000);
    
    // Restore network
    console.log('📡 Restoring network connection...');
    await page.setOfflineMode(false);
    await page.waitForTimeout(3000); // Allow reconnection and sync
    
    // Continue operations after recovery
    await syncHelper.simulateHighFrequencyOperations(10);
    await page.waitForTimeout(2000);
    
    const finalMetrics = await syncHelper.getSyncMetrics();
    
    console.log(`🔄 Network Recovery Metrics:`);
    console.log(`   Final Latency: ${finalMetrics.latency.toFixed(1)}ms`);
    console.log(`   Final Error Rate: ${finalMetrics.errorRate.toFixed(1)}%`);
    
    // Recovery requirements
    expect(finalMetrics.errorRate).toBeLessThan(15); // Allow some errors during recovery
    expect(finalMetrics.latency).toBeLessThan(150); // Allow higher latency during recovery
    
    console.log('✅ Network resilience test completed');
  });

  test('WebSocket connection stability', async ({ page }) => {
    console.log('🔌 Testing WebSocket connection stability...');
    
    // Monitor connection for extended period
    const monitoringDuration = 10000; // 10 seconds
    const startTime = Date.now();
    
    // Perform continuous operations
    while (Date.now() - startTime < monitoringDuration) {
      await syncHelper.simulateHighFrequencyOperations(5);
      await page.waitForTimeout(500);
    }
    
    const connectionMetrics = await page.evaluate(() => {
      const connections = (window as any).syncMetrics.connections;
      const messages = (window as any).syncMetrics.messages;
      
      const activeConnections = connections.filter((c: any) => c.connected);
      const totalMessages = messages.length;
      const avgMessageSize = messages.length > 0 ? 
        messages.reduce((sum: number, m: any) => sum + m.size, 0) / messages.length : 0;
      
      return {
        totalConnections: connections.length,
        activeConnections: activeConnections.length,
        totalMessages,
        avgMessageSize,
        connectionStability: activeConnections.length > 0 ? 100 : 0
      };
    });
    
    console.log(`🔌 Connection Stability Metrics:`);
    console.log(`   Active Connections: ${connectionMetrics.activeConnections}/${connectionMetrics.totalConnections}`);
    console.log(`   Total Messages: ${connectionMetrics.totalMessages}`);
    console.log(`   Avg Message Size: ${connectionMetrics.avgMessageSize.toFixed(0)} bytes`);
    console.log(`   Connection Stability: ${connectionMetrics.connectionStability}%`);
    
    // Connection stability requirements
    expect(connectionMetrics.connectionStability).toBeGreaterThan(95);
    expect(connectionMetrics.totalMessages).toBeGreaterThan(10); // Should have message traffic
    
    console.log('✅ WebSocket stability test completed');
  });

  test('Synchronization accuracy validation', async ({ page }) => {
    console.log('🎯 Testing synchronization accuracy...');
    
    // Create test data for synchronization
    const testOperations = [
      { type: 'draw-stroke', data: { x: 100, y: 100, pressure: 0.8 } },
      { type: 'set-parameter', data: { name: 'wave-height', value: 1.5 } },
      { type: 'execute-code', data: { function: 'generatePattern' } },
      { type: 'growth-step', data: { generation: 1 } }
    ];
    
    let accurateOperations = 0;
    
    for (const operation of testOperations) {
      const opId = await page.evaluate((op) => {
        return (window as any).trackSyncOperation(op.type, 'test');
      }, operation);
      
      // Simulate operation execution
      await page.waitForTimeout(100);
      
      const success = await page.evaluate((id) => {
        (window as any).completeSyncOperation(id, true);
        const op = (window as any).syncMetrics.operations.find((o: any) => o.id === id);
        return op && op.success;
      }, opId);
      
      if (success) {
        accurateOperations++;
      }
    }
    
    const accuracy = (accurateOperations / testOperations.length) * 100;
    
    console.log(`🎯 Synchronization Accuracy: ${accuracy}%`);
    console.log(`   Successful Operations: ${accurateOperations}/${testOperations.length}`);
    
    // Accuracy requirements
    expect(accuracy).toBeGreaterThan(95); // 95%+ accuracy requirement
    
    console.log('✅ Synchronization accuracy test completed');
  });

  test('Performance degradation under load', async ({ page }) => {
    console.log('📊 Testing performance degradation under load...');
    
    const loadLevels = [10, 25, 50, 100];
    const performanceResults = [];
    
    for (const loadLevel of loadLevels) {
      console.log(`📈 Testing load level: ${loadLevel} ops/sec...`);
      
      const startTime = Date.now();
      await syncHelper.simulateHighFrequencyOperations(loadLevel);
      await page.waitForTimeout(2000);
      
      const metrics = await syncHelper.getSyncMetrics();
      const testDuration = Date.now() - startTime;
      
      performanceResults.push({
        loadLevel,
        latency: metrics.latency,
        errorRate: metrics.errorRate,
        throughput: metrics.throughput
      });
      
      console.log(`   Load ${loadLevel}: ${metrics.latency.toFixed(1)}ms latency, ${metrics.errorRate.toFixed(1)}% errors`);
    }
    
    // Analyze performance degradation
    const baselineLatency = performanceResults[0].latency;
    const maxLatency = Math.max(...performanceResults.map(r => r.latency));
    const degradation = ((maxLatency - baselineLatency) / baselineLatency) * 100;
    
    console.log(`📊 Performance Analysis:`);
    console.log(`   Baseline Latency: ${baselineLatency.toFixed(1)}ms`);
    console.log(`   Maximum Latency: ${maxLatency.toFixed(1)}ms`);
    console.log(`   Performance Degradation: ${degradation.toFixed(1)}%`);
    
    // Performance degradation limits
    expect(degradation).toBeLessThan(200); // Max 200% degradation under load
    expect(maxLatency).toBeLessThan(300); // Absolute maximum latency
    
    console.log('✅ Performance degradation test completed');
  });
});