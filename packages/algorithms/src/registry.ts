/**
 * Algorithm Registry System
 * Manages and provides access to various generative art algorithms
 */

export interface AlgorithmMetadata {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  htmlPath: string;
  thumbnail?: string;
  parameters?: Record<string, any>;
}

export interface AlgorithmWrapper {
  metadata: AlgorithmMetadata;
  initialize?: () => Promise<void>;
  render?: (canvas: HTMLCanvasElement, params?: Record<string, any>) => void;
  cleanup?: () => void;
}

export class AlgorithmRegistry {
  private algorithms: Map<string, AlgorithmWrapper> = new Map();
  private categories: Map<string, string[]> = new Map();

  /**
   * Register a new algorithm
   */
  register(algorithm: AlgorithmWrapper): void {
    const { id, category } = algorithm.metadata;
    
    if (this.algorithms.has(id)) {
      console.warn(`Algorithm "${id}" is already registered. Overwriting...`);
    }
    
    this.algorithms.set(id, algorithm);
    
    // Update category mapping
    if (!this.categories.has(category)) {
      this.categories.set(category, []);
    }
    this.categories.get(category)!.push(id);
  }

  /**
   * Get an algorithm by ID
   */
  get(id: string): AlgorithmWrapper | undefined {
    return this.algorithms.get(id);
  }

  /**
   * List all registered algorithms
   */
  list(): AlgorithmMetadata[] {
    return Array.from(this.algorithms.values()).map(alg => alg.metadata);
  }

  /**
   * List algorithms by category
   */
  listByCategory(category: string): AlgorithmMetadata[] {
    const ids = this.categories.get(category) || [];
    return ids
      .map(id => this.algorithms.get(id))
      .filter(alg => alg !== undefined)
      .map(alg => alg!.metadata);
  }

  /**
   * Get all categories
   */
  getCategories(): string[] {
    return Array.from(this.categories.keys());
  }

  /**
   * Search algorithms by tags or name
   */
  search(query: string): AlgorithmMetadata[] {
    const lowercaseQuery = query.toLowerCase();
    
    return this.list().filter(metadata => {
      const nameMatch = metadata.name.toLowerCase().includes(lowercaseQuery);
      const descMatch = metadata.description.toLowerCase().includes(lowercaseQuery);
      const tagMatch = metadata.tags.some(tag => 
        tag.toLowerCase().includes(lowercaseQuery)
      );
      
      return nameMatch || descMatch || tagMatch;
    });
  }

  /**
   * Dynamic loading of algorithm from HTML file
   */
  async loadFromHTML(htmlPath: string, metadata: Omit<AlgorithmMetadata, 'htmlPath'>): Promise<void> {
    const wrapper: AlgorithmWrapper = {
      metadata: {
        ...metadata,
        htmlPath
      },
      initialize: async () => {
        // Create an iframe to load the HTML
        const iframe = document.createElement('iframe');
        iframe.src = htmlPath;
        iframe.style.display = 'none';
        document.body.appendChild(iframe);
        
        // Wait for load
        await new Promise(resolve => {
          iframe.onload = resolve;
        });
      },
      cleanup: () => {
        // Remove iframe if exists
        const iframe = document.querySelector(`iframe[src="${htmlPath}"]`);
        if (iframe) {
          iframe.remove();
        }
      }
    };
    
    this.register(wrapper);
  }

  /**
   * Batch register algorithms
   */
  registerMany(algorithms: AlgorithmWrapper[]): void {
    algorithms.forEach(alg => this.register(alg));
  }

  /**
   * Clear all registered algorithms
   */
  clear(): void {
    this.algorithms.clear();
    this.categories.clear();
  }

  /**
   * Get registry statistics
   */
  getStats(): {
    totalAlgorithms: number;
    categoryCounts: Record<string, number>;
  } {
    const categoryCounts: Record<string, number> = {};
    
    this.categories.forEach((ids, category) => {
      categoryCounts[category] = ids.length;
    });
    
    return {
      totalAlgorithms: this.algorithms.size,
      categoryCounts
    };
  }
}

// Create singleton instance
export const algorithmRegistry = new AlgorithmRegistry();