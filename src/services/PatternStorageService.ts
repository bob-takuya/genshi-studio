/**
 * Pattern Storage Service for Genshi Studio
 * Handles saving, loading, and sharing custom patterns
 */

import { CustomPattern, PatternVariation, PatternCombination } from '../types/graphics';

export class PatternStorageService {
  private static readonly STORAGE_KEY = 'genshi-studio-patterns';
  private static readonly VARIATIONS_KEY = 'genshi-studio-variations';
  private static readonly COMBINATIONS_KEY = 'genshi-studio-combinations';
  private static readonly SHARED_PATTERNS_KEY = 'genshi-studio-shared-patterns';

  /**
   * Save a custom pattern to localStorage
   */
  static savePattern(pattern: CustomPattern): void {
    const patterns = this.getAllPatterns();
    const existingIndex = patterns.findIndex(p => p.id === pattern.id);
    
    if (existingIndex >= 0) {
      patterns[existingIndex] = { ...pattern, modifiedAt: new Date() };
    } else {
      patterns.push(pattern);
    }
    
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(patterns));
  }

  /**
   * Load a pattern by ID
   */
  static loadPattern(id: string): CustomPattern | null {
    const patterns = this.getAllPatterns();
    return patterns.find(p => p.id === id) || null;
  }

  /**
   * Get all saved patterns
   */
  static getAllPatterns(): CustomPattern[] {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (!stored) return [];
    
    try {
      const patterns = JSON.parse(stored);
      return patterns.map((p: any) => ({
        ...p,
        createdAt: new Date(p.createdAt),
        modifiedAt: new Date(p.modifiedAt)
      }));
    } catch (error) {
      console.error('Failed to parse saved patterns:', error);
      return [];
    }
  }

  /**
   * Delete a pattern
   */
  static deletePattern(id: string): void {
    const patterns = this.getAllPatterns();
    const filtered = patterns.filter(p => p.id !== id);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered));
  }

  /**
   * Save a pattern variation
   */
  static saveVariation(variation: PatternVariation): void {
    const variations = this.getAllVariations();
    const existingIndex = variations.findIndex(v => v.id === variation.id);
    
    if (existingIndex >= 0) {
      variations[existingIndex] = { ...variation, modifiedAt: new Date() };
    } else {
      variations.push(variation);
    }
    
    localStorage.setItem(this.VARIATIONS_KEY, JSON.stringify(variations));
  }

  /**
   * Get all pattern variations
   */
  static getAllVariations(): PatternVariation[] {
    const stored = localStorage.getItem(this.VARIATIONS_KEY);
    if (!stored) return [];
    
    try {
      const variations = JSON.parse(stored);
      return variations.map((v: any) => ({
        ...v,
        createdAt: new Date(v.createdAt),
        modifiedAt: new Date(v.modifiedAt)
      }));
    } catch (error) {
      console.error('Failed to parse saved variations:', error);
      return [];
    }
  }

  /**
   * Get variations for a specific base pattern
   */
  static getVariationsForPattern(basePattern: string): PatternVariation[] {
    return this.getAllVariations().filter(v => v.basePattern === basePattern);
  }

  /**
   * Save a pattern combination
   */
  static saveCombination(combination: PatternCombination): void {
    const combinations = this.getAllCombinations();
    const existingIndex = combinations.findIndex(c => c.id === combination.id);
    
    if (existingIndex >= 0) {
      combinations[existingIndex] = combination;
    } else {
      combinations.push(combination);
    }
    
    localStorage.setItem(this.COMBINATIONS_KEY, JSON.stringify(combinations));
  }

  /**
   * Get all pattern combinations
   */
  static getAllCombinations(): PatternCombination[] {
    const stored = localStorage.getItem(this.COMBINATIONS_KEY);
    if (!stored) return [];
    
    try {
      return JSON.parse(stored);
    } catch (error) {
      console.error('Failed to parse saved combinations:', error);
      return [];
    }
  }

  /**
   * Generate a shareable URL for a pattern
   */
  static generateShareableUrl(pattern: CustomPattern): string {
    const shareId = this.generateShareId();
    const patternWithShare = { ...pattern, shareId };
    
    // Save to shared patterns
    this.saveSharedPattern(patternWithShare);
    
    // Generate URL with share ID
    const baseUrl = window.location.origin + window.location.pathname;
    return `${baseUrl}?share=${shareId}`;
  }

  /**
   * Load a pattern from a share ID
   */
  static loadPatternFromShare(shareId: string): CustomPattern | null {
    const sharedPatterns = this.getSharedPatterns();
    return sharedPatterns.find(p => p.shareId === shareId) || null;
  }

  /**
   * Export patterns as JSON
   */
  static exportPatterns(): string {
    const data = {
      patterns: this.getAllPatterns(),
      variations: this.getAllVariations(),
      combinations: this.getAllCombinations(),
      exportDate: new Date().toISOString(),
      version: '1.0'
    };
    
    return JSON.stringify(data, null, 2);
  }

  /**
   * Import patterns from JSON
   */
  static importPatterns(jsonData: string): { 
    success: boolean; 
    imported: number; 
    errors: string[] 
  } {
    try {
      const data = JSON.parse(jsonData);
      const errors: string[] = [];
      let imported = 0;
      
      // Import patterns
      if (data.patterns && Array.isArray(data.patterns)) {
        data.patterns.forEach((pattern: any) => {
          try {
            // Validate pattern structure
            if (this.validatePatternStructure(pattern)) {
              this.savePattern(pattern);
              imported++;
            } else {
              errors.push(`Invalid pattern structure: ${pattern.name || 'Unknown'}`);
            }
          } catch (error) {
            errors.push(`Error importing pattern: ${error}`);
          }
        });
      }
      
      // Import variations
      if (data.variations && Array.isArray(data.variations)) {
        data.variations.forEach((variation: any) => {
          try {
            this.saveVariation(variation);
            imported++;
          } catch (error) {
            errors.push(`Error importing variation: ${error}`);
          }
        });
      }
      
      // Import combinations
      if (data.combinations && Array.isArray(data.combinations)) {
        data.combinations.forEach((combination: any) => {
          try {
            this.saveCombination(combination);
            imported++;
          } catch (error) {
            errors.push(`Error importing combination: ${error}`);
          }
        });
      }
      
      return { success: true, imported, errors };
    } catch (error) {
      return { 
        success: false, 
        imported: 0, 
        errors: [`Failed to parse JSON: ${error}`] 
      };
    }
  }

  /**
   * Clear all saved patterns
   */
  static clearAllPatterns(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem(this.VARIATIONS_KEY);
    localStorage.removeItem(this.COMBINATIONS_KEY);
  }

  /**
   * Get storage usage statistics
   */
  static getStorageStats(): {
    patterns: number;
    variations: number;
    combinations: number;
    totalSize: number;
    maxSize: number;
    percentUsed: number;
  } {
    const patterns = this.getAllPatterns();
    const variations = this.getAllVariations();
    const combinations = this.getAllCombinations();
    
    // Calculate storage size
    const totalSize = this.calculateStorageSize();
    const maxSize = 5 * 1024 * 1024; // 5MB typical localStorage limit
    
    return {
      patterns: patterns.length,
      variations: variations.length,
      combinations: combinations.length,
      totalSize,
      maxSize,
      percentUsed: (totalSize / maxSize) * 100
    };
  }

  /**
   * Search patterns by name, description, or tags
   */
  static searchPatterns(query: string): CustomPattern[] {
    const patterns = this.getAllPatterns();
    const lowerQuery = query.toLowerCase();
    
    return patterns.filter(pattern => 
      pattern.name.toLowerCase().includes(lowerQuery) ||
      pattern.description.toLowerCase().includes(lowerQuery) ||
      pattern.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }

  /**
   * Get patterns by tags
   */
  static getPatternsByTags(tags: string[]): CustomPattern[] {
    const patterns = this.getAllPatterns();
    return patterns.filter(pattern => 
      tags.some(tag => pattern.tags.includes(tag))
    );
  }

  /**
   * Get most recently used patterns
   */
  static getRecentPatterns(limit: number = 10): CustomPattern[] {
    const patterns = this.getAllPatterns();
    return patterns
      .sort((a, b) => b.modifiedAt.getTime() - a.modifiedAt.getTime())
      .slice(0, limit);
  }

  // Private helper methods

  private static saveSharedPattern(pattern: CustomPattern): void {
    const sharedPatterns = this.getSharedPatterns();
    const existingIndex = sharedPatterns.findIndex(p => p.id === pattern.id);
    
    if (existingIndex >= 0) {
      sharedPatterns[existingIndex] = pattern;
    } else {
      sharedPatterns.push(pattern);
    }
    
    localStorage.setItem(this.SHARED_PATTERNS_KEY, JSON.stringify(sharedPatterns));
  }

  private static getSharedPatterns(): CustomPattern[] {
    const stored = localStorage.getItem(this.SHARED_PATTERNS_KEY);
    if (!stored) return [];
    
    try {
      return JSON.parse(stored);
    } catch (error) {
      console.error('Failed to parse shared patterns:', error);
      return [];
    }
  }

  private static generateShareId(): string {
    return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }

  private static validatePatternStructure(pattern: any): boolean {
    return (
      typeof pattern.id === 'string' &&
      typeof pattern.name === 'string' &&
      typeof pattern.basePattern === 'string' &&
      Array.isArray(pattern.parameters) &&
      Array.isArray(pattern.tags)
    );
  }

  private static calculateStorageSize(): number {
    let total = 0;
    for (const key in localStorage) {
      if (key.startsWith('genshi-studio-')) {
        total += localStorage.getItem(key)?.length || 0;
      }
    }
    return total;
  }
}