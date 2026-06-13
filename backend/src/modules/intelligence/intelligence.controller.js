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

module.exports = {
  getDashboardStats
};
