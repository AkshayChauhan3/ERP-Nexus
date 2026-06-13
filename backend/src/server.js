/**
 * server.js — Entry Point
 *
 * What this file does:
 *   This is the ONLY file that starts the HTTP server.
 *   It imports the fully configured Express app from app.js,
 *   reads the PORT from .env, and calls app.listen().
 *
 *   Keeping server.js separate from app.js is a best practice:
 *   - app.js exports the Express app for testing (supertest imports app directly)
 *   - server.js handles the actual network binding (not used in tests)
 *
 * How to run:
 *   Development: npm run dev   (nodemon auto-restarts on file changes)
 *   Production:  npm start
 */

require('dotenv').config();           // Load .env into process.env — must be FIRST
require('express-async-errors');      // Patches Express so async errors auto-go to errorHandler

const app = require('./app');

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log('');
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║       ERP Nexus — The Autonomous Factory OS       ║');
  console.log('╠══════════════════════════════════════════════════╣');
  console.log(`║  Server   : http://localhost:${PORT}               ║`);
  console.log(`║  API Base : http://localhost:${PORT}/api            ║`);
  console.log(`║  API Docs : http://localhost:${PORT}/api/docs       ║`);
  console.log(`║  Env      : ${(process.env.NODE_ENV || 'development').padEnd(38)}║`);
  console.log('╚══════════════════════════════════════════════════╝');
  console.log('');
});

// Graceful shutdown — closes the server cleanly on Ctrl+C or process kill
// This ensures database connections are properly closed (important for Prisma)
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\nSIGINT received. Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
});
