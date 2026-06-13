const express = require('express');
const suggestionController = require('./suggestion.controller');
const authenticate = require('../../middleware/authenticate');
const authorize = require('../../middleware/authorize');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Procurement Suggestions
 *   description: System-generated reorder suggestions based on inventory levels
 */

router.use(authenticate);

/**
 * @swagger
 * /purchase/suggestions:
 *   get:
 *     summary: List procurement suggestions
 *     tags: [Procurement Suggestions]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, po_created, ignored]
 *     responses:
 *       200:
 *         description: List of suggestions
 */
router.get('/', authorize('purchase', 'inventory', 'admin', 'owner'), suggestionController.getAll);

/**
 * @swagger
 * /purchase/suggestions/{id}/status:
 *   patch:
 *     summary: Update suggestion status
 *     tags: [Procurement Suggestions]
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
 *             required: [status]
 *             properties:
 *               status: { type: 'string', enum: [pending, po_created, ignored] }
 *     responses:
 *       200:
 *         description: Status updated
 */
router.patch('/:id/status', authorize('purchase', 'admin', 'owner'), suggestionController.updateStatus);

module.exports = router;
