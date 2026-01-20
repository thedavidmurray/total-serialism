// Minimal engine to test
console.log('Minimal engine starting...');

// Check if dependencies are available
console.log('CollisionDetectionSystem available:', typeof CollisionDetectionSystem);
console.log('GoldenRatioComposition available:', typeof GoldenRatioComposition);

// Define a simple class
class MinimalArtwork {
    constructor() {
        console.log('MinimalArtwork constructor called');
        this.test = true;
    }
}

// Export it
window.MinimalArtwork = MinimalArtwork;
console.log('MinimalArtwork exported to window');

// Also export a simple object
window.TestObject = { loaded: true };
console.log('TestObject exported to window');