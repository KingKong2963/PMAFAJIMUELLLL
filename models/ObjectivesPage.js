// models/ObjectivesPage.js
const mongoose = require('mongoose');

const objectivesPageSchema = new mongoose.Schema({
  hero: {
    backgroundImage: { type: String, default: '/images/about-hero.jpg' }, // Default background
    title: { type: String, default: 'Our Objectives' },
    subtitle: { type: String, default: 'To deliver targeted support...' }
  },
  content: {
    title: { type: String, default: 'Our Focus Areas' },
    // Store objectives as an array of strings
    objectives: {
        type: [String],
        default: [
            'Provide tailored migration counseling services.',
            'Host community events to foster integration.',
            'Develop digital tools for resource access.'
        ]
    }
  }
  // Assuming static footer or handled by a global partial
}, {
  timestamps: true,
  versionKey: false
});

// Singleton pattern
objectivesPageSchema.statics.getSingleton = async function() {
    let doc = await this.findOne();
    if (!doc) {
        console.log('Creating default ObjectivesPage document.');
        doc = await new this().save(); // Create using defaults
    }
    return doc;
};

module.exports = mongoose.model('ObjectivesPage', objectivesPageSchema);