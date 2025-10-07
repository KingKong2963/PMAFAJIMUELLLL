// models/LeadershipPage.js
const mongoose = require('mongoose');

const teamMemberSchema = new mongoose.Schema({
  name: { type: String, default: 'Team Member Name' },
  title: { type: String, default: 'Position Title' },
  bio: { type: String, default: 'Short bio about the team member.' },
  image: { type: String, default: 'https://via.placeholder.com/128x128?text=Person' },
  link: { type: String, default: '#' },
  email: { type: String, default: 'member@example.com' },
  tenure: { type: String, default: 'N/A' },
  achievements: { type: String, default: 'Key achievements not listed.' }
}, { _id: false });

const leadershipPageSchema = new mongoose.Schema({
  hero: {
    backgroundImage: { type: String, default: '/images/default-leadership-hero.jpg' }, // Added this field
    title: { type: String, default: 'Our Leadership' },
    subtitle: { type: String, default: 'Meet the dedicated team...' },
    buttonText: { type: String, default: 'Meet the Team' },
  },
  leadershipSection: {
    title: { type: String, default: 'Leadership Hierarchy' },
    subtitle: { type: String, default: 'Our leadership team works tirelessly...' },
    mayor: {
        name: { type: String, default: 'Mayor John Doe' },
        title: { type: String, default: 'City Mayor' },
        bio: { type: String, default: 'Mayor John Doe oversees PMAFA’s strategic initiatives...' },
        image: { type: String, default: 'https://via.placeholder.com/256x256?text=Mayor' },
        link: { type: String, default: '/administration/person/mayor-john-doe' },
        email: { type: String, default: 'mayor@example.com' },
        tenure: { type: String, default: 'Since 2018' },
        achievements: { type: String, default: 'Led city-wide support initiatives.' }
    },
    president: {
        name: { type: String, default: 'Ceres Fauna' },
        title: { type: String, default: 'PMAFA President' },
        bio: { type: String, default: 'President bio goes here.' },
        image: { type: String, default: 'https://via.placeholder.com/256x256?text=President' },
        link: { type: String, default: '/administration/person/pmafa-ceres' },
        email: { type: String, default: 'president@example.com' },
        tenure: { type: String, default: 'Since 2019' },
        achievements: { type: String, default: 'Expanded program reach.' }
    },
    teamMembers: {
        type: [teamMemberSchema],
        default: [
            { name: 'Dr. Anna Reyes', title: 'Executive Director', bio: 'Dr. Reyes leads PMAFA’s operations...', image: 'https://via.placeholder.com/128x128?text=Anna+Reyes', link: '/administration/person/anna-reyes' },
            { name: 'Mark Santos', title: 'Community Outreach Coordinator', bio: 'Mark connects families with resources...', image: 'https://via.placeholder.com/128x128?text=Mark+Santos', link: '/administration/person/mark-santos' },
            { name: 'Lila Torres', title: 'Counseling Specialist', bio: 'Lila provides emotional support...', image: 'https://via.placeholder.com/128x128?text=Lila+Torres', link: '/administration/person/lila-torres' }
        ]
    }
  }
}, {
  timestamps: true,
  versionKey: false
});

leadershipPageSchema.statics.getSingleton = async function() {
    let doc = await this.findOne();
    if (!doc) {
        console.log('Creating default LeadershipPage document.');
        const defaultData = {
            hero: { backgroundImage: '/images/default-leadership-hero.jpg' }
            // Add other defaults if needed
        };
        doc = await new this(defaultData).save();
    } else if (!doc.hero || typeof doc.hero.backgroundImage === 'undefined') {
        // If an old document exists without the backgroundImage field
        console.log('Updating existing LeadershipPage document with default hero backgroundImage.');
        doc.hero = doc.hero || {}; // Ensure hero object exists
        doc.hero.backgroundImage = '/images/default-leadership-hero.jpg'; // Set default
        doc = await doc.save();
    }
    return doc;
};

module.exports = mongoose.model('LeadershipPage', leadershipPageSchema);