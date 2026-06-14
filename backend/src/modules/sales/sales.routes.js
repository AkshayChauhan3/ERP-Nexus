const express = require('express');
const salesController = require('./sales.controller');
const { generateInvoicePDF } = require('./invoice.controller');
const authenticate = require('../../middleware/authenticate');
const authorize = require('../../middleware/authorize');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Sales Orders
 *   description: Sales order lifecycle management
 */

router.use(authenticate);

/**
 * @swagger
 * /sales-orders:
 *   get:
 *     summary: Get all sales orders
 *     tags: [Sales Orders]
 *     responses:
 *       200:
 *         description: List of sales orders
 */
router.get('/', authorize('admin', 'sales', 'owner'), salesController.getAll);

/**
 * @swagger
 * /sales-orders/{id}:
 *   get:
 *     summary: Get a sales order by ID
 *     tags: [Sales Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Sales order details
 */
// ⚠️ Must be registered BEFORE /:id to avoid route conflict
router.get('/:id/invoice', authorize('admin', 'owner'), generateInvoicePDF);

router.get('/:id', authorize('admin', 'sales', 'owner', 'inventory'), salesController.getById);

/**
 * @swagger
 * /sales-orders:
 *   post:
 *     summary: Create a draft sales order
 *     tags: [Sales Orders]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [customer_id, lines]
 *             properties:
 *               customer_id: { type: 'string', format: 'uuid' }
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
 *         description: Sales order created
 */
router.post('/', authorize('admin', 'sales'), salesController.create);

/**
 * @swagger
 * /sales-orders/{id}/confirm:
 *   post:
 *     summary: Confirm a draft sales order
 *     description: Changes status to confirmed and reserves stock.
 *     tags: [Sales Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Sales order confirmed
 *       422:
 *         description: Stock violation (insufficient stock)
 */
router.post('/:id/confirm', authorize('admin', 'sales'), salesController.confirm);

/**
 * @swagger
 * /sales-orders/{id}/deliver:
 *   post:
 *     summary: Deliver a confirmed sales order
 *     description: Changes status to delivered and deducts stock permanently.
 *     tags: [Sales Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Sales order delivered
 */
router.post('/:id/deliver', authorize('admin', 'inventory'), salesController.deliver);

/**
 * @swagger
 * /sales-orders/{id}/cancel:
 *   post:
 *     summary: Cancel a sales order
 *     description: Changes status to cancelled. Releases reserved stock if it was confirmed.
 *     tags: [Sales Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Sales order cancelled
 */
router.post('/:id/cancel', authorize('admin', 'sales', 'owner'), salesController.cancel);

module.exports = router;
