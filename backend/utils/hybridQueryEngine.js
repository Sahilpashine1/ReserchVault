/**
 * Hybrid Query Engine — Faculty Publications Management System
 * ═══════════════════════════════════════════════════════════════
 * Architecture: Rule-Based Layer → AI Intent Detection (Groq LLaMA 3) → MongoDB Handler
 *
 * Layer 1: Keyword/pattern rules (no API call, instant)
 * Layer 2: Groq AI intent classification (only when no rule matches)
 * Handlers: MongoDB queries based on extracted intent
 * Memory:   In-process session Map (lastAuthor, lastResults, lastSelectedPaper)
 */

const Groq = require('groq-sdk');

const GROQ_MODEL = 'llama-3.1-8b-instant';

// ── Session memory store (in-process Map, keyed by sessionId) ───────────────
const sessionStore = new Map();

/**
 * Get or create a session record
 * @param {string} sessionId
 */
function getSession(sessionId) {
    if (!sessionStore.has(sessionId)) {
        sessionStore.set(sessionId, {
            lastAuthor: null,
            lastResults: [],
            lastSelectedPaper: null
        });
    }
    return sessionStore.get(sessionId);
}

/**
 * Update session fields
 * @param {string} sessionId
 * @param {object} updates
 */
function updateSession(sessionId, updates) {
    const session = getSession(sessionId);
    Object.assign(session, updates);
}

// ── Known domain/keyword list for FILTER_BY_DOMAIN rule ─────────────────────
const KNOWN_DOMAINS = [
    'ai', 'artificial intelligence', 'machine learning', 'ml', 'deep learning',
    'iot', 'internet of things', 'cloud', 'security', 'blockchain',
    'nlp', 'natural language processing', 'computer vision', 'robotics',
    'data science', 'big data', 'networking', 'embedded', 'healthcare',
    'image processing', 'neural network', 'fuzzy', 'optimization'
];

// ── Known indexing/type keywords for COMBINED_FILTER ────────────────────────
const KNOWN_TYPES = [
    'scopus', 'sci', 'ugc', 'web of science', 'wos', 'ieee', 'springer',
    'elsevier', 'wiley', 'acm', 'conference', 'journal', 'book chapter',
    'patent', 'international', 'national'
];

// ── Known department names & short codes ─────────────────────────────────────
const KNOWN_DEPARTMENTS = [
    { match: ['mechanical engineering', 'mechanical', 'mech'],          label: 'Mechanical Engineering' },
    { match: ['computer engineering', 'computer', 'cse', 'cs'],        label: 'Computer Engineering' },
    { match: ['electronics', 'e&tc', 'etc', 'entc', 'electronics and telecommunication', 'ece'], label: 'E&TC' },
    { match: ['information technology', 'it'],                          label: 'Information Technology' },
    { match: ['civil engineering', 'civil'],                            label: 'Civil Engineering' },
    { match: ['electrical engineering', 'electrical', 'eee'],          label: 'Electrical Engineering' },
    { match: ['ai & ds', 'aids', 'ai and data science', 'data science department', 'aids department'], label: 'AI & DS' },
    { match: ['first year', 'fy', 'basic science', 'applied science'], label: 'First Year Engineering' },
    { match: ['mba', 'management'],                                     label: 'MBA' },
    { match: ['mca'],                                                    label: 'MCA' }
];

/**
 * Find all canonical department labels for a raw query string.
 * Returns an array of matched department labels, or null if none found.
 */
function detectAllDepartments(q) {
    const matched = new Set();
    for (const dept of KNOWN_DEPARTMENTS) {
        // Only return the label once even if multiple aliases match
        for (const alias of dept.match) {
            // Use word boundary if it's a short alias like 'it' or 'cs'
            const isShort = alias.length <= 3;
            // Pad query with spaces to simulate word boundaries safely
            const paddedQ = ` ${q} `;
            if (isShort) {
                if (paddedQ.includes(` ${alias} `)) matched.add(dept.label);
            } else {
                if (q.includes(alias)) matched.add(dept.label);
            }
        }
    }
    return matched.size > 0 ? Array.from(matched) : null;
}

