const mongoose = require('mongoose');

const homePageSchema = new mongoose.Schema({
  siteLogo: { type: String, default: '/images/1745849620175-logo.png' },
  hero: {
    backgroundImage: { type: String },
    title: { type: String },
    subtitle: { type: String },
    button1: {
      text: { type: String },
      link: { type: String },
      icon: { type: String }
    },
    button2: {
      text: { type: String },
      link: { type: String },
      icon: { type: String }
    }
  },
  featuredStories: {
    title: { type: String },
    subtitle: { type: String },
    stories: {
      type: [{
        contentType: { type: String, enum: ['images', 'embed'], default: 'images' },
        images: [{ type: String }],
        embedLink: { type: String },
        tag: { type: String },
        tagColor: { type: String },
        title: { type: String },
        description: { type: String },
        link: { type: String }
      }],
      validate: {
        validator: function(arr) {
          return arr.length >= 1 && arr.length <= 10;
        },
        message: 'Stories must have between 1 and 10 entries.'
      }
    },
    viewAllLink: {
      text: { type: String },
      link: { type: String },
      icon: { type: String }
    }
  },
  stats: [{
    value: { type: String },
    label: { type: String }
  }],
  testimonials: {
    title: { type: String },
    subtitle: { type: String },
    testimonials: {
      type: [{
        quote: { type: String },
        name: { type: String },
        origin: { type: String },
        image: { type: String }
      }],
      validate: {
        validator: function(arr) {
          return arr.length >= 1 && arr.length <= 10;
        },
        message: 'Testimonials must have between 1 and 10 entries.'
      }
    }
  },
  footer: {
    orgName: { type: String },
    address: { type: String },
    email: { type: String },
    phone: { type: String },
    copyright: { type: String }
  }
}, {
  versionKey: false
});

module.exports = mongoose.model('HomePage', homePageSchema);