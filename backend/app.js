import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';
import db from './config/db.js';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create Express app
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// connect to frontend
app.use(cors());

export const port = 5000;

const server = http.createServer(app);
db()
.then(() => {
    server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });

  server.on('error', (error) => {
    console.error('Server encountered an error:', error);
  });
});

export default app;