// ── Helper: extract multiple authors from a query string ───────────────────
// Handles: "papers of X and Y", "papers by X & Y", "X, Y and Z publications"
// Also strips trailing year / filter words so only names remain.
function extractAuthors(q) {
    // Try to extract the full author portion after key phrases
    const match = q.match(/(?:publications?\s+of|papers?\s+of|papers?\s+by|show\s+(?:publications?\s+)?(?:of|by))\s+(.+)/i);
    let rawNames = match ? match[1] : null;

    // Fallback: try "X and Y publications"
    if (!rawNames) {
        const m2 = q.match(/^(.+?)\s+publications?/i);
        rawNames = m2 ? m2[1] : null;
    }

    if (!rawNames) return null;

    // Remove trailing filter words like "in", "from", "on", year etc.
    rawNames = rawNames.replace(/\s+(in|from|on|related|about|during|after|before)\s+.*/i, '').trim();
    rawNames = rawNames.replace(/\b\d{4}\b.*/, '').trim();
    // Remove trailing domain/type keywords
    rawNames = rawNames.replace(/\s+(scopus|sci|ugc|ieee|journal|conference|paper|publication)s?\s*$/i, '').trim();

    // Normalize Oxford comma: "A, B, and C" → "A & B & C" for consistent splitting
    rawNames = rawNames.replace(/,\s*and\s+/gi, ' & ');
    rawNames = rawNames.replace(/,\s*or\s+/gi,  ' & ');
    rawNames = rawNames.replace(/,\s*/g,         ' & ');

    // Split by " and ", " or ", " & "
    const parts = rawNames
        .split(/\s+(?:and|or)\s+|\s*&\s*/i)
        .map(s => s.trim())
        .filter(s => s.length > 1);

    const stops = new Set(['the', 'all', 'my', 'latest', 'recent', 'new', 'old', 'show', 'give', 'list', 'get']);
    const authors = parts.filter(p => !stops.has(p.toLowerCase()));

    return authors.length > 0 ? authors : null;
}

// ═══════════════════════════════════════════════════════════════════════════
//  LAYER 1 — Rule-Based Intent Matching
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Try to match the query to a known rule.
 * Returns an intent object or null if no rule matches.
 *
 * @param {string} query  - raw user query (lowercased)
 * @param {object} session
 * @returns {{ intent, author, year, domain, title, latest } | null}
 */
