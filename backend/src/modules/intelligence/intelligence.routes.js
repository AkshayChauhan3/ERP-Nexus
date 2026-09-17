const express = require('express');
const intelligenceController = require('./intelligence.controller');
const authenticate = require('../../middleware/authenticate');
const authorize = require('../../middleware/authorize');

const router = express.Router();

router.use(authenticate);

// Dashboard Stats & Executive Summary
router.get('/dashboard-stats', authorize('owner', 'admin'), intelligenceController.getDashboardStats);
router.get('/summary', authorize('owner', 'admin'), intelligenceController.getBusinessSummary);

// EN Advisor
router.get('/advisor', intelligenceController.getAdvisorRecommendations);
router.post('/advisor/resolve', intelligenceController.resolveAdvisorRecommendation);

// Notifications & 48-Hour History
router.get('/notifications', intelligenceController.getRoleNotifications);
router.get('/notifications/history', intelligenceController.getNotificationHistory);
router.patch('/notifications/:id/read', intelligenceController.markNotificationRead);
router.post('/notifications/mark-all-read', intelligenceController.markAllNotificationsRead);
router.patch('/notifications/:id/dismiss', intelligenceController.dismissNotification);
router.patch('/notifications/:id/complete', intelligenceController.completeNotification);

module.exports = router;
