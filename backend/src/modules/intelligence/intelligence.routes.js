const express = require('express');
const intelligenceController = require('./intelligence.controller');
const authenticate = require('../../middleware/authenticate');
const authorize = require('../../middleware/authorize');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Intelligence
 *   description: Dashboards and Business Analytics
 */

router.use(authenticate);

/**
 * @swagger
 * /intelligence/dashboard-stats:
 *   get:
 *     summary: Get Owner Dashboard Stats
 *     description: Retrieve real-time aggregated metrics across sales, purchases, inventory, manufacturing, etc.
 *     tags: [Intelligence]
 *     responses:
 *       200:
 *         description: Dashboard stats successfully retrieved
 */
router.get('/dashboard-stats', authorize('owner', 'admin'), intelligenceController.getDashboardStats);

/**
 * @swagger
 * /intelligence/advisor:
 *   get:
 *     summary: Get AI Advisor Recommendations
 *     description: Retrieve prioritized AI-generated recommendations based on real-time operational data.
 *     tags: [Intelligence]
 *     responses:
 *       200:
 *         description: AI recommendations successfully retrieved
 */
router.get('/advisor', authorize('owner', 'admin'), intelligenceController.getAdvisorRecommendations);

module.exports = router;
