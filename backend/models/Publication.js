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
    year: {
        type: Number,
        required: true,
        min: 1900,
        max: new Date().getFullYear() + 1
    },
    journalConference: {
        type: String,
        required: true,
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
    publicationLink: {
        type: String,
        default: '',
        trim: true
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
