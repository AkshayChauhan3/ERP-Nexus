const express = require('express');
const auditController = require('./audit.controller');
const authenticate = require('../../middleware/authenticate');
const authorize = require('../../middleware/authorize');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Audit Logs
 *   description: System-wide audit trails
 */

router.use(authenticate);

/**
 * @swagger
 * /audit-logs:
 *   get:
 *     summary: Get audit logs
 *     description: Retrieve system audit logs with optional filtering. Read-only.
 *     tags: [Audit Logs]
 *     parameters:
 *       - in: query
 *         name: user_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter logs by user
 *       - in: query
 *         name: model_name
 *         schema:
 *           type: string
 *         description: Filter by modified entity (e.g. SalesOrder, Product)
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *           enum: [create, update, delete, status_change]
 *         description: Filter by action type
 *       - in: query
 *         name: record_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by specific record ID
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date-time
 *     responses:
 *       200:
 *         description: List of audit logs
 */
router.get('/', authorize('admin', 'owner'), auditController.getLogs);

module.exports = router;
