// models/GoalsPage.js
const mongoose = require('mongoose');

const goalsPageSchema = new mongoose.Schema({
  hero: {
    backgroundImage: { type: String, default: '/images/about-hero.jpg' }, // Default background
    title: { type: String, default: 'Our Goals' },
    subtitle: { type: String, default: 'To create sustainable support systems...' }
  },
  content: {
    title: { type: String, default: 'Our Aspirations' },
    // Store goals as an array of strings
    goals: {
        type: [String],
        default: [
            'Expand access to migration resources globally.',
            'Strengthen community networks for migrant families.',
            'Advocate for inclusive policies and cultural acceptance.'
        ]
    }
  }
  // Assuming static footer or handled by a global partial
}, {
  timestamps: true,
  versionKey: false
});

// Singleton pattern
goalsPageSchema.statics.getSingleton = async function() {
    let doc = await this.findOne();
    if (!doc) {
        console.log('Creating default GoalsPage document.');
        doc = await new this().save(); // Create using defaults
    }
    return doc;
};

module.exports = mongoose.model('GoalsPage', goalsPageSchema);