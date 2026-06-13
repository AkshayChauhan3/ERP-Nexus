const express = require('express');
const customerController = require('./customers.controller');
const authenticate = require('../../middleware/authenticate');
const authorize = require('../../middleware/authorize');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Customers
 *   description: Customer management
 */

// All customer routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /customers:
 *   get:
 *     summary: Get all customers
 *     tags: [Customers]
 *     responses:
 *       200:
 *         description: List of customers
 */
// Admin, sales, owner can list customers
router.get('/', authorize('admin', 'sales', 'owner'), customerController.getAll);

/**
 * @swagger
 * /customers:
 *   post:
 *     summary: Create a new customer
 *     tags: [Customers]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: 'string' }
 *               email: { type: 'string', format: 'email' }
 *               phone: { type: 'string' }
 *               address: { type: 'string' }
 *     responses:
 *       201:
 *         description: Customer created
 */
// Only admin, sales, owner can create customers
router.post('/', authorize('admin', 'sales', 'owner'), customerController.create);

/**
 * @swagger
 * /customers/{id}:
 *   get:
 *     summary: Get a customer by ID
 *     tags: [Customers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Customer object
 *       404:
 *         description: Customer not found
 */
router.get('/:id', authorize('admin', 'sales', 'owner'), customerController.getById);

/**
 * @swagger
 * /customers/{id}:
 *   put:
 *     summary: Update a customer
 *     tags: [Customers]
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
 *               email: { type: 'string', format: 'email' }
 *               phone: { type: 'string' }
 *               address: { type: 'string' }
 *     responses:
 *       200:
 *         description: Customer updated
 */
router.put('/:id', authorize('admin', 'sales'), customerController.update);

/**
 * @swagger
 * /customers/{id}:
 *   delete:
 *     summary: Delete a customer
 *     tags: [Customers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Customer deleted
 */
router.delete('/:id', authorize('admin', 'sales'), customerController.remove);

module.exports = router;
