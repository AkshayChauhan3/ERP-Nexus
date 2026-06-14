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
    const recommendations = await intelligenceService.getAdvisorRecommendations();
    res.json({ success: true, data: recommendations });
  } catch (error) {
    console.error('Error fetching advisor recommendations:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch recommendations' });
  }
}

module.exports = {
  getDashboardStats,
  getAdvisorRecommendations
};
