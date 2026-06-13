const express = require('express');
const adminController = require('./admin.controller');
const authenticate = require('../../middleware/authenticate');
const authorize = require('../../middleware/authorize');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Admin management and user approvals
 */
router.use(authenticate);
router.use(authorize('admin'));

/**
 * @swagger
 * /admin/registrations:
 *   get:
 *     summary: List all PENDING user registrations
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: List of pending registrations
 */
router.get('/registrations', adminController.getPendingRegistrations);

/**
 * @swagger
 * /admin/approve/{userId}:
 *   post:
 *     summary: Approve a pending user registration
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User approved successfully
 */
router.post('/approve/:userId', adminController.approve);

/**
 * @swagger
 * /admin/reject/{userId}:
 *   post:
 *     summary: Reject a pending user registration
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [reason]
 *             properties:
 *               reason: { type: 'string' }
 *     responses:
 *       200:
 *         description: User rejected successfully
 */
router.post('/reject/:userId', adminController.reject);

module.exports = router;
