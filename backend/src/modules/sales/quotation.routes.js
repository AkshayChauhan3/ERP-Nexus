const express = require('express');
const quotationController = require('./quotation.controller');
const authenticate = require('../../middleware/authenticate');
const authorize = require('../../middleware/authorize');

const router = express.Router();

router.use(authenticate);

router.get('/', authorize('admin', 'sales', 'owner'), quotationController.getAll);
router.get('/:id', authorize('admin', 'sales', 'owner'), quotationController.getById);
router.post('/', authorize('admin', 'sales'), quotationController.create);
router.patch('/:id', authorize('admin', 'sales'), quotationController.update);
router.post('/:id/convert', authorize('admin', 'sales'), quotationController.convert);

module.exports = router;
