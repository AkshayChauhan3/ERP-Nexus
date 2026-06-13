const express = require('express');
const billController = require('./bill.controller');
const authenticate = require('../../middleware/authenticate');
const authorize = require('../../middleware/authorize');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Vendor Bills
 *   description: AP Invoicing and bill payments
 */

router.use(authenticate);

/**
 * @swagger
 * /purchase/bills:
 *   get:
 *     summary: List all vendor bills
 *     tags: [Vendor Bills]
 *     responses:
 *       200:
 *         description: List of bills
 */
router.get('/', authorize('purchase', 'admin', 'owner'), billController.getAll);

/**
 * @swagger
 * /purchase/bills/{id}:
 *   get:
 *     summary: Get specific vendor bill
 *     tags: [Vendor Bills]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Bill details
 */
router.get('/:id', authorize('purchase', 'admin', 'owner'), billController.getById);

/**
 * @swagger
 * /purchase/bills:
 *   post:
 *     summary: Create a vendor bill
 *     tags: [Vendor Bills]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [bill_number, po_id, vendor_id, invoice_date, due_date, subtotal]
 *             properties:
 *               bill_number: { type: 'string' }
 *               po_id: { type: 'string', format: 'uuid' }
 *               vendor_id: { type: 'string', format: 'uuid' }
 *               invoice_date: { type: 'string', format: 'date' }
 *               due_date: { type: 'string', format: 'date' }
 *               subtotal: { type: 'number' }
 *               tax: { type: 'number', default: 0 }
 *               attachment_url: { type: 'string', format: 'uri' }
 *     responses:
 *       201:
 *         description: Bill created
 */
router.post('/', authorize('purchase', 'admin', 'owner'), billController.create);

/**
 * @swagger
 * /purchase/bills/{id}/pay:
 *   post:
 *     summary: Mark a bill as paid
 *     tags: [Vendor Bills]
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
 *             required: [payment_reference]
 *             properties:
 *               payment_reference: { type: 'string' }
 *     responses:
 *       200:
 *         description: Bill marked as paid
 */
router.post('/:id/pay', authorize('admin', 'owner'), billController.pay);

module.exports = router;
