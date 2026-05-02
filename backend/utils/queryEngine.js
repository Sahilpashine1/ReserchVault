/**
 * Groq AI Query Engine
 * ─────────────────────────────────────────────────────────────────────────────
 * Sends the user query + MongoDB publication data directly to Groq (LLaMA 3).
 * No rule-based logic. No keyword matching. 100% AI-powered responses.
 *
 * Model  : llama3-8b-8192
 * Endpoint: https://api.groq.com/openai/v1/chat/completions
 */

const Groq = require('groq-sdk');

const GROQ_MODEL = 'llama-3.1-8b-instant';

const SYSTEM_PROMPT = `You are an intelligent academic assistant for a Faculty Publications Management System.

Your job is to answer user questions using the provided database information about faculty, publications, departments, and research work.

Guidelines:
* Respond in natural language like ChatGPT.
* Keep answers clear and professional.
* Use bullet points when listing multiple items.
* Do not generate information that is not present in the provided context.
* If the provided context is empty, politely say that no records were found in the system.`;

class QueryEngine {

    /**
     * Main entry point — sends DB data + user query to Groq and returns a
     * natural-language response.
     *
     * @param {string} query        - The user's question
     * @param {Array}  publications - Publications fetched from MongoDB (plain objects)
     * @returns {{ response: string, data: null }}
     */
    async processQuery(query, publications) {
        if (!process.env.GROQ_API_KEY) {
            return {
                response: '⚠️ The AI assistant is not configured. Please add `GROQ_API_KEY` to your `.env` file.',
                data: null
            };
        }

        try {
            const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

            const contextData = this.formatPublicationsForAI(publications);

            const userMessage =
                `Context Data:\n${contextData}\n\nUser Question:\n${query}\n\nGenerate a helpful and well-formatted answer.`;

            const completion = await groq.chat.completions.create({
                model: GROQ_MODEL,
                messages: [
                    { role: 'system', content: SYSTEM_PROMPT },
                    { role: 'user', content: userMessage }
                ],
                temperature: 0.3,
                max_tokens: 500,
                top_p: 0.9
            });

            const text = completion.choices[0]?.message?.content?.trim();

            return { response: text || 'No records found in the system.', data: null };

        } catch (error) {
            console.error('❌ Groq AI error:', error.message);

            // Rate limit
            if (error.status === 429 || (error.message && error.message.includes('429'))) {
                return {
                    response: '⚠️ **AI rate limit reached.** Too many requests in a short time. Please wait a moment and try again.',
                    data: null
                };
            }

            // Invalid / missing key
            if (error.status === 401 || (error.message && error.message.includes('401'))) {
                return {
                    response: '⚠️ **Invalid API key.** Please check your `GROQ_API_KEY` in the `.env` file.',
                    data: null
                };
            }

            return {
                response: '⚠️ The AI assistant encountered an error. Please try again shortly.',
                data: null
            };
        }
    }

    /**
     * Formats the MongoDB publications array into a structured, readable
     * context string that the AI can reason about.
     *
     * @param {Array} publications
     * @returns {string}
     */
    formatPublicationsForAI(publications) {
        if (!publications || publications.length === 0) {
            return 'No publications found in the database.';
        }

        // Year-level summary for accurate count-based questions
        const yearDist = {};
        publications.forEach(pub => {
            const y = pub.year || 'Unknown';
            yearDist[y] = (yearDist[y] || 0) + 1;
        });

        const yearSummary = Object.keys(yearDist)
            .sort((a, b) => b - a)
            .map(yr => `  ${yr}: ${yearDist[yr]} publication(s)`)
            .join('\n');

        let context = `Total Publications: ${publications.length}\n`;
        context += `\nPublications by Year:\n${yearSummary}\n\n`;
        context += 'Individual Publication Details:\n';

        // Cap at 50 to stay within token budget
        const slice = publications.slice(0, 50);
        slice.forEach((pub, i) => {
            context += `[${i + 1}] Title: "${pub.title}"\n`;
            context += `    Year: ${pub.year || 'N/A'}\n`;
            context += `    Journal/Conference: ${pub.journalConference || 'N/A'}\n`;
            if (pub.authorName) context += `    Author: ${pub.authorName}\n`;
            if (pub.keywords) context += `    Keywords: ${pub.keywords}\n`;
            if (pub.abstract) context += `    Abstract: ${pub.abstract.substring(0, 200)}...\n`;
            if (pub.publicationLink) context += `    Link: ${pub.publicationLink}\n`;
            context += '\n';
        });

        if (publications.length > 50) {
            context += `... and ${publications.length - 50} more publications (showing first 50 for context).\n`;
        }

        return context;
    }
}

module.exports = new QueryEngine();
