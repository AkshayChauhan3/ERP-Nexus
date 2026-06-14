const express = require('express');
const inventoryController = require('./inventory.controller');
const authenticate = require('../../middleware/authenticate');
const authorize = require('../../middleware/authorize');

const router = express.Router();

router.use(authenticate);

// Warehouses
router.get('/warehouses', authorize('inventory', 'owner', 'admin', 'purchase', 'sales'), inventoryController.getWarehouses);
router.post('/warehouses', authorize('inventory', 'owner', 'admin'), inventoryController.createWarehouse);

// Inventory list (product stock per warehouse)
router.get('/', authorize('inventory', 'owner', 'admin', 'purchase'), inventoryController.getInventory);

// Stock Transfers
router.get('/transfers', authorize('inventory', 'owner', 'admin'), inventoryController.getTransfers);
router.post('/transfers', authorize('inventory', 'owner', 'admin'), inventoryController.createTransfer);
router.post('/transfers/:id/complete', authorize('inventory', 'owner', 'admin'), inventoryController.completeTransfer);

// Stock Adjustments
router.get('/adjustments', authorize('inventory', 'owner', 'admin'), inventoryController.getAdjustments);
router.post('/adjustments', authorize('inventory', 'owner', 'admin'), inventoryController.createAdjustment);

// Stock Ledger & Reserved Stock
router.get('/ledger', authorize('inventory', 'owner', 'admin'), inventoryController.getLedger);
router.get('/reserved', authorize('inventory', 'owner', 'admin'), inventoryController.getReserved);

module.exports = router;
