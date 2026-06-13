

require('dotenv').config();
require('express-async-errors');

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
