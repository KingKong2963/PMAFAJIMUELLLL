// models/MissionPage.js
const mongoose = require('mongoose');

const missionPageSchema = new mongoose.Schema({
  hero: {
    backgroundImage: { type: String, default: '/images/about-hero.jpg' }, // Default background
    title: { type: String, default: 'Our Mission' },
    subtitle: { type: String, default: 'To provide unwavering support...' }
  },
  content: {
    title: { type: String, default: 'Empowering Families' },
    body: { type: String, default: 'Our mission is to ensure that every migrant family...' }
  }
  // Assuming static footer or handled by a global partial
}, {
  timestamps: true,
  versionKey: false
});

// Singleton pattern
missionPageSchema.statics.getSingleton = async function() {
    let doc = await this.findOne();
    if (!doc) {
        console.log('Creating default MissionPage document.');
        doc = await new this().save(); // Create using defaults
    }
    return doc;
};

module.exports = mongoose.model('MissionPage', missionPageSchema);