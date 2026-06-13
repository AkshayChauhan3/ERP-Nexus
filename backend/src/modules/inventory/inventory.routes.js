const express = require('express');
const inventoryController = require('./inventory.controller');
const authenticate = require('../../middleware/authenticate');
const authorize = require('../../middleware/authorize');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Inventory
 *   description: Stock Ledger and Inventory Tracking
 */

router.use(authenticate);

/**
 * @swagger
 * /inventory/ledger:
 *   get:
 *     summary: Get stock ledger entries
 *     description: Retrieve stock movements with optional filtering. Read-only.
 *     tags: [Inventory]
 *     parameters:
 *       - in: query
 *         name: product_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by specific product
 *       - in: query
 *         name: movement_type
 *         schema:
 *           type: string
 *           enum: [sale_out, purchase_in, mfg_consume, mfg_produce, adjustment]
 *         description: Filter by type of stock movement
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter movements from this date (ISO 8601)
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter movements up to this date (ISO 8601)
 *     responses:
 *       200:
 *         description: List of stock ledger entries
 */
router.get('/ledger', authorize('inventory', 'owner', 'admin'), inventoryController.getLedger);

module.exports = router;
