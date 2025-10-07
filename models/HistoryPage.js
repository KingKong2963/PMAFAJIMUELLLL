// models/HistoryPage.js
const mongoose = require('mongoose');

const timelineEventSchema = new mongoose.Schema({
    year: { type: String, default: 'Year' }, // Keep as String for flexibility (e.g., "2010s")
    title: { type: String, default: 'Milestone Title' },
    description: { type: String, default: 'Description of the event or milestone.' }
}, { _id: false });

const historyPageSchema = new mongoose.Schema({
  hero: {
    backgroundImage: { type: String, default: '/images/about-hero.jpg' }, // Default background
    title: { type: String, default: 'Our History' },
    subtitle: { type: String, default: 'A legacy of support...' }
  },
  content: {
    title: { type: String, default: 'Our Journey' },
    timelineEvents: {
        type: [timelineEventSchema],
         default: [ // Default events based on your static page
             { year: '2010', title: 'Founded', description: 'PMAFA was established to support migrant families...' },
             { year: '2015', title: 'Community Expansion', description: 'Launched community programs to promote cultural integration...' },
             { year: '2020', title: 'Digital Outreach', description: 'Introduced online resources and virtual counseling...' }
         ]
    }
  }
  // Assuming static footer or handled by a global partial
}, {
  timestamps: true,
  versionKey: false
});

// Singleton pattern
historyPageSchema.statics.getSingleton = async function() {
    let doc = await this.findOne();
    if (!doc) {
        console.log('Creating default HistoryPage document.');
        doc = await new this().save(); // Create using defaults
    }
    return doc;
};

module.exports = mongoose.model('HistoryPage', historyPageSchema);