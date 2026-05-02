/**
 * Chatbot Routes — Hybrid AI + Rule-Based Engine
 * ─────────────────────────────────────────────────────────────────────────────
 * Layer 1: Rule-based keyword matching (instant, no API call)
 * Layer 2: Groq LLaMA 3 intent classification (only when no rule matches)
 * Session: In-process context memory (lastAuthor, lastResults, lastSelectedPaper)
 * Output:  Structured responses with type field (table | download | summary | text)
 */

const express = require('express');
const router = express.Router();
const Publication = require('../models/Publication');
const User = require('../models/User');
const auth = require('../middleware/auth');
const hybridEngine = require('../utils/hybridQueryEngine');

// @route   POST /api/chatbot/query
// @desc    Process chatbot query using hybrid rule-based + AI engine
// @access  Private
router.post('/query', auth, async (req, res) => {
    try {
        const { query, scope, sessionId } = req.body;

        if (!query || query.trim() === '') {
            return res.status(400).json({
                message: 'Please provide a query',
                response: 'Please ask me something about the publications!',
                type: 'text'
            });
        }

        // Ensure we have a sessionId for context memory
        const sid = sessionId || `${req.userId}_${Date.now()}`;

        // ── Fetch publications based on scope ─────────────────────────────────
        // scope='all' → all publications (enriched with user names from User model)
        // scope='my'  → only the logged-in user's publications
        let publications;
        if (scope === 'all') {
            publications = await Publication.find({}).lean();

            const userIds = [...new Set(publications.map(p => p.userId?.toString()).filter(Boolean))];
            const users = await User.find({ _id: { $in: userIds } }).select('_id name department').lean();
            const userMap = {};
            users.forEach(u => { userMap[u._id.toString()] = u; });

            publications = publications.map(p => {
                const user = userMap[p.userId?.toString()];
                return {
                    ...p,
                    authorName: user?.name || p.authors || 'Unknown',
                    authors: p.authors || user?.name || 'Unknown',
                    department: p.department || user?.department || ''
                };
            });
        } else {
            const currentUser = await User.findById(req.userId).select('name department').lean();
            publications = await Publication.find({ userId: req.userId }).lean();
            publications = publications.map(p => ({
                ...p,
                authorName: currentUser?.name || p.authors || 'Unknown',
                authors: p.authors || currentUser?.name || 'Unknown'
            }));
        }

        // ── Deduplicate by title+year, but MERGE authorNames from all copies ───
        // (Same paper may be uploaded by multiple users; keep all uploader names
        //  so that searching by any uploader's name finds the paper.)
        const dedupMap = new Map();
        publications.forEach(p => {
            const key = `${(p.title || '').toLowerCase().trim()}__${p.year || ''}`;
            if (dedupMap.has(key)) {
                const existing = dedupMap.get(key);
                // Append new authorName if not already included
                const newName = (p.authorName || '').trim();
                if (newName && !existing.authorName.toLowerCase().includes(newName.toLowerCase())) {
                    existing.authorName = `${existing.authorName}, ${newName}`;
                }
            } else {
                dedupMap.set(key, { ...p });
            }
        });
        publications = [...dedupMap.values()];

        // ── Run the hybrid query engine ───────────────────────────────────
        const userContext = { userId: req.userId };
        const result = await hybridEngine.processQuery(query, publications, sid, userContext, scope || 'my');

        // ── Shape the response for the frontend ───────────────────────────
        // Sanitise publications to only send what the UI needs
        const sanitisedPubs = (result.publications || []).map(p => ({
            _id: p._id,
            title: p.title,
            authors: p.authors || p.authorName || '',
            year: p.year,
            journalConference: p.journalConference || '',
            indexing: p.indexing || '',
            keywords: p.keywords || '',
            publicationLink: p.publicationLink || '',
            abstract: p.abstract || '',
            status: p.status || 'published'
        }));

        return res.json({
            success: true,
            query,
            type: result.type,               // 'table' | 'download' | 'summary' | 'text'
            response: result.response,
            publications: sanitisedPubs,
            downloadUrl: result.downloadUrl || null,
            title: result.title || null,
            year: result.year || null,
            authors: result.authors || null,
            label: result.label || null,
            overviewText: result.overviewText || null,   // ← AI overview for table responses
            sessionId: sid,
            scope: scope || 'my',
            publicationsCount: publications.length,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Chatbot query error:', error);
        res.status(500).json({
            message: 'Error processing query',
            type: 'text',
            response: 'Sorry, I encountered an error. Please try again.'
        });
    }
});

// @route   GET /api/chatbot/citation-search
// @desc    Search Semantic Scholar for real citation count of a paper
// @access  Private
router.get('/citation-search', auth, async (req, res) => {
    try {
        const { title } = req.query;
        if (!title) return res.status(400).json({ message: 'Title is required' });

        let fetchFn;
        try {
            fetchFn = require('node-fetch');
        } catch (e) {
            const https = require('https');
            fetchFn = (url, opts) => new Promise((resolve, reject) => {
                https.get(url, { headers: (opts && opts.headers) || {} }, (resp) => {
                    let data = '';
                    resp.on('data', chunk => data += chunk);
                    resp.on('end', () => resolve({
                        ok: resp.statusCode < 400,
                        json: () => Promise.resolve(JSON.parse(data))
                    }));
                }).on('error', reject);
            });
        }

        const encodedTitle = encodeURIComponent(title.trim());
        const url = `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodedTitle}&fields=title,year,citationCount,authors,venue,externalIds&limit=5`;

        const response = await fetchFn(url, {
            headers: { 'User-Agent': 'ResearchVault/1.0' }
        });

        if (!response.ok) {
            return res.json({ success: false, message: 'Semantic Scholar API unavailable', data: [] });
        }

        const data = await response.json();
        const papers = (data.data || []).map(p => ({
            title: p.title,
            year: p.year,
            citationCount: p.citationCount || 0,
            venue: p.venue || 'N/A',
            authors: (p.authors || []).map(a => a.name).join(', '),
            doi: (p.externalIds && p.externalIds.DOI) || null,
            semanticScholarId: p.paperId,
            scholarUrl: p.paperId ? `https://www.semanticscholar.org/paper/${p.paperId}` : null
        }));

        res.json({ success: true, query: title, totalFound: data.total || 0, data: papers });

    } catch (error) {
        console.error('Citation search error:', error.message);
        res.json({ success: false, message: 'Citation lookup failed — check internet connection', data: [] });
    }
});

// @route   GET /api/chatbot/suggestions
// @desc    Get suggested queries for the chatbot
// @access  Private
router.get('/suggestions', auth, async (req, res) => {
    try {
        const suggestions = [
            { text: 'What are my publications?', category: 'My Papers' },
            { text: 'Show latest publications', category: 'Latest' },
            { text: 'Give publications from 2023', category: 'By Year' },
            { text: 'Show AI papers', category: 'By Domain' },
            { text: 'Summarize my latest paper', category: 'Summary' },
            { text: 'Download latest publication', category: 'Download' },
            { text: 'Show all publications', category: 'All Papers' },
            { text: 'How many publications do I have?', category: 'Count' },
            { text: 'Publications of Dr. Patil in 2023 on AI', category: 'Combined' },
            { text: 'Scopus papers by Sharma 2022', category: 'Combined' },
            { text: 'Show Mechanical Engineering publications', category: 'Department' },
            { text: 'E&TC papers 2024', category: 'Department' },
            { text: 'Computer Engineering scopus papers', category: 'Department' }
        ];
        res.json({ success: true, suggestions });
    } catch (error) {
        console.error('Get suggestions error:', error);
        res.status(500).json({ message: 'Error fetching suggestions' });
    }
});

module.exports = router;
