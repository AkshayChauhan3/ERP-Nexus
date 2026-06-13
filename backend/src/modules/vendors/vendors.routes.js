const express = require('express');
const vendorController = require('./vendors.controller');
const authenticate = require('../../middleware/authenticate');
const authorize = require('../../middleware/authorize');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Vendors
 *   description: Vendor management
 */
router.use(authenticate);

/**
 * @swagger
 * /vendors:
 *   get:
 *     summary: Get all vendors
 *     tags: [Vendors]
 *     responses:
 *       200:
 *         description: List of vendors
 */
router.get('/', authorize('admin', 'purchase', 'owner', 'inventory'), vendorController.getAll);

/**
 * @swagger
 * /vendors:
 *   post:
 *     summary: Create a new vendor
 *     tags: [Vendors]
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
 *         description: Vendor created
 */
router.post('/', authorize('admin', 'purchase', 'owner'), vendorController.create);

/**
 * @swagger
 * /vendors/{id}:
 *   get:
 *     summary: Get a vendor by ID
 *     tags: [Vendors]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Vendor object
 *       404:
 *         description: Vendor not found
 */
router.get('/:id', authorize('admin', 'purchase', 'owner', 'inventory'), vendorController.getById);

/**
 * @swagger
 * /vendors/{id}:
 *   put:
 *     summary: Update a vendor
 *     tags: [Vendors]
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
 *         description: Vendor updated
 */
router.put('/:id', authorize('admin', 'purchase'), vendorController.update);

/**
 * @swagger
 * /vendors/{id}:
 *   delete:
 *     summary: Delete a vendor
 *     tags: [Vendors]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Vendor deleted
 */
router.delete('/:id', authorize('admin', 'purchase'), vendorController.remove);

module.exports = router;
