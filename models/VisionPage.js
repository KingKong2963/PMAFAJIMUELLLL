// models/VisionPage.js
const mongoose = require('mongoose');

const visionPageSchema = new mongoose.Schema({
  hero: {
    // Use the background image from about.css by default
    backgroundImage: { type: String, default: '/images/about-hero.jpg' },
    title: { type: String, default: 'Our Vision' },
    subtitle: { type: String, default: 'A world where every migrant family thrives...' }
  },
  content: {
    title: { type: String, default: 'Building a Better Future' },
    body: { type: String, default: 'PMAFA envisions a global community where migrant families are empowered...' }
  }
  // Footer can be assumed to be handled by a global partial or static if not defined here
}, {
  timestamps: true,
  versionKey: false
});

// Singleton pattern
visionPageSchema.statics.getSingleton = async function() {
    let doc = await this.findOne();
    if (!doc) {
        console.log('Creating default VisionPage document.');
        doc = await new this().save(); // Create using defaults
    }
    return doc;
};

module.exports = mongoose.model('VisionPage', visionPageSchema);