function matchRule(query, session) {
    const q = query.toLowerCase().trim();

    // ── "my publications" / "show my" / "list my" ──
    if (/\bmy publications?\b/.test(q) || /\bshow my\b/.test(q) || /\blist my\b/.test(q) || q === 'my papers') {
        return { intent: 'GET_PUBLICATIONS', author: null, year: null, domain: null, title: null, latest: false, mine: true };
    }

    // ── "all publications" / "show all" ──
    if (/\ball publications?\b/.test(q) || /\bshow all\b/.test(q) || /\blist all\b/.test(q)) {
        return { intent: 'GET_PUBLICATIONS', author: null, year: null, domain: null, title: null, latest: false, mine: false };
    }

    // ── FILTER_BY_DEPARTMENT — "show mechanical publications" / "E&TC papers" ──
    {
        const depts = detectAllDepartments(q);
        if (depts) {
            // Check if query ALSO has a year → hand off to COMBINED_FILTER below
            const yearMatch = q.match(/\b(\d{4})\b/);
            const year = yearMatch && parseInt(yearMatch[1]) >= 1990 ? parseInt(yearMatch[1]) : null;
            if (!year) {
                // Pure department filter
                return { intent: 'FILTER_BY_DEPARTMENT', departments: depts, author: null, year: null, domain: null, type: null, title: null, latest: false };
            }
            // Has year too → fall through to COMBINED_FILTER block
        }
    }

    // ── COMBINED_FILTER — author + year + domain/type in one query ──────────
    // Matches things like:
    //   "publications of Dr. Patil in 2023 on AI"
    //   "Dr. Patil 2024 machine learning papers"
    //   "scopus papers by Sharma 2022"
    //   "papers by Mehta on iot from 2021"
    //   "papers of padmavati and arpita roy in 2023"
    {
        // Extract year
        const yearMatch = q.match(/\b(\d{4})\b/);
        const year = yearMatch && parseInt(yearMatch[1]) >= 1990 && parseInt(yearMatch[1]) <= new Date().getFullYear() + 1
            ? parseInt(yearMatch[1]) : null;

        // Extract author(s) — supports multiple authors via "and" / "&" / ","
        const authors = extractAuthors(q);
        // Use first author as primary; all are in the authors array
        const author = authors && authors.length > 0 ? authors[0] : null;

        // Extract domain
        const domain = KNOWN_DOMAINS.find(d => q.includes(d)) || null;

        // Extract type/indexing
        const type = KNOWN_TYPES.find(t => q.includes(t)) || null;

        // Extract department
        const depts = detectAllDepartments(q);

        // Count distinct filter dimensions present
        // Multiple authors (>1) count as a single "author" dimension, not multiple
        const filledCount = [
            authors && authors.length > 0,
            !!year,
            !!domain,
            !!type,
            depts && depts.length > 0
        ].filter(Boolean).length;

        if (filledCount >= 2) {
            return { intent: 'COMBINED_FILTER', author, authors, year, domain, type, departments: depts, title: null, latest: false };
        }
    }

    // ── "download latest" or "download latest of [author]" ──
    if (/\bdownload\b/.test(q) && /\blatest\b/.test(q)) {
        // Try to extract author from query, or fall back to lastAuthor
        const authorMatch = q.match(/\bof\s+(dr\.?\s+\w+|\w+\s+\w+)/i);
        const author = authorMatch ? authorMatch[1].trim() : session.lastAuthor;
        return { intent: 'DOWNLOAD_PUBLICATION', author, year: null, domain: null, title: null, latest: true };
    }

    // ── "download [title]" ──
    if (/\bdownload\b/.test(q)) {
        const titlePart = q.replace(/^download\s+/i, '').trim();
        // If very short (1 word) it's probably not a title — skip rule
        if (titlePart.length > 3) {
            return { intent: 'DOWNLOAD_PUBLICATION', author: null, year: null, domain: null, title: titlePart, latest: false };
        }
    }

    // ── "summarize" / "summary of" / "give summary" ──
    if (/\bsummariz(e|ation)\b/.test(q) || /\bsummary\s+(of|for)\b/.test(q) || /\bgive\s+summary\b/.test(q)) {
        // If query also has a year and mentions "publications" (plural) → treat as year overview
        const yearInSummary = q.match(/\b(\d{4})\b/);
        const mentionsPlural = /\bpublications?\b/.test(q) && !/\bpublication\s+titled\b/.test(q);
        if (yearInSummary && mentionsPlural) {
            return { intent: 'FILTER_BY_YEAR', author: null, year: parseInt(yearInSummary[1]), domain: null, title: null, latest: false };
        }
        // Extract the text after "of/for/summarize"
        const afterOf = q.match(/(?:summary\s+of|summarize|summary\s+for)\s+(.+)/i);
        let title = afterOf ? afterOf[1].trim() : null;
        // Strip trailing year if accidentally captured (e.g. "summary of paper 2024")
        if (title) title = title.replace(/\s*\b\d{4}\b\s*$/, '').trim() || null;

        // ── NEW: Detect if captured text is a person's name, not a paper title ──
        // A person's name: 1–4 words, no digits, no paper/publication keywords
        const paperKeywords = /\b(paper|publication|article|research|study|thesis|journal|conference|chapter)\b/i;
        if (title && !paperKeywords.test(title)) {
            const wordCount = title.trim().split(/\s+/).length;
            const hasDigits = /\d/.test(title);
            if (wordCount <= 4 && !hasDigits) {
                // Looks like an author name — fetch their publications instead
                return { intent: 'GET_PUBLICATIONS', author: title, authors: [title], year: null, domain: null, title: null, latest: false };
            }
        }

        return { intent: 'GET_SUMMARY', author: null, year: null, domain: null, title, latest: false };
    }

    // ── "publications of Dr. X" / "papers by X" / "papers of X and Y" ──
    const detectedAuthors = extractAuthors(q);
    if (detectedAuthors && detectedAuthors.length > 0 &&
        /(?:publications?\s+of|papers?\s+of|papers?\s+by|show\s+(?:publications?\s+)?(?:of|by))/i.test(q)) {
        return {
            intent: 'GET_PUBLICATIONS',
            author: detectedAuthors[0],
            authors: detectedAuthors,
            year: null, domain: null, title: null, latest: false
        };
    }

    // ── "from [year]" / "in [year]" / "year [year]" / "[4-digit year]" ──
    const yearMatch = q.match(/\b((?:from|in|year)\s+)?(\d{4})\b/);
    if (yearMatch && parseInt(yearMatch[2]) >= 1990 && parseInt(yearMatch[2]) <= new Date().getFullYear() + 1) {
        return { intent: 'FILTER_BY_YEAR', author: null, year: parseInt(yearMatch[2]), domain: null, title: null, latest: false };
    }

    // ── "latest" / "most recent" / "newest" ──
    if (/\b(latest|most\s+recent|newest|recent)\b/.test(q)) {
        // Check if there's also mention of a domain
        const domain = KNOWN_DOMAINS.find(d => q.includes(d));
        return { intent: 'GET_PUBLICATIONS', author: null, year: null, domain: domain || null, title: null, latest: true };
    }

    // ── FILTER_BY_DOMAIN — keyword in known domain list ──
    const matchedDomain = KNOWN_DOMAINS.find(d => {
        // Only trigger domain filter if the domain is a significant part of the query
        return q.includes(d) && q.split(' ').length <= 6;
    });
    if (matchedDomain) {
        return { intent: 'FILTER_BY_DOMAIN', author: null, year: null, domain: matchedDomain, title: null, latest: false };
    }

    // ── BARE NAME — user typed just a person's name (1–4 words, no digits, no stopwords) ──
    // e.g. "padmavati sarode", "Dr. Patil", "Arpita Roy"
    {
        const bareStops = new Set(['show', 'list', 'get', 'give', 'find', 'search', 'all', 'my',
            'latest', 'recent', 'new', 'old', 'the', 'and', 'or', 'of', 'by', 'in', 'from',
            'publication', 'publications', 'paper', 'papers', 'journal', 'conference']);
        const words = q.trim().split(/\s+/);
        const hasDigits = /\d/.test(q);
        const hasSpecialQuery = /[?!@#$%^&*()_+=\[\]{};:"<>,./\\|`~]/.test(q);
        const allWordsAreNameLike = words.every(w => !bareStops.has(w.toLowerCase()));
        // Strip honorifics before checking word count
        const nameWords = words.filter(w => !/^(dr|prof|mr|ms|mrs|sir)\.?$/i.test(w));
        if (!hasDigits && !hasSpecialQuery && nameWords.length >= 1 && nameWords.length <= 4 && allWordsAreNameLike) {
            // Treat the entire query as an author name
            const authorName = q.trim();
            return { intent: 'GET_PUBLICATIONS', author: authorName, authors: [authorName], year: null, domain: null, title: null, latest: false };
        }
    }

    return null; // No rule matched — fall through to AI
}

// ═══════════════════════════════════════════════════════════════════════════
//  LAYER 2 — AI Intent Classification via Groq
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Send the query to Groq LLaMA 3 for intent + entity extraction.
 * Returns an intent object — same shape as matchRule().
 *
 * @param {string} query
 * @param {object} session
 */
async function extractIntentWithAI(query, session) {
    if (!process.env.GROQ_API_KEY) {
        return { intent: 'GET_PUBLICATIONS', author: null, year: null, domain: null, title: null, latest: false };
    }

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const prompt = `Classify the following user query about faculty publications into exactly one of these intents:
GET_PUBLICATIONS, DOWNLOAD_PUBLICATION, FILTER_BY_YEAR, FILTER_BY_DOMAIN, GET_SUMMARY, COMBINED_FILTER

Use COMBINED_FILTER when the query combines 2 or more of: author name, year, domain/field, department, or publication type (e.g. "publications of Dr. Sharma in 2023 on AI" or "E&TC scopus papers").

Also extract these entities (use null if not present):
- author: person's name mentioned (e.g. "Dr. Patil")
- title: paper title mentioned
- year: a 4-digit year mentioned
- domain: research domain/field mentioned (e.g. "AI", "ML", "IoT")
- type: publication type/indexing mentioned (e.g. "Scopus", "journal", "conference", "SCI")
- departments: array of department names mentioned (e.g. ["Mechanical Engineering", "Computer Engineering"])
- latest: true if user wants the most recent/latest, false otherwise

Previous context:
- Last author searched: ${session.lastAuthor || 'none'}
- Last paper: ${session.lastSelectedPaper?.title || 'none'}

User Query: "${query}"

Return ONLY a valid JSON object like:
{"intent":"COMBINED_FILTER","author":"Dr. Sharma","year":2023,"domain":"AI","type":null,"title":null,"latest":false}`;

    try {
        const completion = await groq.chat.completions.create({
            model: GROQ_MODEL,
            messages: [
                { role: 'system', content: 'You are a JSON-only intent classifier. Always return valid JSON and nothing else.' },
                { role: 'user', content: prompt }
            ],
            temperature: 0,
            max_tokens: 150
        });

        const raw = completion.choices[0]?.message?.content?.trim();
        // Extract JSON even if model wraps it in markdown
        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            
            // If AI returned a single department string, convert to array
            let depts = null;
            if (parsed.department) {
                depts = Array.isArray(parsed.department) ? parsed.department : [parsed.department];
            } else if (parsed.departments) {
                depts = Array.isArray(parsed.departments) ? parsed.departments : [parsed.departments];
            }

            return {
                intent: parsed.intent || 'GET_PUBLICATIONS',
                // Do NOT fall back to session.lastAuthor — that causes wrong results
                // when the user types a new name or unrelated query.
                // lastAuthor is provided in the prompt as context only.
                author: parsed.author || null,
                authors: parsed.author ? [parsed.author] : null,
                year: parsed.year || null,
                domain: parsed.domain || null,
                type: parsed.type || null,
                departments: depts,
                title: parsed.title || null,
                latest: !!parsed.latest
            };
        }
    } catch (err) {
        console.error('❌ AI intent extraction error:', err.message);
    }

    // Fallback
    return { intent: 'GET_PUBLICATIONS', author: null, year: null, domain: null, title: null, latest: false };
}

