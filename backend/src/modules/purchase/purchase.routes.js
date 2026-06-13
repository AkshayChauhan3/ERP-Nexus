const express = require('express');
const purchaseController = require('./purchase.controller');
const authenticate = require('../../middleware/authenticate');
const authorize = require('../../middleware/authorize');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Purchase Orders
 *   description: Purchase order lifecycle management
 */

router.use(authenticate);

/**
 * @swagger
 * /purchase-orders:
 *   get:
 *     summary: Get all purchase orders
 *     tags: [Purchase Orders]
 *     responses:
 *       200:
 *         description: List of purchase orders
 */
router.get('/', authorize('admin', 'purchase', 'owner'), purchaseController.getAll);

/**
 * @swagger
 * /purchase-orders/{id}:
 *   get:
 *     summary: Get a purchase order by ID
 *     tags: [Purchase Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Purchase order details
 */
router.get('/:id', authorize('admin', 'purchase', 'owner', 'inventory'), purchaseController.getById);

/**
 * @swagger
 * /purchase-orders:
 *   post:
 *     summary: Create a draft purchase order
 *     tags: [Purchase Orders]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [vendor_id, lines]
 *             properties:
 *               vendor_id: { type: 'string', format: 'uuid' }
 *               lines:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [product_id, ordered_qty, unit_price]
 *                   properties:
 *                     product_id: { type: 'string', format: 'uuid' }
 *                     ordered_qty: { type: 'number' }
 *                     unit_price: { type: 'number' }
 *     responses:
 *       201:
 *         description: Purchase order created
 */
router.post('/', authorize('admin', 'purchase'), purchaseController.create);

/**
 * @swagger
 * /purchase-orders/{id}/confirm:
 *   post:
 *     summary: Confirm a draft purchase order
 *     description: Changes status to confirmed.
 *     tags: [Purchase Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Purchase order confirmed
 */
router.post('/:id/confirm', authorize('admin', 'purchase'), purchaseController.confirm);

/**
 * @swagger
 * /purchase-orders/{id}/receive:
 *   post:
 *     summary: Receive a confirmed purchase order
 *     description: Changes status to received and increases stock permanently.
 *     tags: [Purchase Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Purchase order received
 */
router.post('/:id/receive', authorize('admin', 'inventory'), purchaseController.receive);

module.exports = router;
