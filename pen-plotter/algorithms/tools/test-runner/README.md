# Algorithm Test Runner

Puppeteer-based functional testing for Total Serialism pen plotter algorithms.

## Setup

```bash
cd algorithms/tools/test-runner
npm install
```

## Usage

```bash
# Run all tests
npm test

# Verbose output (shows all test details)
npm test -- --verbose

# Test a specific category
npm test -- --category geometric

# Test a single algorithm
npm test -- --single spiral-burst

# Show browser window during tests
npm test -- --headed
```

## Tests Performed

| Test | Description |
|------|-------------|
| **Canvas exists** | Verifies a `<canvas>` element exists with non-zero dimensions |
| **Canvas has content** | Samples pixels to confirm rendering occurred (>0.1% non-empty) |
| **Controls exist** | Counts sliders, checkboxes, and select elements |
| **TS APIs loaded** | Checks for TSCanvas, TSAutoRegen, TSControls, TSZoom globals |
| **Slider interaction** | Programmatically moves a slider and verifies value changes |
| **Canvas regenerates** | Captures canvas hash, triggers regen, compares hash |
| **No errors** | Monitors console.error and page errors during load |

## Test Results

Results are saved to `reports/validation-YYYY-MM-DD.json` with structure:

```json
{
  "timestamp": "2024-12-23T...",
  "passed": 60,
  "failed": 3,
  "warnings": 2,
  "tests": [
    {
      "name": "spiral burst",
      "category": "geometric",
      "filename": "spiral-burst-gui.html",
      "status": "pass",
      "tests": {
        "canvas-exists": { "pass": true, "detail": "800×800" },
        "canvas-content": { "pass": true, "detail": "45.2% filled" },
        ...
      }
    }
  ]
}
```

## Exit Codes

- `0` - All tests passed (warnings OK)
- `1` - One or more tests failed

## Troubleshooting

**Port 8080 in use:**
```bash
lsof -i :8080  # Find process
kill -9 <PID>  # Kill it
```

**Puppeteer issues:**
```bash
rm -rf node_modules
npm install
```

**Tests timing out:**
Some algorithms (reaction-diffusion, flow-fields) need more time. The default 15s timeout should handle most cases.
