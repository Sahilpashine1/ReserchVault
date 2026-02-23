const express = require('express');
const router = express.Router();
const Publication = require('../models/Publication');
const auth = require('../middleware/auth');
const queryEngine = require('../utils/queryEngine');

// @route   POST /api/chatbot/query
// @desc    Process chatbot query using rule-based engine (context-aware)
// @access  Private
router.post('/query', auth, async (req, res) => {
    try {
        const { query, scope } = req.body; // scope can be 'my' or 'all'

        if (!query || query.trim() === '') {
            return res.status(400).json({
                message: 'Please provide a query',
                response: 'Please ask me something about your publications!'
            });
        }

        let publications;
        let contextMessage = '';

        // Determine which publications to query based on scope
        if (scope === 'all') {
            // Check if user has permission to view all publications
            const User = require('../models/User');
            const user = await User.findById(req.userId);

            if (user.role === 'super_admin' || user.createdByAdmin) {
                // Fetch all publications
                publications = await Publication.find({}).lean();
                contextMessage = ' (searching across all faculty publications)';
            } else {
                // User doesn't have permission, fallback to own publications
                publications = await Publication.find({ userId: req.userId }).lean();
                contextMessage = ' (showing your publications only)';
            }
        } else {
            // Default to user's own publications
            publications = await Publication.find({ userId: req.userId }).lean();
            contextMessage = ' (showing your publications)';
        }

        // Process query using rule-based engine
        const result = await queryEngine.processQuery(query, publications);

        // Add context to the response
        let response = result.response;
        if (scope) {
            // Prepend context information for clarity
            const prefix = scope === 'all' ? '📚 **All Publications**: ' : '👤 **Your Publications**: ';
            response = prefix + result.response;
        }

        res.json({
            success: true,
            query: query,
            response: response,
            data: result.data,
            scope: scope || 'my',
            publicationsCount: publications.length,
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
