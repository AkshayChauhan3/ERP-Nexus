const express = require('express');
const moController = require('./mo.controller');
const authenticate = require('../../middleware/authenticate');
const authorize = require('../../middleware/authorize');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Manufacturing Orders
 *   description: Manufacturing Order (MO) lifecycle management
 */

router.use(authenticate);

/**
 * @swagger
 * /manufacturing-orders:
 *   get:
 *     summary: Get all manufacturing orders
 *     tags: [Manufacturing Orders]
 *     responses:
 *       200:
 *         description: List of MOs
 */
router.get('/', authorize('manufacturing', 'owner', 'inventory'), moController.getAll);

/**
 * @swagger
 * /manufacturing-orders/{id}:
 *   get:
 *     summary: Get a manufacturing order by ID
 *     tags: [Manufacturing Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: MO details with work orders and BOM lines
 */
router.get('/:id', authorize('manufacturing', 'owner', 'inventory'), moController.getById);

/**
 * @swagger
 * /manufacturing-orders:
 *   post:
 *     summary: Create a draft manufacturing order
 *     tags: [Manufacturing Orders]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [product_id, quantity]
 *             properties:
 *               product_id: { type: 'string', format: 'uuid' }
 *               quantity: { type: 'number' }
 *     responses:
 *       201:
 *         description: MO created
 */
router.post('/', authorize('manufacturing', 'owner'), moController.create);

/**
 * @swagger
 * /manufacturing-orders/{id}/confirm:
 *   post:
 *     summary: Confirm a manufacturing order
 *     description: Reserves component stock and generates work orders.
 *     tags: [Manufacturing Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: MO confirmed
 */
router.post('/:id/confirm', authorize('manufacturing', 'owner'), moController.confirm);

/**
 * @swagger
 * /manufacturing-orders/{id}/complete:
 *   post:
 *     summary: Complete a manufacturing order
 *     description: Consumes components, produces finished goods, and completes pending work orders.
 *     tags: [Manufacturing Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: MO completed
 */
router.post('/:id/complete', authorize('manufacturing', 'inventory', 'owner'), moController.complete);

/**
 * @swagger
 * /manufacturing-orders/{id}/cancel:
 *   post:
 *     summary: Cancel a manufacturing order
 *     description: Releases reserved components and deletes work orders.
 *     tags: [Manufacturing Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: MO cancelled
 */
router.post('/:id/cancel', authorize('manufacturing', 'owner'), moController.cancel);

module.exports = router;
