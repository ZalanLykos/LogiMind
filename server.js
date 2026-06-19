import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const DB_FILE = path.join(__dirname, 'Database.json');

app.use(cors());
app.use(express.json());

// API endpoint to save data
app.post('/api/save', async (req, res) => {
  try {
    const { data } = req.body;
    await fs.writeFile(DB_FILE, JSON.stringify(data, null, 2));
    res.json({ success: true, message: 'Data saved to Database.json' });
  } catch (error) {
    console.error('Error saving data:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// API endpoint to clear data
app.post('/api/clear', async (req, res) => {
  try {
    await fs.writeFile(DB_FILE, JSON.stringify([], null, 2));
    res.json({ success: true, message: 'Database cleared' });
  } catch (error) {
    console.error('Error clearing data:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// API endpoint to load data
app.get('/api/data', async (req, res) => {
  try {
    const exists = await fs.access(DB_FILE).then(() => true).catch(() => false);
    if (!exists) {
      return res.json([]);
    }
    const data = await fs.readFile(DB_FILE, 'utf-8');
    res.json(JSON.parse(data));
  } catch (error) {
    console.error('Error loading data:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Serve static files from dist directory
app.use(express.static(path.join(__dirname, 'dist')));

// Serve index.html for all other routes (SPA support)
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Database file: ${DB_FILE}`);
});
