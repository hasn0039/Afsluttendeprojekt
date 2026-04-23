const mongoose = require('mongoose');

const SubControlSchema = new mongoose.Schema({
        name: String,
        description: String,
        status: String,
        fulfillment: Number,
        impactScore: Number,
        securityFunction: String,
        implementationGroup: String,
        comment: String,
    }, 
    {
    timestamps: true // Automatisk createdAt og updatedAt
    }

);

module.exports = mongoose.model('SubControl', SubControlSchema);