// ═══════════════════════════════════════════════════════════════════════════
//  INTENT HANDLERS — MongoDB Query Executors
// ═══════════════════════════════════════════════════════════════════════════

/**
 * GET_PUBLICATIONS handler
 * Fetches publications from the pre-loaded array with optional filters.
 */
function handleGetPublications(intent, publications) {
    let results = [...publications];

    // Filter by author name — supports multiple authors (OR logic)
    //   Strategies: stripped substring, word-level match, full name match
    const authorList = intent.authors && intent.authors.length > 0 ? intent.authors
        : (intent.author ? [intent.author] : []);

    if (authorList.length > 0) {
        const stripHonorifics = s => s.replace(/\b(dr|prof|mr|ms|mrs|sir)\.?\s*/gi, '');

        results = results.filter(p => {
            const rawAuthors   = (p.authors    || '').toLowerCase();
            const fullName     = (p.authorName || '').toLowerCase();
            const strippedName = stripHonorifics(fullName);

            // Publication matches if it matches ANY of the queried authors (OR)
            return authorList.some(authorQuery => {
                const raw_q      = authorQuery.toLowerCase().trim();
                const stripped_q = stripHonorifics(raw_q).trim();
                // Split into individual words for partial / OR-word matching
                const words      = stripped_q.split(/\s+/).filter(w => w.length > 1);

                if (stripped_q && strippedName.includes(stripped_q)) return true;
                if (stripped_q && rawAuthors.includes(stripped_q))   return true;
                if (raw_q      && fullName.includes(raw_q))          return true;
                if (raw_q      && rawAuthors.includes(raw_q))        return true;
                // OR-word match: matches if ANY single word of the query matches
                // (handles "arpita roy" matching stored name "Arpita" or "Roy")
                if (words.length > 0 && words.some(w =>
                    strippedName.includes(w) || rawAuthors.includes(w)
                )) return true;
                return false;
            });
        });
    }

    // Filter by domain (keywords field)
    if (intent.domain) {
        const d = intent.domain.toLowerCase();
        results = results.filter(p => {
            const kw = (p.keywords || '').toLowerCase();
            const title = (p.title || '').toLowerCase();
            const abs = (p.abstract || '').toLowerCase();
            return kw.includes(d) || title.includes(d) || abs.includes(d);
        });
    }

    // Sort by year descending if "latest" or just sort consistently
    results.sort((a, b) => (b.year || 0) - (a.year || 0));

    // "latest" → return only the top N
    if (intent.latest) {
        results = results.slice(0, 5);
    }

    return results;
}

