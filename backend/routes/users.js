const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Publication = require('../models/Publication');
const auth = require('../middleware/auth');
const { attachUser } = require('../middleware/authorize');

// @route   GET /api/users/search?q=query
// @desc    Search all faculty members (any logged-in user)
// @access  Private
router.get('/search', auth, attachUser, async (req, res) => {
    try {
        const { q = '' } = req.query;

        let query = { isActive: true };

        if (q.trim()) {
            const regex = { $regex: q.trim(), $options: 'i' };
            query.$or = [
                { name: regex },
                { email: regex },
                { department: regex }
            ];
        }

        const users = await User.find(query)
            .select('name email department role createdAt profilePicture')
            .sort({ name: 1 })
            .limit(50);

        // Get publication count for each user
        const results = await Promise.all(users.map(async (u) => {
            const count = await Publication.countDocuments({ userId: u._id });
            return {
                id: u._id,
                name: u.name,
                email: u.email,
                department: u.department || 'Not specified',
                role: u.role,
                publicationCount: count,
                memberSince: u.createdAt,
                profilePicture: u.profilePicture || ''
            };
        }));

        res.json({ success: true, count: results.length, data: results });

    } catch (error) {
        console.error('User search error:', error);
        res.status(500).json({ message: 'Error searching users' });
    }
});

// @route   GET /api/users/:id/profile
// @desc    Get a user's public profile
// @access  Private (any logged-in user)
router.get('/:id/profile', auth, attachUser, async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
            .select('name email department bio profilePicture role createdAt designation specialization yearsOfExperience education googleScholar orcid website scholarUrl orcidId personalWebsite');
        if (!user || !user.isActive) {
            return res.status(404).json({ message: 'User not found' });
        }

        const publicationCount = await Publication.countDocuments({ userId: user._id });

        res.json({
            success: true,
            data: {
                id: user._id,
                name: user.name,
                email: user.email,
                department: user.department || 'Not specified',
                bio: user.bio || '',
                profilePicture: user.profilePicture || '',
                role: user.role,
                publicationCount,
                memberSince: user.createdAt,
                // Academic fields
                designation: user.designation || '',
                specialization: user.specialization || '',
                yearsOfExperience: user.yearsOfExperience,
                education: user.education || '',
                googleScholar: user.googleScholar || user.scholarUrl || '',
                orcid: user.orcid || user.orcidId || '',
                website: user.website || user.personalWebsite || ''
            }
        });
    } catch (error) {
        console.error('Get user profile error:', error);
        res.status(500).json({ message: 'Error fetching profile' });
    }
});

// @route   GET /api/users/:id/publications
// @desc    Get all publications of a specific user (read-only view)
// @access  Private (any logged-in user)
router.get('/:id/publications', auth, attachUser, async (req, res) => {
    try {
        const { search, year } = req.query;

        // Verify user exists
        const user = await User.findById(req.params.id).select('name department');
        if (!user) return res.status(404).json({ message: 'User not found' });

        let query = { userId: req.params.id };
        if (year) query.year = parseInt(year);
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { journalConference: { $regex: search, $options: 'i' } },
                { keywords: { $regex: search, $options: 'i' } }
            ];
        }

        const publications = await Publication.find(query)
            .sort({ year: -1, createdDate: -1 });

        res.json({
            success: true,
            count: publications.length,
            user: { name: user.name, department: user.department },
            publications
        });
    } catch (error) {
        console.error('Get user publications error:', error);
        res.status(500).json({ message: 'Error fetching publications' });
    }
});

module.exports = router;
