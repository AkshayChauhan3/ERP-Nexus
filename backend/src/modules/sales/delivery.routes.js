const express = require('express');
const deliveryController = require('./delivery.controller');
const authenticate = require('../../middleware/authenticate');
const authorize = require('../../middleware/authorize');

const router = express.Router();

router.use(authenticate);

router.get('/', authorize('admin', 'sales', 'owner', 'inventory'), deliveryController.getAll);
router.get('/:id', authorize('admin', 'sales', 'owner', 'inventory'), deliveryController.getById);
router.patch('/:id/status', authorize('admin', 'sales', 'inventory'), deliveryController.updateStatus);

module.exports = router;