/**
 * COMBINED_FILTER handler
 * Applies any combination of: author, year, domain, type/indexing filters.
 */
function handleCombinedFilter(intent, publications) {
    let results = [...publications];

    // Author filter — supports multiple authors (OR logic)
    const authorListC = intent.authors && intent.authors.length > 0 ? intent.authors
        : (intent.author ? [intent.author] : []);

    if (authorListC.length > 0) {
        const stripHonorifics = s => s.replace(/\b(dr|prof|mr|ms|mrs|sir)\.?\s*/gi, '');

        results = results.filter(p => {
            const rawAuthors   = (p.authors    || '').toLowerCase();
            const fullName     = (p.authorName || '').toLowerCase();
            const strippedName = stripHonorifics(fullName);

            return authorListC.some(authorQuery => {
                const raw_q      = authorQuery.toLowerCase().trim();
                const stripped_q = stripHonorifics(raw_q).trim();
                const words      = stripped_q.split(/\s+/).filter(w => w.length > 1);

                if (stripped_q && strippedName.includes(stripped_q)) return true;
                if (stripped_q && rawAuthors.includes(stripped_q))   return true;
                if (raw_q      && fullName.includes(raw_q))          return true;
                if (raw_q      && rawAuthors.includes(raw_q))        return true;
                // OR-word match: any single word of the query matching is enough
                if (words.length > 0 && words.some(w =>
                    strippedName.includes(w) || rawAuthors.includes(w)
                )) return true;
                return false;
            });
        });
    }

    // Year filter
    if (intent.year) {
        results = results.filter(p => p.year === intent.year);
    }

    // Domain filter (keywords / title / abstract)
    if (intent.domain) {
        const d = intent.domain.toLowerCase();
        results = results.filter(p => {
            const kw    = (p.keywords || '').toLowerCase();
            const title = (p.title    || '').toLowerCase();
            const abs   = (p.abstract || '').toLowerCase();
            return kw.includes(d) || title.includes(d) || abs.includes(d);
        });
    }

    // Type / indexing filter
    if (intent.type) {
        const t = intent.type.toLowerCase();
        results = results.filter(p => {
            const indexing = (p.indexing         || '').toLowerCase();
            const jc       = (p.journalConference|| '').toLowerCase();
            const status   = (p.status           || '').toLowerCase();
            return indexing.includes(t) || jc.includes(t) || status.includes(t);
        });
    }

    // Department filter (OR logic if multiple)
    if (intent.departments && intent.departments.length > 0) {
        results = results.filter(p => {
            const pubDept = (p.department || '').toLowerCase();
            // Match if it includes ANY of the intent departments
            return intent.departments.some(d => pubDept.includes(d.toLowerCase()));
        });
    }

    // Sort by year descending
    results.sort((a, b) => (b.year || 0) - (a.year || 0));
    return results;
}

/**
 * FILTER_BY_DEPARTMENT handler
 * Returns all publications belonging to one or more specific departments (OR logic).
 */
function handleFilterByDepartment(intent, publications) {
    if (!intent.departments || intent.departments.length === 0) return [];

    let results = publications.filter(p => {
        const pubDept = (p.department || '').toLowerCase();
        return intent.departments.some(d => pubDept.includes(d.toLowerCase()));
    });
    
    results.sort((a, b) => (b.year || 0) - (a.year || 0));
    return results;
}

/**
 * FILTER_BY_YEAR handler
 */
function handleFilterByYear(intent, publications) {
    let results = publications.filter(p => p.year === intent.year);
    results.sort((a, b) => (b.year || 0) - (a.year || 0));
    return results;
}

/**
 * FILTER_BY_DOMAIN handler
 */
