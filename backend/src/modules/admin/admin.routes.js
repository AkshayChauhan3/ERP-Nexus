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
router.get('/pending', adminController.getPendingRegistrations);
router.get('/', adminController.getAllUsers);

router.post('/', adminController.create);
router.put('/:userId', adminController.update);
router.post('/:userId/toggle', adminController.toggle);
router.post('/:userId/reset-password', adminController.resetPassword);

// Support both path structures for approvals
router.post('/approve/:userId', adminController.approve);
router.post('/:userId/approve', adminController.approve);

router.post('/reject/:userId', adminController.reject);
router.post('/:userId/reject', adminController.reject);

module.exports = router;
