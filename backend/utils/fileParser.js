const XLSX = require('xlsx');

/**
 * Parse Excel/CSV files and extract publication data
 * Handles column mapping and data validation
 */
class FileParser {
    /**
     * Parse uploaded Excel or CSV file
     */
    parseFile(filePath) {
        try {
            // Read the file
            const workbook = XLSX.readFile(filePath);

            // Get the first sheet
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];

            // Convert to JSON
            const rawData = XLSX.utils.sheet_to_json(worksheet);

            if (rawData.length === 0) {
                throw new Error('File is empty');
            }

            // Map columns to our schema
            const publications = rawData.map((row, index) => {
                return this.mapRowToPublication(row, index + 2); // +2 because header is row 1
            });

            // Validate all publications
            const validPublications = [];
            const errors = [];

            publications.forEach((pub, index) => {
                const validation = this.validatePublication(pub);
                if (validation.valid) {
                    validPublications.push(pub);
                } else {
                    errors.push({
                        row: index + 2,
                        errors: validation.errors
                    });
                }
            });

            return {
                success: true,
                data: validPublications,
                errors: errors,
                total: rawData.length,
                valid: validPublications.length,
                invalid: errors.length
            };

        } catch (error) {
            return {
                success: false,
                error: error.message,
                data: []
            };
        }
    }

    /**
     * Map row data to publication schema
     * Handles various column name variations
     */
    mapRowToPublication(row, rowNumber) {
        // Define possible column name variations
        const columnMappings = {
            title: ['title', 'paper title', 'publication title', 'name'],
            authors: ['authors', 'author', 'author(s)', 'written by'],
            year: ['year', 'publication year', 'year published'],
            journalConference: ['journal', 'conference', 'journal/conference', 'venue', 'published in'],
            keywords: ['keywords', 'keyword', 'tags', 'research areas'],
            abstract: ['abstract', 'summary', 'description'],
            publicationLink: ['link', 'url', 'publication link', 'doi', 'website']
        };

        const mapped = {};

        // Convert all keys to lowercase for case-insensitive matching
        const lowerCaseRow = {};
        Object.keys(row).forEach(key => {
            lowerCaseRow[key.toLowerCase().trim()] = row[key];
        });

        // Map each field
        for (const [field, variations] of Object.entries(columnMappings)) {
            for (const variation of variations) {
                if (lowerCaseRow[variation] !== undefined && lowerCaseRow[variation] !== null && lowerCaseRow[variation] !== '') {
                    mapped[field] = String(lowerCaseRow[variation]).trim();
                    break;
                }
            }

            // Set defaults for optional fields
            if (!mapped[field]) {
                if (field === 'abstract' || field === 'publicationLink') {
                    mapped[field] = '';
                }
            }
        }

        return mapped;
    }

    /**
     * Validate publication data
     */
    validatePublication(pub) {
        const errors = [];

        // Required fields validation
        if (!pub.title || pub.title.trim() === '') {
            errors.push('Title is required');
        }

        if (!pub.authors || pub.authors.trim() === '') {
            errors.push('Authors is required');
        }

        if (!pub.year) {
            errors.push('Year is required');
        } else {
            const year = parseInt(pub.year);
            const currentYear = new Date().getFullYear();
            if (isNaN(year) || year < 1900 || year > currentYear + 1) {
                errors.push(`Year must be between 1900 and ${currentYear + 1}`);
            } else {
                pub.year = year; // Convert to number
            }
        }

        if (!pub.journalConference || pub.journalConference.trim() === '') {
            errors.push('Journal/Conference is required');
        }

        if (!pub.keywords || pub.keywords.trim() === '') {
            errors.push('Keywords is required');
        }

        return {
            valid: errors.length === 0,
            errors: errors
        };
    }

    /**
     * Generate sample template for download
     */
    generateTemplate() {
        const template = [
            {
                'Title': 'Sample Publication Title',
                'Authors': 'Author 1, Author 2, Author 3',
                'Year': new Date().getFullYear(),
                'Journal/Conference': 'International Journal of Research',
                'Keywords': 'machine learning, data science, AI',
                'Abstract': 'This is a sample abstract describing the research work...',
                'Publication Link': 'https://example.com/paper.pdf'
            }
        ];

        return template;
    }

    /**
     * Detect file type based on extension
     */
    getFileType(filename) {
        const ext = filename.split('.').pop().toLowerCase();
        if (ext === 'xlsx' || ext === 'xls') {
            return 'excel';
        } else if (ext === 'csv') {
            return 'csv';
        }
        return 'unknown';
    }
}

module.exports = new FileParser();
