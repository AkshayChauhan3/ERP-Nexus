const express = require('express');
const productController = require('./products.controller');
const authenticate = require('../../middleware/authenticate');
const authorize = require('../../middleware/authorize');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Products
 *   description: Product and inventory management
 */
router.use(authenticate);

/**
 * @swagger
 * /products:
 *   get:
 *     summary: Get all products
 *     description: Returns all products including the computed `free_qty` field.
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: List of products
 */
router.get('/', authorize('admin', 'inventory', 'owner'), productController.getAll);

/**
 * @swagger
 * /products:
 *   post:
 *     summary: Create a new product
 *     tags: [Products]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, sales_price, cost_price]
 *             properties:
 *               name: { type: 'string' }
 *               sales_price: { type: 'number' }
 *               cost_price: { type: 'number' }
 *               procurement_type: { type: 'string', enum: [MTS, MTO] }
 *               procure_on_demand: { type: 'boolean' }
 *               vendor_id: { type: 'string', format: 'uuid' }
 *     responses:
 *       201:
 *         description: Product created
 */
router.post('/', authorize('admin', 'inventory', 'owner'), productController.create);

/**
 * @swagger
 * /products/{id}:
 *   get:
 *     summary: Get a product by ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product object
 *       404:
 *         description: Product not found
 */
router.get('/:id', authorize('admin', 'inventory'), productController.getById);

/**
 * @swagger
 * /products/{id}:
 *   patch:
 *     summary: Update a product
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: 'string' }
 *               sales_price: { type: 'number' }
 *               cost_price: { type: 'number' }
 *     responses:
 *       200:
 *         description: Product updated
 */
router.patch('/:id', authorize('admin', 'inventory'), productController.update);

/**
 * @swagger
 * /products/{id}:
 *   delete:
 *     summary: Delete a product
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product deleted
 */
router.delete('/:id', authorize('admin', 'inventory'), productController.remove);

module.exports = router;