function handleFilterByDomain(intent, publications) {
    const d = (intent.domain || '').toLowerCase();
    let results = publications.filter(p => {
        const kw = (p.keywords || '').toLowerCase();
        const title = (p.title || '').toLowerCase();
        const abs = (p.abstract || '').toLowerCase();
        return kw.includes(d) || title.includes(d) || abs.includes(d);
    });
    results.sort((a, b) => (b.year || 0) - (a.year || 0));
    return results;
}

/**
 * GENERATE OVERVIEW — AI summary of a collection of publications
 * Sends title + journal list to Groq and gets a 3-4 sentence collective overview.
 * Runs in parallel with the table response (non-blocking).
 *
 * @param {Array}  publications  - The publications to summarise
 * @param {string} label         - e.g. "2024 publications", "AI papers"
 * @returns {string|null}        - Overview text or null on failure
 */
async function generateOverview(publications, label) {
    if (!process.env.GROQ_API_KEY || publications.length === 0) return null;

    try {
        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

        // Build a compact list of papers (max 10 to keep prompt small)
        const sample = publications.slice(0, 10);
        const paperList = sample.map((p, i) => {
            const parts = [`${i + 1}. "${p.title}"`];
            if (p.journalConference) parts.push(`(${p.journalConference})`);
            if (p.keywords) parts.push(`[${p.keywords}]`);
            return parts.join(' ');
        }).join('\n');

        const completion = await groq.chat.completions.create({
            model: GROQ_MODEL,
            messages: [
                {
                    role: 'system',
                    content: 'You are an academic research analyst. Provide concise, insightful overviews of research collections.'
                },
                {
                    role: 'user',
                    content: `Here are ${publications.length} ${label}:\n\n${paperList}\n\nWrite a 3-4 sentence overview describing the key research themes, domains, and contributions represented in this collection. Be specific and informative.`
                }
            ],
            temperature: 0.4,
            max_tokens: 250
        });

        return completion.choices[0]?.message?.content?.trim() || null;
    } catch (err) {
        console.error('❌ Overview generation error:', err.message);
        return null;
    }
}

/**
 * DOWNLOAD_PUBLICATION handler
 * Finds the best matching publication and returns its link.
 */
function handleDownload(intent, publications, session) {
    let candidates = [...publications];

    // Filter by author if known
    const author = intent.author || session.lastAuthor;
    if (author) {
        const a = author.toLowerCase().replace(/dr\.?\s*/i, '').trim();
        const byAuthor = candidates.filter(p => (p.authors || p.authorName || '').toLowerCase().includes(a));
        if (byAuthor.length > 0) candidates = byAuthor;
    }

    // Filter by title fuzzy match
    if (intent.title) {
        const t = intent.title.toLowerCase();
        const byTitle = candidates.filter(p => (p.title || '').toLowerCase().includes(t));
        if (byTitle.length > 0) candidates = byTitle;
    }

    // Sort by year descending → pick latest
    candidates.sort((a, b) => (b.year || 0) - (a.year || 0));
    const pub = candidates[0];

    if (!pub) return null;
    return pub;
}

/**
 * GET_SUMMARY handler
 * Finds the best matching paper and generates an AI summary.
 * Works even without an abstract — falls back to title + keywords + journal context.
 */
async function handleGetSummary(intent, publications, session) {
    let candidates = [...publications];

    // Try to find by title (partial match)
    if (intent.title) {
        const t = intent.title.toLowerCase();
        const byTitle = candidates.filter(p => (p.title || '').toLowerCase().includes(t));
        if (byTitle.length > 0) {
            candidates = byTitle;
        } else {
            // Title was explicitly given but found no match — do NOT fall back to lastSelectedPaper
            return { pub: null, summary: null, noMatch: true, searchedTitle: intent.title };
        }
    } else if (!intent.title && session.lastSelectedPaper) {
        // No title given, re-summarize the last paper the user was looking at
        candidates = [session.lastSelectedPaper];
    } else {
        // No title, no last paper — use most recent publication
        candidates.sort((a, b) => (b.year || 0) - (a.year || 0));
        candidates = candidates.slice(0, 1);
    }

    const pub = candidates[0];
    if (!pub) return { pub: null, summary: null };

    // Build context for Groq — use abstract if available, otherwise use metadata
    const abstract = pub.abstract?.trim();
    const hasAbstract = abstract && abstract.length >= 20;

    // If no Groq key, return abstract or a simple metadata string
    if (!process.env.GROQ_API_KEY) {
        return {
            pub,
            summary: hasAbstract
                ? abstract
                : `This paper titled "${pub.title}" was published in ${pub.year || 'N/A'} in ${pub.journalConference || 'a journal/conference'}. Keywords: ${pub.keywords || 'N/A'}.`
        };
    }

    try {
        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

        // Build the richest context we have
        let context = `Title: ${pub.title}\n`;
        context += `Year: ${pub.year || 'N/A'}\n`;
        context += `Authors: ${pub.authors || pub.authorName || 'N/A'}\n`;
        context += `Published in: ${pub.journalConference || 'N/A'}\n`;
        if (pub.keywords) context += `Keywords: ${pub.keywords}\n`;
        if (hasAbstract) context += `Abstract: ${abstract}\n`;

        const userPrompt = hasAbstract
            ? `Summarize this academic paper in 4-5 clear, simple, and human-friendly sentences. Avoid jargon.\n\n${context}`
            : `Based on the following publication metadata, write a 4-5 sentence description of what this research paper is likely about. Make it clear, informative, and easy to understand.\n\n${context}`;

        const completion = await groq.chat.completions.create({
            model: GROQ_MODEL,
            messages: [
                {
                    role: 'system',
                    content: 'You are an academic assistant who explains research papers in simple, human-friendly language.'
                },
                { role: 'user', content: userPrompt }
            ],
            temperature: 0.5,
            max_tokens: 350
        });

        const summary = completion.choices[0]?.message?.content?.trim();
        return { pub, summary: summary || (hasAbstract ? abstract : null) };

    } catch (err) {
        console.error('❌ Summary generation error:', err.message);
        return { pub, summary: hasAbstract ? abstract : null };
    }
}

