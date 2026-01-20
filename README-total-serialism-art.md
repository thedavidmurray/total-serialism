# Total Serialism Generative Art

## Quick Start

I've created two versions of the generative art:

### 1. **Simple Version** (Recommended to start)
Open `total-serialism-fidenza.html` directly in your browser:
```bash
open total-serialism-fidenza.html
```

**Features:**
- A3 sized canvas (displayed at 40% scale)
- Press `R` to regenerate new artwork
- Press `S` to save high-resolution PNG
- Press `1-5` for different color schemes
- Press `SPACE` to pause animation

### 2. **Advanced Version** (Using npm package)
This uses the actual Total Serialism npm package:

```bash
# Install dependencies
npm install

# Generate parameters
node total-serialism-art-advanced.js

# View the generated parameters
cat total-serialism-art-params.json
```

## How It Works

The artwork uses Total Serialism algorithms for:

1. **Euclidean Rhythms** - Creates spatial distribution patterns
2. **Harmonic Color Palettes** - Uses musical chord progressions for colors
3. **Flow Fields** - Combines cosine/sine waves with drunk walks
4. **Markov Chains** - For color selection weights
5. **Cellular Automaton** - Background texture generation
6. **Fibonacci Sequences** - Particle counts and sizing

## Algorithmic Techniques

- **Spawn Patterns**: Golden spiral, rhythmic grid, clusters, flow lines
- **Particle Behaviors**: Flow following, spiral motion, wave modulation
- **Color Harmony**: Based on musical intervals (complementary, triadic, etc.)
- **Rhythm Patterns**: Multiple euclidean rhythms control different visual aspects

## Files Created

- `total-serialism-fidenza.html` - Main generative art (self-contained)
- `total-serialism-generative-art.html` - First version with inline algorithms
- `total-serialism-art-advanced.js` - Node.js parameter generator
- `package.json` - NPM configuration
- `total-serialism-art-params.json` - Generated parameters (after running node script)

## Tips

- Each refresh creates a completely unique artwork
- The flow fields create Fidenza-like organic movements
- Particles have different behaviors (flow, spiral, wave)
- Color schemes are based on music theory
- Euclidean rhythms create natural-feeling distributions

Enjoy creating unique algorithmic artworks!