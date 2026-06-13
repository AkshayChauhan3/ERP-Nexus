

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');

const errorHandler = require('./middleware/errorHandler');
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
const intelligenceRoutes = require('./modules/intelligence/intelligence.routes');

const path = require('path');

const app = express();
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3001',
  'http://localhost:3000',
];

app.use(cors({
  origin: (origin, callback) => {
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
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
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
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'ERP Nexus API Docs',
  explorer: true,
}));

app.use('/api/auth',                 authRoutes);
app.use('/api/users',                adminRoutes);
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
app.use('/api/intelligence',         intelligenceRoutes);
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.originalUrl,
    hint: 'See /api/docs for all available endpoints',
  });
});
app.use(errorHandler);

module.exports = app;
