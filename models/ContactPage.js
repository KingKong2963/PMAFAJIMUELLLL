// models/ContactPage.js
const mongoose = require('mongoose');

const contactPageSchema = new mongoose.Schema({
  hero: {
    title: { type: String, default: 'Get in Touch' },
    subtitle: { type: String, default: 'We’re here to support you...' },
    buttonText: { type: String, default: 'Contact Us' },
    backgroundImage: { type: String, default: '/images/default-contact-hero.jpg' } // Added field for background image
  },
  formSection: {
    title: { type: String, default: 'Send Us a Message' },
    subtitle: { type: String, default: 'Fill out the form below...' },
    formRecipientEmail: { type: String, default: 'default-contact@pmafa.org' }
  },
  infoSection: {
    title: { type: String, default: 'Connect With Us' },
    subtitle: { type: String, default: 'Find us at our office...' },
    address: {
        icon: { type: String, default: 'fas fa-map-marker-alt' },
        lines: { type: String,default: '123 Community Avenue\nNew York, NY 10001' }
    },
    phone: {
        icon: { type: String, default: 'fas fa-phone-alt' },
        number: { type: String, default: '(555) 123-4567' },
        link: { type: String, default: 'tel:+15551234567' }
    },
    email: {
        icon: { type: String, default: 'fas fa-envelope' },
        address: { type: String, default: 'info@pmafa.org' },
        link: { type: String, default: 'mailto:info@pmafa.org' }
    },
    mapEmbedUrl: { type: String, default: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3861.300584797087!2d120.98185931535705!3d14.58197098980801!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3397ca03403f4cc9%3A0xaa565570182d5a1!2sManila%2C%20Metro%20Manila!5e0!3m2!1sen!2sph!4v1678886400000' }
  },
  footer: {
    orgName: { type: String, default: 'PMAFA Contact' },
    description: { type: String, default: 'Contact page footer description.'},
    address: { type: String, default: '123 Contact Address\nCity, State ZIP' },
    email: { type: String, default: 'contact-footer@pmafa.org' },
    phone: { type: String, default: '(555) 987-6543' },
    copyright: { type: String, default: `© ${new Date().getFullYear()} PMAFA Contact. All rights reserved.` }
  }
}, {
  timestamps: true,
  versionKey: false
});

contactPageSchema.statics.getSingleton = async function() {
    let doc = await this.findOne();
    if (!doc) {
        console.log('Creating default ContactPage document.');
        const defaultData = {
            hero: { backgroundImage: '/images/default-contact-hero.jpg' }
            // You can add other default values here if needed for a new document
        };
        doc = await new this(defaultData).save();
    } else if (!doc.hero || typeof doc.hero.backgroundImage === 'undefined') {
        // If an old document exists without the backgroundImage field
        console.log('Updating existing ContactPage document with default hero backgroundImage.');
        doc.hero = doc.hero || {}; // Ensure hero object exists
        doc.hero.backgroundImage = '/images/default-contact-hero.jpg'; // Set default
        doc = await doc.save();
    }
    return doc;
};

module.exports = mongoose.model('ContactPage', contactPageSchema);