const intelligenceService = require('./intelligence.service');

async function getDashboardStats(req, res) {
  try {
    const stats = await intelligenceService.getDashboardStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch dashboard stats' });
  }
}

async function getAdvisorRecommendations(req, res) {
  try {
    const role = req.user?.role || (req.user?.is_admin ? 'admin' : 'sales');
    const recommendations = await intelligenceService.getAdvisorRecommendations(role, req.user);
    res.json({ success: true, data: recommendations });
  } catch (error) {
    console.error('Error fetching advisor recommendations:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch recommendations' });
  }
}

async function resolveAdvisorRecommendation(req, res) {
  try {
    const { recommendationKey, actionType } = req.body;
    if (!recommendationKey) {
      return res.status(400).json({ success: false, error: 'recommendationKey is required' });
    }
    const success = await intelligenceService.resolveAdvisorRecommendation(
      recommendationKey,
      actionType || 'COMPLETED',
      req.user
    );
    res.json({ success, message: 'Recommendation resolved successfully' });
  } catch (error) {
    console.error('Error resolving advisor recommendation:', error);
    res.status(500).json({ success: false, error: 'Failed to resolve recommendation' });
  }
}

async function getBusinessSummary(req, res) {
  try {
    const summary = await intelligenceService.getBusinessSummary();
    res.json({ success: true, data: summary });
  } catch (error) {
    console.error('Error fetching business summary:', error);
    res.status(500).json({ success: false, error: 'Failed to generate summary' });
  }
}

async function getRoleNotifications(req, res) {
  try {
    const role = req.user?.role || (req.user?.is_admin ? 'admin' : 'sales');
    const notifications = await intelligenceService.getRoleNotifications(role, req.user);
    res.json({ success: true, notifications });
  } catch (error) {
    console.error('Error fetching role notifications:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch notifications' });
  }
}

async function getNotificationHistory(req, res) {
  try {
    const role = req.user?.role || (req.user?.is_admin ? 'admin' : 'sales');
    const history = await intelligenceService.getNotificationHistory(role, req.user);
    res.json({ success: true, history });
  } catch (error) {
    console.error('Error fetching notification history:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch notification history' });
  }
}

async function markNotificationRead(req, res) {
  try {
    const { id } = req.params;
    const { notification } = req.body || {};
    const success = await intelligenceService.markNotificationRead(id, req.user, notification);
    res.json({ success });
  } catch (error) {
    console.error('Error marking notification read:', error);
    res.status(500).json({ success: false, error: 'Failed to mark notification read' });
  }
}

async function markAllNotificationsRead(req, res) {
  try {
    const role = req.user?.role || (req.user?.is_admin ? 'admin' : 'sales');
    const success = await intelligenceService.markAllNotificationsRead(role, req.user);
    res.json({ success });
  } catch (error) {
    console.error('Error marking all notifications read:', error);
    res.status(500).json({ success: false, error: 'Failed to mark all notifications read' });
  }
}

async function dismissNotification(req, res) {
  try {
    const { id } = req.params;
    const { notification } = req.body || {};
    const success = await intelligenceService.dismissNotification(id, req.user, notification);
    res.json({ success });
  } catch (error) {
    console.error('Error dismissing notification:', error);
    res.status(500).json({ success: false, error: 'Failed to dismiss notification' });
  }
}

async function completeNotification(req, res) {
  try {
    const { id } = req.params;
    const success = await intelligenceService.completeNotification(id, req.user);
    res.json({ success });
  } catch (error) {
    console.error('Error completing notification:', error);
    res.status(500).json({ success: false, error: 'Failed to complete notification' });
  }
}

module.exports = {
  getDashboardStats,
  getAdvisorRecommendations,
  resolveAdvisorRecommendation,
  getBusinessSummary,
  getRoleNotifications,
  getNotificationHistory,
  markNotificationRead,
  markAllNotificationsRead,
  dismissNotification,
  completeNotification
};
