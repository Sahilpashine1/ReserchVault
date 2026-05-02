const mongoose = require('mongoose');

const publicationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    authors: {
        type: String,
        required: true,
        trim: true
    },
    department: {
        type: String,
        default: '',
        trim: true
    },
    year: {
        type: Number,
        required: true,
        min: 1900,
        max: new Date().getFullYear() + 1
    },
    monthYear: {
        type: String,
        default: '',
        trim: true
    },
    journalConference: {
        type: String,
        required: true,
        trim: true
    },
    volumeIssuePageNo: {
        type: String,
        default: '',
        trim: true
    },
    issnIsbn: {
        type: String,
        default: '',
        trim: true
    },
    publicationLink: {
        type: String,
        default: '',
        trim: true
    },
    indexing: {
        type: String,
        default: 'Others',
        enum: ['SCI', 'SCIE', 'Scopus', 'UGC Care', 'Web of Science', 'Others'],
        trim: true
    },
    collaborationType: {
        type: String,
        default: '',
        trim: true
    },
    collaborativeInstitution: {
        type: String,
        default: '',
        trim: true
    },
    keywords: {
        type: String,
        required: true,
        trim: true
    },
    abstract: {
        type: String,
        default: '',
        trim: true
    },
    status: {
        type: String,
        default: 'published',
        enum: ['published', 'review', 'pending', 'rejected']
    },
    createdDate: {
        type: Date,
        default: Date.now
    }
});

// Index for faster queries
publicationSchema.index({ userId: 1, year: -1 });
publicationSchema.index({ userId: 1, keywords: 'text', title: 'text', abstract: 'text' });

module.exports = mongoose.model('Publication', publicationSchema);
