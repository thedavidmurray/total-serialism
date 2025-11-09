import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Serve static files from current directory
app.use(express.static(__dirname));

// Serve node_modules for client-side dependencies
app.use('/node_modules', express.static(path.join(__dirname, 'node_modules')));

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`Main hub: http://localhost:${PORT}/index.html`);
  console.log(`Dev hub: http://localhost:${PORT}/index-dev.html`);
});