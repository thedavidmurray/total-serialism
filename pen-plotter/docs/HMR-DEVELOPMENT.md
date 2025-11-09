# Hot Module Replacement (HMR) Development Mode

The pen plotter art system now includes a powerful HMR development mode that allows you to see changes to your algorithms in real-time without losing state.

## Features

- **Live Algorithm Updates**: Edit algorithm HTML files and see changes instantly
- **State Preservation**: Parameter values and canvas state are preserved during reloads
- **File Watching**: Automatic detection of changes to algorithms and core modules
- **Visual Feedback**: Notifications and status indicators for HMR events
- **Algorithm Discovery**: Automatically finds and indexes all algorithms
- **Smart Reloading**: Only reloads what changed, preserving your work

## Getting Started

1. Install dependencies (if not already done):
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
# or
npm start
```

3. Open your browser to:
```
http://localhost:3000/index-dev.html
```

## How It Works

### File Watching

The HMR server watches for changes to:
- `algorithms/**/*.html` - Algorithm files
- `algorithms/**/*.js` - Algorithm scripts
- `src/**/*.js` - Core modules

### State Preservation

When an algorithm is updated, HMR:
1. Captures current parameter values
2. Saves canvas state (if applicable)
3. Calls custom state capture functions (if defined)
4. Reloads the algorithm code
5. Restores all saved state

### Custom State Management

Algorithms can define custom HMR handlers:

```javascript
// Save custom state before reload
window.captureHMRState = function() {
  return {
    particles: particles,
    generation: generation,
    customData: myCustomData
  };
};

// Restore custom state after reload
window.restoreHMRState = function(state) {
  particles = state.particles;
  generation = state.generation;
  myCustomData = state.customData;
};
```

## Visual Indicators

- **Green dot** (bottom right): HMR connected and active
- **Red dot** (bottom right): HMR disconnected
- **Blue notifications**: Algorithm updates
- **Orange badge**: Dev mode indicator
- **Card highlights**: Updated algorithms flash green

## Development Workflow

1. **Open an algorithm** in your browser
2. **Edit the HTML file** in your code editor
3. **Save the file** - changes appear instantly
4. **Adjust parameters** - they persist through reloads
5. **Continue creating** without interruption

## Server Architecture

```
HMR Server (Port 3000)
├── Express static server
├── Algorithm API endpoints
└── HMR client script

WebSocket Server (Port 3001)
├── File change notifications
├── State synchronization
└── Connection management
```

## Troubleshooting

### HMR Not Connecting
- Check that ports 3000 and 3001 are available
- Ensure WebSocket connections aren't blocked
- Look for errors in browser console

### State Not Preserving
- Verify parameter IDs match between HTML and state capture
- Check that `window.params` is accessible
- Look for errors in custom state handlers

### Algorithm Not Updating
- Ensure file is saved
- Check file watcher output in terminal
- Verify algorithm path is correct

## Advanced Features

### Algorithm Metadata

The HMR server automatically extracts:
- Algorithm title
- Available parameters
- Export capabilities
- Animation features
- Interaction support

### Smart Categorization

Algorithms are automatically categorized based on:
- Directory structure
- Feature detection
- Parameter analysis

### Performance Optimization

- Only changed files trigger updates
- Minimal data transfer via WebSocket
- Efficient state serialization
- Lazy loading of algorithm metadata

## Best Practices

1. **Use meaningful parameter IDs** - They're used for state restoration
2. **Define state handlers** for complex algorithms
3. **Keep algorithms modular** - Smaller files reload faster
4. **Test state preservation** - Ensure nothing is lost on reload
5. **Watch the console** - HMR logs helpful debugging info

## Future Enhancements

- [ ] Time-travel debugging
- [ ] State snapshots
- [ ] Collaborative editing
- [ ] Remote development
- [ ] Performance profiling

## Contributing

To improve HMR functionality:
1. Edit `src/dev/hmr-server.js` for server-side changes
2. Update HMR client code in `getHMRClientCode()` method
3. Test with various algorithm types
4. Submit improvements via pull request

---

Happy live coding! 🎨✨