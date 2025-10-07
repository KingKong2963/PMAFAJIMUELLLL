// models/ServicesPage.js
const mongoose = require('mongoose');

const serviceItemSchema = new mongoose.Schema({
  icon: { type: String, default: 'fas fa-concierge-bell' },
  title: { type: String, default: 'New Service' },
  image: { type: String, default: '/images/placeholder-service.jpg' },
  description: { type: String, default: 'Service description.' },
  link: { type: String, default: '#' }
}, { _id: false });

// --- Testimonial schema removed ---

const servicesPageSchema = new mongoose.Schema({
  hero: {
    backgroundImage: { type: String, default: '/images/services-hero.jpg' },
    title: { type: String, default: 'Our Services' },
    subtitle: { type: String, default: 'Default subtitle for services.' },
    buttonText: { type: String, default: 'Explore Services' },
    buttonLink: { type: String, default: '#services' }
  },
  servicesSection: {
    title: { type: String, default: 'How We Help' },
    subtitle: { type: String, default: 'Default subtitle for how we help.' },
    services: {
        type: [serviceItemSchema],
        validate: {
            validator: function(arr) { return arr.length >= 1 && arr.length <= 12; },
            message: 'Services must have between 1 and 12 entries.'
        },
        default: [
            { icon: 'fas fa-passport', title: 'Migration Support', image: '/images/migration.jpg', description: 'Expert guidance on visas, documentation, and resettlement for a seamless transition.', link: '/contact'},
            { icon: 'fas fa-heart', title: 'Family Counseling', image: '/images/counseling.jpg', description: 'Professional support to strengthen family bonds and navigate emotional challenges.', link: '/contact'},
            { icon: 'fas fa-users', title: 'Community Events', image: '/images/events.jpg', description: 'Engaging activities to foster connection, cultural integration, and community building.', link: '/contact'}
        ]
    }
  }
  // --- testimonialsSection removed ---
  // --- ctaSection removed ---
}, {
  timestamps: true,
  versionKey: false
});

// Static method remains the same
servicesPageSchema.statics.getSingleton = async function() {
    let doc = await this.findOne();
    if (!doc) {
        console.log('Creating default ServicesPage document.');
        doc = await new this().save();
    }
    return doc;
};

module.exports = mongoose.model('ServicesPage', servicesPageSchema);