// Wrapped engine for debugging
console.log('Engine wrapper starting...');

try {
    // Try loading the engine content
    const scriptTag = document.createElement('script');
    scriptTag.textContent = `
        try {
            console.log('Inside engine try block');
            
            // Test if we can access dependencies
            console.log('Testing dependencies access:');
            console.log('- CollisionDetectionSystem:', typeof CollisionDetectionSystem);
            console.log('- GoldenRatioComposition:', typeof GoldenRatioComposition);
            
            // Create a test class
            class TestEngine {
                constructor() {
                    console.log('TestEngine created');
                }
            }
            
            window.TestEngine = TestEngine;
            console.log('TestEngine exported');
            
        } catch (innerError) {
            console.error('Inner error:', innerError);
            console.error('Stack:', innerError.stack);
        }
    `;
    document.head.appendChild(scriptTag);
    
} catch (error) {
    console.error('Outer error:', error);
    console.error('Stack:', error.stack);
}

console.log('Engine wrapper complete');