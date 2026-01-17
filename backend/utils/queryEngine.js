/**
 * Rule-Based Academic Query Engine
 * NO AI/LLM - Pure algorithmic query processing
 * Explainable, deterministic responses based on keyword matching and data analysis
 */

class QueryEngine {
    /**
     * Main query processor - detects intent and routes to appropriate handler
     */
    async processQuery(query, publications) {
        const normalizedQuery = query.toLowerCase().trim();

        // Intent detection based on keywords
        const intent = this.detectIntent(normalizedQuery);

        // Route to appropriate handler
        switch (intent) {
            case 'summary':
                return this.generateSummary(publications);
            case 'research_areas':
                return this.identifyResearchAreas(publications);
            case 'time_filter':
                return this.filterByTime(normalizedQuery, publications);
            case 'journal_analysis':
                return this.analyzeJournals(publications);
            case 'latest_link':
                return this.getLatestLink(publications);
            case 'missing_links':
                return this.findMissingLinks(publications);
            case 'stats':
                return this.generateStatistics(publications);
            default:
                return this.handleUnknownQuery(normalizedQuery, publications);
        }
    }

    /**
     * Rule-based intent detection using keyword matching
     */
    detectIntent(query) {
        const intents = {
            summary: ['summary', 'summarize', 'overview', 'profile'],
            research_areas: ['research area', 'main area', 'focus', 'domain', 'field'],
            time_filter: ['after', 'before', 'since', 'year', 'recent', 'between'],
            journal_analysis: ['journal', 'conference', 'venue', 'published most', 'where'],
            latest_link: ['latest', 'recent', 'newest', 'open', 'link'],
            missing_links: ['missing link', 'without link', 'no link'],
            stats: ['how many', 'count', 'total', 'number of', 'statistics']
        };

        for (const [intent, keywords] of Object.entries(intents)) {
            if (keywords.some(keyword => query.includes(keyword))) {
                return intent;
            }
        }

        return 'unknown';
    }

    /**
     * Generate dynamic publication summary
     * Algorithm:
     * 1. Count publications
     * 2. Extract and rank keywords
     * 3. Analyze temporal distribution
     * 4. Identify top venues
     * 5. Generate professional summary
     */
    generateSummary(publications) {
        if (publications.length === 0) {
            return {
                response: "No publications found in your database. Start by adding publications manually or uploading an Excel/CSV file.",
                data: null
            };
        }

        const totalPubs = publications.length;

        // Extract and rank keywords
        const keywordFreq = {};
        publications.forEach(pub => {
            const keywords = pub.keywords.split(',').map(k => k.trim().toLowerCase());
            keywords.forEach(keyword => {
                if (keyword) {
                    keywordFreq[keyword] = (keywordFreq[keyword] || 0) + 1;
                }
            });
        });

        // Get top 3-5 research areas
        const topAreas = Object.entries(keywordFreq)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([keyword, freq]) => ({
                area: keyword,
                count: freq,
                percentage: ((freq / totalPubs) * 100).toFixed(1)
            }));

        // Temporal analysis
        const currentYear = new Date().getFullYear();
        const recentPubs = publications.filter(p => p.year >= currentYear - 3).length;
        const earliestYear = Math.min(...publications.map(p => p.year));
        const latestYear = Math.max(...publications.map(p => p.year));

