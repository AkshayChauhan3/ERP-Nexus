const { z } = require('zod');
const suggestionService = require('./suggestion.service');

const updateStatusSchema = z.object({
  status: z.enum(['pending', 'po_created', 'ignored']),
});

async function getAll(req, res) {
  const suggestions = await suggestionService.getAllSuggestions({
    status: req.query.status
  });
  res.json({ success: true, data: suggestions });
}

async function updateStatus(req, res) {
  const { status } = updateStatusSchema.parse(req.body);
  const suggestion = await suggestionService.updateSuggestionStatus(req.params.id, status);
  res.json({ success: true, message: 'Suggestion status updated', data: suggestion });
}

module.exports = {
  getAll,
  updateStatus,
};
