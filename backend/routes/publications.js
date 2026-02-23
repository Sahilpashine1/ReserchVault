const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Publication = require('../models/Publication');
const auth = require('../middleware/auth');
const { attachUser, requireRole } = require('../middleware/authorize');
const { logAction, logActivity } = require('../middleware/activityLogger');
const fileParser = require('../utils/fileParser');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'upload-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['.xlsx', '.xls', '.csv'];
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowedTypes.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error('Only Excel (.xlsx, .xls) and CSV files are allowed'));
        }
    },
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// @route   GET /api/publications
// @desc    Get publications based on user type
// @access  Private
router.get('/', auth, attachUser, async (req, res) => {
    try {
        const { sort, filter, search, own } = req.query;

        let query = {};

        // Access control based on user type:
        // 1. Self-registered users (createdByAdmin=false) - can ONLY see their own publications
        // 2. Admin-created users (createdByAdmin=true) - can see all publications OR filter to own
        // 3. Super admin - can see everything

        if (req.user.role === 'super_admin') {
            // Super admin sees all publications (unless filtering to own)
            if (own === 'true') {
                query.userId = req.userId;
            }
        } else if (req.user.createdByAdmin) {
            // Admin-created users can toggle between own and all publications
            if (own === 'true') {
                query.userId = req.userId;
            }
            // If own !== 'true', they see all publications
        } else {
            // Self-registered users can ONLY see their own publications
            query.userId = req.userId;
        }

        // Search functionality
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { authors: { $regex: search, $options: 'i' } },
                { keywords: { $regex: search, $options: 'i' } },
                { journalConference: { $regex: search, $options: 'i' } }
            ];
        }

        // Filter by year
        if (filter) {
            const filterObj = JSON.parse(filter);
            if (filterObj.year) {
                query.year = filterObj.year;
            }
        }

        // Sorting
        let sortOption = { createdDate: -1 }; // Default: newest first
        if (sort) {
            const sortObj = JSON.parse(sort);
            sortOption = sortObj;
        }

        const publications = await Publication.find(query)
            .sort(sortOption)
            .populate('userId', 'name email department');

        res.json({
            success: true,
            count: publications.length,
            publications: publications,
            userRole: req.user.role,
            currentUserId: req.userId,
            createdByAdmin: req.user.createdByAdmin // Frontend needs this to show/hide tabs
        });

    } catch (error) {
        console.error('Get publications error:', error);
        res.status(500).json({ message: 'Error fetching publications' });
    }
});

// @route   GET /api/publications/:id
// @desc    Get single publication (all can view any publication)
// @access  Private
router.get('/:id', auth, attachUser, async (req, res) => {
    try {
        // All users can view any publication
        const publication = await Publication.findOne({ _id: req.params.id })
            .populate('userId', 'name email department');

        if (!publication) {
            return res.status(404).json({ message: 'Publication not found' });
        }

        res.json({ success: true, data: publication });

    } catch (error) {
        console.error('Get publication error:', error);
        res.status(500).json({ message: 'Error fetching publication' });
    }
});

// @route   POST /api/publications
// @desc    Create new publication (all faculty can add)
// @access  Private
router.post('/', auth, attachUser, logAction('add', 'publication'), async (req, res) => {
    try {
        // All authenticated faculty can add publications

        const { title, authors, year, journalConference, keywords, abstract, publicationLink } = req.body;

        // Validation
        if (!title || !authors || !year || !journalConference || !keywords) {
            return res.status(400).json({
                message: 'Please provide all required fields: title, authors, year, journal/conference, keywords'
            });
        }

        const publication = new Publication({
            userId: req.userId,
            title,
            authors,
            year: parseInt(year),
            journalConference,
            keywords,
            abstract: abstract || '',
            publicationLink: publicationLink || ''
        });

        await publication.save();

        res.status(201).json({
            success: true,
            message: 'Publication added successfully',
            data: publication
        });

    } catch (error) {
        console.error('Create publication error:', error);
        res.status(500).json({ message: 'Error creating publication' });
    }
});

// @route   PUT /api/publications/:id
// @desc    Update publication (only own publications or super_admin)
// @access  Private
router.put('/:id', auth, attachUser, logAction('edit', 'publication'), async (req, res) => {
    try {
        let query = { _id: req.params.id };

        // Users can only edit their own publications (except super_admin)
        if (req.user.role !== 'super_admin') {
            query.userId = req.userId;
        }

        const publication = await Publication.findOne(query);

        if (!publication) {
            return res.status(404).json({ message: 'Publication not found' });
        }

        // Update fields
        const { title, authors, year, journalConference, keywords, abstract, publicationLink } = req.body;

        if (title) publication.title = title;
        if (authors) publication.authors = authors;
        if (year) publication.year = parseInt(year);
        if (journalConference) publication.journalConference = journalConference;
        if (keywords) publication.keywords = keywords;
        if (abstract !== undefined) publication.abstract = abstract;
        if (publicationLink !== undefined) publication.publicationLink = publicationLink;

        await publication.save();

        res.json({
            success: true,
            message: 'Publication updated successfully',
            data: publication
        });

    } catch (error) {
        console.error('Update publication error:', error);
        res.status(500).json({ message: 'Error updating publication' });
    }
});

// @route   DELETE /api/publications/:id
// @desc    Delete publication (only own publications or super_admin)
// @access  Private
router.delete('/:id', auth, attachUser, logAction('delete', 'publication'), async (req, res) => {
    try {
        let query = { _id: req.params.id };

        // Users can only delete their own publications (except super_admin)
        if (req.user.role !== 'super_admin') {
            query.userId = req.userId;
        }

        const publication = await Publication.findOne(query);

        if (!publication) {
            return res.status(404).json({ message: 'Publication not found' });
        }

        await Publication.deleteOne({ _id: req.params.id });

        res.json({
            success: true,
            message: 'Publication deleted successfully',
            data: publication // Return deleted publication for logging
        });

    } catch (error) {
        console.error('Delete publication error:', error);
        res.status(500).json({ message: 'Error deleting publication' });
    }
});

// @route   POST /api/publications/upload
// @desc    Upload Excel/CSV file and import publications
// @access  Private
router.post('/upload', auth, attachUser, upload.single('file'), logAction('upload', 'publication'), async (req, res) => {
    try {
        // All authenticated faculty can upload publications

        if (!req.file) {
            return res.status(400).json({ message: 'Please upload a file' });
        }

        // Parse the file
        const parseResult = fileParser.parseFile(req.file.path);

        if (!parseResult.success) {
            // Clean up uploaded file
            fs.unlinkSync(req.file.path);
            return res.status(400).json({
                message: 'Error parsing file',
                error: parseResult.error
            });
        }

        // Add userId to each publication
        const publicationsToInsert = parseResult.data.map(pub => ({
            ...pub,
            userId: req.userId
        }));

        // Insert valid publications
        let insertedCount = 0;
        if (publicationsToInsert.length > 0) {
            const inserted = await Publication.insertMany(publicationsToInsert);
            insertedCount = inserted.length;
        }

        // Clean up uploaded file
        fs.unlinkSync(req.file.path);

        res.json({
            success: true,
            message: `Successfully imported ${insertedCount} publications`,
            stats: {
                total: parseResult.total,
                valid: parseResult.valid,
                invalid: parseResult.invalid,
                inserted: insertedCount
            },
            errors: parseResult.errors
        });

    } catch (error) {
        console.error('Upload error:', error);
        // Clean up file if it exists
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ message: 'Error uploading file' });
    }
});

module.exports = router;