        // Journal analysis
        const journalFreq = {};
        publications.forEach(pub => {
            const journal = pub.journalConference;
            journalFreq[journal] = (journalFreq[journal] || 0) + 1;
        });
        const topJournals = Object.entries(journalFreq)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([journal]) => journal);

        // Generate professional summary
        const areasText = topAreas.slice(0, 3).map(a => a.area).join(', ');
        const journalsText = topJournals.slice(0, 2).join(' and ');

        const summary = `📊 **Faculty Publication Summary**

**Total Publications**: ${totalPubs} papers (${earliestYear} - ${latestYear})

**Primary Research Areas**: ${topAreas.slice(0, 3).map(a => `${a.area} (${a.percentage}%)`).join(', ')}

**Recent Activity**: ${recentPubs} publications in the last 3 years, indicating ${recentPubs >= totalPubs * 0.5 ? 'active and ongoing' : 'steady'} research productivity.

**Key Publication Venues**: ${journalsText}${topJournals.length > 2 ? ', among others' : ''}.

**Research Profile**: The publication record demonstrates focused expertise in ${areasText}. ${recentPubs > 0 ? `Recent work continues to emphasize these areas with ${recentPubs} recent contributions.` : 'This represents the cumulative research output to date.'}`;

        return {
            response: summary,
            data: {
                total: totalPubs,
                topAreas: topAreas,
                yearRange: { earliest: earliestYear, latest: latestYear },
                recentCount: recentPubs,
                topJournals: topJournals
            }
        };
    }

    /**
     * Identify main research areas based on keyword frequency
     */
    identifyResearchAreas(publications) {
        if (publications.length === 0) {
            return { response: "No publications available to analyze research areas.", data: null };
        }

        const keywordFreq = {};
        publications.forEach(pub => {
            const keywords = pub.keywords.split(',').map(k => k.trim().toLowerCase());
            keywords.forEach(keyword => {
                if (keyword) {
                    keywordFreq[keyword] = (keywordFreq[keyword] || 0) + 1;
                }
            });
        });

        const sortedAreas = Object.entries(keywordFreq)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);

        let response = `🔬 **Main Research Areas** (based on keyword analysis):\n\n`;
        sortedAreas.forEach(([area, count], index) => {
            const percentage = ((count / publications.length) * 100).toFixed(1);
            response += `${index + 1}. **${area}** - ${count} publications (${percentage}%)\n`;
        });

        return {
            response: response,
            data: sortedAreas.map(([area, count]) => ({ area, count }))
        };
    }

    /**
     * Filter publications by time/year
     */
    filterByTime(query, publications) {
        let filteredPubs = [];
        let description = "";

        // Extract year from query
        const yearMatch = query.match(/\d{4}/);
        if (!yearMatch) {
            return {
                response: "Please specify a year in your query (e.g., 'papers after 2020').",
                data: null
            };
        }

        const year = parseInt(yearMatch[0]);

        if (query.includes('after') || query.includes('since')) {
            filteredPubs = publications.filter(p => p.year > year);
            description = `after ${year}`;
        } else if (query.includes('before')) {
            filteredPubs = publications.filter(p => p.year < year);
            description = `before ${year}`;
        } else if (query.includes('in') || query.includes('during')) {
            filteredPubs = publications.filter(p => p.year === year);
            description = `in ${year}`;
        } else {
            filteredPubs = publications.filter(p => p.year >= year);
            description = `from ${year} onwards`;
        }

        let response = `📅 **Publications ${description}**: ${filteredPubs.length} papers found\n\n`;

        if (filteredPubs.length > 0) {
            filteredPubs.slice(0, 10).forEach((pub, index) => {
                response += `${index + 1}. **${pub.title}** (${pub.year})\n   _${pub.journalConference}_\n\n`;
            });

            if (filteredPubs.length > 10) {
                response += `_... and ${filteredPubs.length - 10} more publications._`;
            }
        }

        return {
            response: response,
            data: filteredPubs
        };
    }

    /**
     * Analyze journal/conference distribution
     */
    analyzeJournals(publications) {
        if (publications.length === 0) {
            return { response: "No publications available for journal analysis.", data: null };
        }

        const journalFreq = {};
        publications.forEach(pub => {
            const journal = pub.journalConference;
            if (!journalFreq[journal]) {
                journalFreq[journal] = {
                    count: 0,
                    papers: []
                };
            }
            journalFreq[journal].count++;
            journalFreq[journal].papers.push(pub.title);
        });

        const sortedJournals = Object.entries(journalFreq)
            .sort((a, b) => b[1].count - a[1].count)
            .slice(0, 10);

        let response = `📚 **Publication Venues Analysis**:\n\n`;
        sortedJournals.forEach(([journal, data], index) => {
            const percentage = ((data.count / publications.length) * 100).toFixed(1);
            response += `${index + 1}. **${journal}**\n   ${data.count} publications (${percentage}%)\n\n`;
        });

        return {
            response: response,
            data: sortedJournals.map(([journal, data]) => ({ journal, count: data.count }))
        };
    }

    /**
     * Get latest publication with link
     */
    getLatestLink(publications) {
        if (publications.length === 0) {
            return { response: "No publications found.", data: null };
        }

        const sortedPubs = [...publications].sort((a, b) => b.year - a.year || new Date(b.createdDate) - new Date(a.createdDate));
        const latest = sortedPubs[0];

        if (latest.publicationLink && latest.publicationLink.trim() !== '') {
            return {
                response: `🔗 **Latest Publication**:\n\n**Title**: ${latest.title}\n**Year**: ${latest.year}\n**Journal**: ${latest.journalConference}\n**Link**: ${latest.publicationLink}`,
                data: latest
            };
        } else {
            return {
                response: `📄 **Latest Publication**: ${latest.title} (${latest.year})\n\n_No link available for this publication._`,
                data: latest
            };
        }
    }

    /**
     * Find publications without links
     */
    findMissingLinks(publications) {
        const missingLinks = publications.filter(p => !p.publicationLink || p.publicationLink.trim() === '');

        let response = `🔍 **Publications without links**: ${missingLinks.length} found\n\n`;

        if (missingLinks.length > 0) {
            missingLinks.slice(0, 10).forEach((pub, index) => {
                response += `${index + 1}. **${pub.title}** (${pub.year})\n   _${pub.journalConference}_\n\n`;
            });

            if (missingLinks.length > 10) {
                response += `_... and ${missingLinks.length - 10} more._`;
            }
        } else {
            response = "✅ All publications have links!";
        }

        return {
            response: response,
            data: missingLinks
        };
    }

    /**
     * Generate general statistics
     */
    generateStatistics(publications) {
        if (publications.length === 0) {
            return { response: "No publications available for statistics.", data: null };
        }

        const stats = {
            total: publications.length,
            withLinks: publications.filter(p => p.publicationLink && p.publicationLink.trim() !== '').length,
            withAbstract: publications.filter(p => p.abstract && p.abstract.trim() !== '').length,
            yearRange: {
                earliest: Math.min(...publications.map(p => p.year)),
                latest: Math.max(...publications.map(p => p.year))
            },
            yearDistribution: {}
        };

        publications.forEach(pub => {
            stats.yearDistribution[pub.year] = (stats.yearDistribution[pub.year] || 0) + 1;
        });

        let response = `📈 **Publication Statistics**:\n\n`;
        response += `**Total Publications**: ${stats.total}\n`;
        response += `**Publications with Links**: ${stats.withLinks} (${((stats.withLinks / stats.total) * 100).toFixed(1)}%)\n`;
        response += `**Publications with Abstracts**: ${stats.withAbstract} (${((stats.withAbstract / stats.total) * 100).toFixed(1)}%)\n`;
        response += `**Year Range**: ${stats.yearRange.earliest} - ${stats.yearRange.latest}\n\n`;

        response += `**Publications by Year**:\n`;
        Object.entries(stats.yearDistribution)
            .sort((a, b) => b[0] - a[0])
            .forEach(([year, count]) => {
                response += `  ${year}: ${count} papers\n`;
            });

        return {
            response: response,
            data: stats
        };
    }

    /**
     * Handle unknown queries with fuzzy matching
     */
    handleUnknownQuery(query, publications) {
        // Try keyword search in titles and abstracts
        const matches = publications.filter(pub => {
            const searchText = `${pub.title} ${pub.keywords} ${pub.abstract}`.toLowerCase();
            return searchText.includes(query.slice(0, 50)); // Search first 50 chars of query
        });

        if (matches.length > 0) {
            let response = `🔍 Found ${matches.length} publication(s) matching your query:\n\n`;
            matches.slice(0, 5).forEach((pub, index) => {
                response += `${index + 1}. **${pub.title}** (${pub.year})\n   ${pub.journalConference}\n\n`;
            });
            return { response, data: matches };
        }

        return {
            response: `I couldn't understand your query. Try asking:\n\n• "Give me a summary of my publications"\n• "What are my main research areas?"\n• "How many papers after 2020?"\n• "List journals where I published most"\n• "Open my latest publication link"\n• "Show publications without links"`,
            data: null
        };
    }
}

module.exports = new QueryEngine();
