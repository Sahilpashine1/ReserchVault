const express = require('express');
const router = express.Router();
const Publication = require('../models/Publication');
const auth = require('../middleware/auth');
const queryEngine = require('../utils/queryEngine');

// @route   POST /api/chatbot/query
// @desc    Process chatbot query using rule-based engine
// @access  Private
router.post('/query', auth, async (req, res) => {
    try {
        const { query } = req.body;

        if (!query || query.trim() === '') {
            return res.status(400).json({
                message: 'Please provide a query',
                response: 'Please ask me something about your publications!'
            });
        }

        // Fetch all publications for the user
        const publications = await Publication.find({ userId: req.userId }).lean();

        // Process query using rule-based engine
        const result = await queryEngine.processQuery(query, publications);

        res.json({
            success: true,
            query: query,
            response: result.response,
            data: result.data,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Chatbot query error:', error);
        res.status(500).json({
            message: 'Error processing query',
            response: 'Sorry, I encountered an error processing your request. Please try again.'
        });
    }
});

// @route   GET /api/chatbot/suggestions
// @desc    Get suggested queries
// @access  Private
router.get('/suggestions', auth, async (req, res) => {
    try {
        const suggestions = [
            {
                text: "Give me a summary of my publications",
                category: "Summary"
            },
            {
                text: "What are my main research areas?",
                category: "Research Areas"
            },
            {
                text: "How many papers after 2020?",
                category: "Time Filter"
            },
            {
                text: "List journals where I published most",
                category: "Journal Analysis"
            },
            {
                text: "Show my latest publication link",
                category: "Latest"
            },
            {
                text: "Show publications without links",
                category: "Validation"
            },
            {
                text: "Generate statistics",
                category: "Statistics"
            }
        ];

        res.json({
            success: true,
            suggestions: suggestions
        });

    } catch (error) {
        console.error('Get suggestions error:', error);
        res.status(500).json({ message: 'Error fetching suggestions' });
    }
});

module.exports = router;
