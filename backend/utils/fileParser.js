const XLSX = require('xlsx');

/**
 * Parse Excel/CSV files and extract publication data
 * Supports:
 *   1. Institutional format (GHIRCEM/Raisoni style) - header at row 15, long column names
 *   2. Simple format - header at row 1, short column names
 */
class FileParser {
    parseFile(filePath) {
        try {
            const workbook = XLSX.readFile(filePath);
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];

            // Get all rows as array of arrays (no header inference)
            const allRows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

            if (allRows.length === 0) throw new Error('File is empty');

            // ── Find the header row ──────────────────────────────────────────
            // It's the row that contains "SN" or "Title" or "Name of the author"
            let headerRowIndex = -1;
            for (let i = 0; i < Math.min(allRows.length, 30); i++) {
                const row = allRows[i];
                const rowStr = row.map(c => String(c || '').toLowerCase()).join(' ');
                if (
                    rowStr.includes('title of paper') ||
                    rowStr.includes('name of the author') ||
                    (rowStr.includes('title') && rowStr.includes('author') && rowStr.includes('year'))
                ) {
                    headerRowIndex = i;
                    break;
                }
            }

            // Fallback: if not found, treat row 0 as header
            if (headerRowIndex === -1) headerRowIndex = 0;

            const headerRow = allRows[headerRowIndex].map(c => String(c || '').trim().toLowerCase());
            const dataRows = allRows.slice(headerRowIndex + 1);

            // ── Column mapping: match header strings to schema fields ─────────
            const fieldMappings = {
                sn: ['sn', 'sr', 'sr.', 'sr no', 's.no', 'serial'],
                authors: ['name of the author', 'author', 'name of author', 'written by'],
                department: ['department', 'dept'],
                title: ['title of paper', 'title', 'paper title', 'publication title'],
                journalConference: ['name of the journal', 'journal', 'conference', 'journal/conference', 'venue', 'published in'],
                monthYear: ['month and year', 'month & year', 'month year', 'month/year'],
                year: ['year', 'publication year', 'year published'],
                volumeIssuePageNo: ['volumn, issue', 'volume, issue', 'vol', 'volume issue', 'volume,issue'],
                issnIsbn: ['issn', 'isbn', 'issn/ isbn', 'issn/isbn'],
                publicationLink: ['link of the article', 'link', 'url', 'doi', 'article link'],
                indexing: ['indexing in sci', 'indexing', 'index', 'indexed in'],
                collaborationType: ['collaboration with', 'collaboration type', 'collaborat'],
                collaborativeInstitution: ['name of the collaborative', 'collaborative institution', 'institution name'],
                keywords: ['keywords', 'keyword', 'tags'],
                abstract: ['abstract', 'summary'],
            };

            // Build index: fieldName -> columnIndex
            const colIndex = {};
            for (const [field, patterns] of Object.entries(fieldMappings)) {
                for (let col = 0; col < headerRow.length; col++) {
                    const h = headerRow[col];
                    if (patterns.some(p => h.includes(p))) {
                        if (colIndex[field] === undefined) colIndex[field] = col;
                    }
                }
            }

            // ── Parse data rows ───────────────────────────────────────────────
            const publications = [];
            const errors = [];

            dataRows.forEach((row, i) => {
                // Skip empty rows (all cells empty or just a number in col 0)
                const nonEmpty = row.filter(c => String(c || '').trim() !== '');
                if (nonEmpty.length <= 1) return;

                const get = (field) => {
                    const idx = colIndex[field];
                    if (idx === undefined) return '';
                    return String(row[idx] || '').trim();
                };

                // Title is required — skip row if missing
                const title = get('title');
                if (!title || title === '') return;

                const authors = get('authors');

                // Parse year: could be from monthYear (e.g. "August 2024") or year column
                // or an Excel date serial
                let year = null;
                const monthYearVal = get('monthYear');
                const yearVal = get('year');

                // Try to extract 4-digit year from monthYear string (e.g. "August 2024")
                const yearFromMonthYear = monthYearVal.match(/\b(19|20)\d{2}\b/);
                if (yearFromMonthYear) {
                    year = parseInt(yearFromMonthYear[0]);
                } else if (yearVal) {
                    // Could be Excel serial date (e.g. 45505) or a plain year
                    const num = parseFloat(yearVal);
                    if (!isNaN(num)) {
                        if (num > 1900 && num < 2100) {
                            year = Math.floor(num);
                        } else if (num > 40000) {
                            // Excel date serial → JS date
                            const jsDate = XLSX.SSF.parse_date_code(num);
                            if (jsDate) year = jsDate.y;
                        }
                    }
                }

                // Also try to derive year from Excel date in monthYear column
                if (!year && monthYearVal) {
                    const mnum = parseFloat(monthYearVal);
                    if (!isNaN(mnum) && mnum > 40000) {
                        const jsDate = XLSX.SSF.parse_date_code(mnum);
                        if (jsDate) year = jsDate.y;
                    }
                }

                // Format monthYear: if it's an Excel serial, convert to "Month Year"
                let monthYearFormatted = monthYearVal;
                if (monthYearVal && !isNaN(parseFloat(monthYearVal)) && parseFloat(monthYearVal) > 40000) {
                    const jsDate = XLSX.SSF.parse_date_code(parseFloat(monthYearVal));
                    if (jsDate) {
                        const months = ['January', 'February', 'March', 'April', 'May', 'June',
                            'July', 'August', 'September', 'October', 'November', 'December'];
                        monthYearFormatted = `${months[jsDate.m - 1]} ${jsDate.y}`;
                    }
                }

                const pub = {
                    title,
                    authors: authors || '',
                    year: year || new Date().getFullYear(),
                    journalConference: get('journalConference') || '',
                    department: get('department') || '',
                    monthYear: monthYearFormatted || '',
                    volumeIssuePageNo: get('volumeIssuePageNo') || '',
                    issnIsbn: get('issnIsbn') || '',
                    publicationLink: get('publicationLink') || '',
                    indexing: this.normalizeIndexing(get('indexing')),
                    collaborationType: get('collaborationType') || '',
                    collaborativeInstitution: get('collaborativeInstitution') || '',
                    keywords: get('keywords') || title.split(' ').slice(0, 5).join(', '), // fallback: first 5 words of title
                    abstract: get('abstract') || '',
                };

                const validation = this.validatePublication(pub);
                if (validation.valid) {
                    publications.push(pub);
                } else {
                    errors.push({ row: headerRowIndex + i + 2, errors: validation.errors });
                }
            });

            return {
                success: true,
                data: publications,
                errors,
                total: dataRows.filter(r => r.filter(c => String(c || '').trim()).length > 1).length,
                valid: publications.length,
                invalid: errors.length
            };

        } catch (error) {
            return { success: false, error: error.message, data: [] };
        }
    }

    normalizeIndexing(val) {
        if (!val) return 'Others';
        const v = val.toLowerCase();
        if (v.includes('scie')) return 'SCIE';
        if (v.includes('sci')) return 'SCI';
        if (v.includes('scopus')) return 'Scopus';
        if (v.includes('ugc')) return 'UGC Care';
        if (v.includes('web of science')) return 'Web of Science';
        return 'Others';
    }

    validatePublication(pub) {
        const errors = [];
        if (!pub.title || pub.title.trim() === '') errors.push('Title is required');
        if (!pub.authors || pub.authors.trim() === '') errors.push('Authors is required');
        if (!pub.year) {
            errors.push('Year is required');
        } else {
            const y = parseInt(pub.year);
            if (isNaN(y) || y < 1900 || y > new Date().getFullYear() + 2) {
                errors.push(`Invalid year: ${pub.year}`);
            } else {
                pub.year = y;
            }
        }
        if (!pub.journalConference || pub.journalConference.trim() === '') errors.push('Journal/Conference is required');
        // keywords is auto-filled, so not strictly required
        return { valid: errors.length === 0, errors };
    }

    generateTemplate() {
        return [{
            'SN': 1,
            'Name of the author/s (as per Publication sequence)': 'Prof. John Doe, Jane Smith',
            'Department of the Faculty': 'Computer Engineering',
            'Title of paper': 'Sample Publication Title',
            'Name of the Journal': 'International Journal of Research',
            'Month and Year of Publication': 'August 2024',
            'Volumn, Issue, Page Number': 'Volume 12, Issue 9',
            'ISSN/ ISBN Number': '2320-2882',
            'Link of the article/ DOI': 'https://doi.org/example',
            'Indexing in SCI/ SCIE/ Scopus/ UGC Care/ Web of Science/ Other': 'Others',
            'Collaboration with?': '',
            'Name of the Collaborative Institution/ Industry': '',
            'Keywords': 'AI, machine learning, research',
            'Abstract': 'Sample abstract text here.'
        }];
    }
}

module.exports = new FileParser();
