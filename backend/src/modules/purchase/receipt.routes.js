const express = require('express');
const receiptController = require('./receipt.controller');
const authenticate = require('../../middleware/authenticate');
const authorize = require('../../middleware/authorize');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Goods Receipts
 *   description: Managing physical receipt of goods against Purchase Orders
 */

router.use(authenticate);

/**
 * @swagger
 * /purchase/receipts:
 *   get:
 *     summary: List all goods receipts
 *     tags: [Goods Receipts]
 *     responses:
 *       200:
 *         description: List of receipts
 */
router.get('/', authorize('purchase', 'inventory', 'admin', 'owner'), receiptController.getAll);

/**
 * @swagger
 * /purchase/receipts/{id}:
 *   get:
 *     summary: Get a specific goods receipt
 *     tags: [Goods Receipts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Receipt details
 */
router.get('/:id', authorize('purchase', 'inventory', 'admin', 'owner'), receiptController.getById);

/**
 * @swagger
 * /purchase/receipts:
 *   post:
 *     summary: Log a physical delivery of goods
 *     description: Creates a Goods Receipt, updates inventory on_hand_qty, updates PO received_qty, and logs to Stock Ledger.
 *     tags: [Goods Receipts]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [po_id, items]
 *             properties:
 *               po_id: { type: 'string', format: 'uuid' }
 *               delivery_note_ref: { type: 'string' }
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [product_id, quantity_received]
 *                   properties:
 *                     product_id: { type: 'string', format: 'uuid' }
 *                     quantity_received: { type: 'number' }
 *                     remarks: { type: 'string' }
 *     responses:
 *       201:
 *         description: Goods receipt processed successfully
 */
router.post('/', authorize('inventory', 'admin', 'owner'), receiptController.create);

module.exports = router;
