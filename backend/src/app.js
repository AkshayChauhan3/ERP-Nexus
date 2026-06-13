/**
 * app.js — Express Application Configuration
 *
 * What this file does:
 *   Creates and configures the Express application object.
 *   Applies all global middleware in the correct order:
 *     1. helmet  — sets secure HTTP headers (prevents common web attacks)
 *     2. cors    — allows the frontend (Vite on :5173) to call this API
 *     3. morgan  — logs every request to the console in development
 *     4. express.json — parses incoming JSON request bodies
 *     5. Routes — all API module routes mounted under /api
 *     6. 404 handler — catches any route not matched above
 *     7. errorHandler — global error catcher (last middleware always)
 *
 *   This file does NOT call app.listen() — that's server.js's job.
 *   This file is what supertest imports for unit/integration tests.
 *
 * Route mounting strategy:
 *   Each module (auth, products, sales, etc.) has its own router file.
 *   We mount them here with their base paths.
 *   As we build more modules (Steps 04–13), we add them here.
 */

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');

const errorHandler = require('./middleware/errorHandler');

// ─── Future module imports (added step by step) ───────────
const authRoutes         = require('./modules/auth/auth.routes');
const adminRoutes        = require('./modules/admin/admin.routes');
const productRoutes      = require('./modules/products/products.routes');
const vendorRoutes       = require('./modules/vendors/vendors.routes');
const customerRoutes     = require('./modules/customers/customers.routes');
const salesRoutes        = require('./modules/sales/sales.routes');
const purchaseRoutes     = require('./modules/purchase/purchase.routes');
const receiptRoutes      = require('./modules/purchase/receipt.routes');
const billRoutes         = require('./modules/purchase/bill.routes');
const suggestionRoutes   = require('./modules/purchase/suggestion.routes');
const manufacturingRoutes = require('./modules/manufacturing/bom.routes');
const moRoutes           = require('./modules/manufacturing/mo.routes');
const inventoryRoutes    = require('./modules/inventory/inventory.routes');
const auditRoutes        = require('./modules/audit/audit.routes');
// const intelligenceRoutes = require('./modules/intelligence/intelligence.routes');

const app = express();

// ─── Security Headers ──────────────────────────────────────────────────────────
// helmet sets a dozen HTTP headers like X-Frame-Options, X-Content-Type-Options,
// Strict-Transport-Security, etc. — protects against clickjacking, MIME sniffing, etc.
app.use(helmet());

// ─── CORS ─────────────────────────────────────────────────────────────────────
// Allows the frontend (React/Vite on localhost:5173) to call this API.
// In production, replace with the actual deployed frontend URL.
// credentials: true is needed if we ever use cookies (we use Bearer tokens, but good practice).
const allowedOrigins = [
  'http://localhost:5173',   // Vite dev server (frontend developer's default)
  'http://localhost:3001',   // alternate frontend port
  'http://localhost:3000',   // same-origin (Swagger UI testing)
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (Postman, curl, server-to-server)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS policy: Origin ${origin} not allowed`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ─── Request Logging ──────────────────────────────────────────────────────────
// morgan 'dev' format: "POST /api/auth/login 200 45ms"
// Only log in development — production uses structured logging elsewhere
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// ─── Body Parsing ─────────────────────────────────────────────────────────────
// Parses incoming requests with JSON payloads (e.g., { "email": "...", "password": "..." })
// limit: '10mb' prevents very large payload attacks
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Health Check ─────────────────────────────────────────────────────────────
// Simple root endpoint — confirms server is alive
// Used by Docker/load balancers for health probes
app.get('/', (req, res) => {
  res.json({
    status: 'ERP Nexus Running',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    api_base: '/api',
    docs: '/api/docs',
  });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
// Swagger Documentation Route (available in all environments)
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'ERP Nexus API Docs',
  explorer: true,
}));

// Routes are mounted here as each module is built (Steps 03–13).
// ─── API Routes ───────────────────────────────────────────────────────────────

app.use('/api/auth',                 authRoutes);
app.use('/api/admin',                adminRoutes);
app.use('/api/products',             productRoutes);
app.use('/api/vendors',              vendorRoutes);
app.use('/api/customers',            customerRoutes);
app.use('/api/sales-orders',         salesRoutes);
app.use('/api/purchase-orders',      purchaseRoutes);
app.use('/api/purchase/receipts',    receiptRoutes);
app.use('/api/purchase/bills',       billRoutes);
app.use('/api/purchase/suggestions', suggestionRoutes);
app.use('/api/boms',                 manufacturingRoutes);
app.use('/api/manufacturing-orders', moRoutes);
app.use('/api/stock-ledger',         inventoryRoutes);
app.use('/api/audit-logs',           auditRoutes);
// app.use('/api',                      intelligenceRoutes);    // /risk-alerts, /simulate, /ai-advisor, /digital-twin, /business-health-score, /dashboard

// ─── 404 Handler ──────────────────────────────────────────────────────────────
// Catches any request that didn't match a route above.
// Must be placed AFTER all route definitions.
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.originalUrl,
    hint: 'See /api/docs for all available endpoints',
  });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
// Catches all errors thrown from route handlers (sync or async via express-async-errors).
// Must be the LAST middleware (4 arguments = error handler in Express).
app.use(errorHandler);

module.exports = app;