// ═══════════════════════════════════════════════════════════════════════════
//  MAIN ENTRY POINT
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Process a chatbot query using the hybrid rule-based + AI engine.
 *
 * @param {string} query          - User's raw query
 * @param {Array}  publications   - Publications from MongoDB (plain objects)
 * @param {string} sessionId      - Unique session ID for context memory
 * @param {object} userContext    - { userId, userName }
 * @param {string} scope          - 'my' | 'all'
 * @returns {object} { type, publications, response, downloadUrl, title }
 */
async function processQuery(query, publications, sessionId, userContext, scope) {
    const session = getSession(sessionId);
    const q = query.trim();

    // ── Step 1: Try rule-based matching ──────────────────────────────────
    let intentObj = matchRule(q, session);
    let usedAI = false;

    // ── Step 2: Fallback to AI intent extraction ──────────────────────────
    if (!intentObj) {
        intentObj = await extractIntentWithAI(q, session);
        usedAI = true;
    }

    // If intent says mine:true and scope is 'all', respect scope over intent
    // (the chatbot route already pre-filters publications by scope)

    // Update session memory if author was identified
    if (intentObj.author) {
        updateSession(sessionId, { lastAuthor: intentObj.author });
    }

    // ── Step 3: Execute the intent handler ───────────────────────────────
    switch (intentObj.intent) {

        // ── COMBINED_FILTER ──────────────────────────────────────────────
        case 'COMBINED_FILTER': {
            const results = handleCombinedFilter(intentObj, publications);
            updateSession(sessionId, { lastResults: results });

            // Build a human-readable label from the active filters
            const parts = [];
            // Show all authors when multiple are present
            if (intentObj.authors && intentObj.authors.length > 1) {
                parts.push(`by **${intentObj.authors.join('** and **')}**`);
            } else if (intentObj.author) {
                parts.push(`by **${intentObj.author}**`);
            }
            if (intentObj.year)       parts.push(`from **${intentObj.year}**`);
            if (intentObj.domain)     parts.push(`in **${intentObj.domain}**`);
            if (intentObj.type)       parts.push(`of type **${intentObj.type}**`);
            if (intentObj.departments && intentObj.departments.length > 0) {
                const deptsLabel = intentObj.departments.join(' or ');
                parts.push(`from **${deptsLabel}** dept`);
            }
            const filterLabel = parts.join(', ');

            if (results.length === 0) {
                return {
                    type: 'text',
                    publications: [],
                    response: `No publications found ${filterLabel}. Try relaxing one of the filters, or ask "Show all publications".`
                };
            }

            const overviewC = await generateOverview(results, `publications ${filterLabel}`);

            return {
                type: 'table',
                publications: results,
                response: `Found **${results.length}** publication(s) ${filterLabel}:`,
                label: `Publications ${filterLabel}`,
                overviewText: overviewC || null
            };
        }

        // ── FILTER_BY_DEPARTMENT ─────────────────────────────────────────
        case 'FILTER_BY_DEPARTMENT': {
            const results = handleFilterByDepartment(intentObj, publications);
            updateSession(sessionId, { lastResults: results });

            const deptsLabel = (intentObj.departments || []).join(' and ');

            if (results.length === 0) {
                return {
                    type: 'text',
                    publications: [],
                    response: `No publications found for **${deptsLabel}**. Make sure scope is set to "All" or try another department name.`
                };
            }

            const overviewDept = await generateOverview(results, `${deptsLabel} department publications`);

            return {
                type: 'table',
                publications: results,
                response: `Found **${results.length}** publication(s) from **${deptsLabel}**:`,
                label: `${deptsLabel} Publications`,
                overviewText: overviewDept || null
            };
        }

        // ── GET_PUBLICATIONS ─────────────────────────────────────────────
        case 'GET_PUBLICATIONS': {
            const results = handleGetPublications(intentObj, publications);
            updateSession(sessionId, { lastResults: results });

            if (results.length === 0) {
                const authorDisplay = intentObj.authors && intentObj.authors.length > 1
                    ? intentObj.authors.join(' and ')
                    : intentObj.author;
                const suggestion = authorDisplay
                    ? `No publications found for **${authorDisplay}**. Try checking the name spelling, or ask "Show all publications".`
                    : `No publications found matching your query. Try asking "What are my publications?" or "Show all publications".`;
                return { type: 'text', publications: [], response: suggestion };
            }

            let label = 'Publications';
            if (intentObj.authors && intentObj.authors.length > 1) label = `Publications by ${intentObj.authors.join(' and ')}`;
            else if (intentObj.author) label = `Publications by ${intentObj.author}`;
            else if (intentObj.domain) label = `Publications in ${intentObj.domain}`;
            else if (intentObj.latest) label = 'Latest Publications';
            else if (scope === 'my') label = `My Publications`;

            // Generate collection overview via AI
            const overview1 = await generateOverview(results, label);

            return {
                type: 'table',
                publications: results,
                response: `Found **${results.length}** ${label}:`,
                label,
                overviewText: overview1 || null
            };
        }

        // ── FILTER_BY_YEAR ─────────────────────────────────────────────
        case 'FILTER_BY_YEAR': {
            const results = handleFilterByYear(intentObj, publications);
            updateSession(sessionId, { lastResults: results });

            if (results.length === 0) {
                return {
                    type: 'text',
                    publications: [],
                    response: `No publications found for year **${intentObj.year}**. Try another year or ask "Show all publications".`
                };
            }

            // Generate collection overview via AI
            const overview2 = await generateOverview(results, `${intentObj.year} publications`);

            return {
                type: 'table',
                publications: results,
                response: `Found **${results.length}** publication(s) from **${intentObj.year}**:`,
                label: `Publications (${intentObj.year})`,
                overviewText: overview2 || null
            };
        }

        // ── FILTER_BY_DOMAIN ──────────────────────────────────────────
        case 'FILTER_BY_DOMAIN': {
            const results = handleFilterByDomain(intentObj, publications);
            updateSession(sessionId, { lastResults: results });

            if (results.length === 0) {
                return {
                    type: 'text',
                    publications: [],
                    response: `No publications found in the **${intentObj.domain}** domain. Try a different keyword or ask "Show all publications".`
                };
            }

            // Generate collection overview via AI
            const overview3 = await generateOverview(results, `${intentObj.domain} publications`);

            return {
                type: 'table',
                publications: results,
                response: `Found **${results.length}** publication(s) in **${intentObj.domain}**:`,
                label: `${intentObj.domain} Publications`,
                overviewText: overview3 || null
            };
        }

        // ── DOWNLOAD_PUBLICATION ─────────────────────────────────────
        case 'DOWNLOAD_PUBLICATION': {
            const pub = handleDownload(intentObj, publications, session);

            if (!pub) {
                return {
                    type: 'text',
                    publications: [],
                    response: `I couldn't find a matching publication to download. Try specifying the title or author name.`
                };
            }

            updateSession(sessionId, { lastSelectedPaper: pub });

            if (!pub.publicationLink || pub.publicationLink.trim() === '') {
                return {
                    type: 'text',
                    publications: [],
                    response: `Found **"${pub.title}"** (${pub.year}), but no download link is available for this publication.`
                };
            }

            return {
                type: 'download',
                publications: [pub],
                response: `Here is the download link for **"${pub.title}"**:`,
                downloadUrl: pub.publicationLink,
                title: pub.title
            };
        }

        // ── GET_SUMMARY ───────────────────────────────────────────────
        case 'GET_SUMMARY': {
            const summaryResult = await handleGetSummary(intentObj, publications, session);

            // Title was given but no paper matched — give a clear error
            if (summaryResult.noMatch) {
                const searched = summaryResult.searchedTitle;
                return {
                    type: 'text',
                    publications: [],
                    response: `I couldn't find a paper matching **"${searched}"**. Try using part of the exact title, e.g. "Summarize SmartLexicon" or "Summarize AR Chess".`
                };
            }

            const { pub, summary } = summaryResult;

            if (!pub) {
                return {
                    type: 'text',
                    publications: [],
                    response: `I couldn't find a publication to summarize. Try: **"Summarize [paper title]"** e.g. "Summarize SmartLexicon"`
                };
            }

            updateSession(sessionId, { lastSelectedPaper: pub });

            if (!summary) {
                return {
                    type: 'text',
                    publications: [],
                    response: `Found **"${pub.title}"**, but couldn't generate a summary at this time. Please try again.`
                };
            }

            return {
                type: 'summary',
                publications: [pub],
                response: summary,
                title: pub.title,
                year: pub.year,
                authors: pub.authors || pub.authorName || ''
            };
        }

        default:
            return {
                type: 'text',
                publications: [],
                response: `I'm not sure what you're looking for. Try asking:\n• "What are my publications?"\n• "Show papers from 2023"\n• "Summarize [paper title]"\n• "Download latest publication"`
            };
    }
}

module.exports = { processQuery, getSession, updateSession };
