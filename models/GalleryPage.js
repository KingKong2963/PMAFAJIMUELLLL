
const mongoose = require('mongoose');

const galleryItemSchema = new mongoose.Schema({
  image: { type: String, required: true, default: '/images/placeholder-gallery.jpg' },
  title: { type: String, default: 'Gallery Title' },
  description: { type: String, default: 'Image description.' },
  category: { type: String, lowercase: true, trim: true, default: 'community' },
  subcategory: { type: String, lowercase: true, trim: true, default: '' } // Optional subcategory
}, { _id: false });

const categorySchema = new mongoose.Schema({
  name: { type: String, lowercase: true, trim: true, required: true },
  subcategories: { type: [String], default: [] }
}, { _id: false });

const galleryPageSchema = new mongoose.Schema({
  hero: {
    backgroundImage: { type: String, default: '/images/gallery-hero.jpg' },
    title: { type: String, default: 'Our Gallery' },
    subtitle: { type: String, default: 'Celebrating the vibrant moments...' },
    buttonText: { type: String, default: 'View Gallery' },
    buttonLink: { type: String, default: '#gallery' }
  },
  gallerySection: {
    title: { type: String, default: 'Moments That Matter' },
    subtitle: { type: String, default: 'Explore our collection of memories...' },
    categories: {
      type: [categorySchema],
      default: [{ name: 'community', subcategories: [] }],
      validate: {
        validator: function (arr) {
          const names = arr.map(c => c.name);
          const uniqueNames = [...new Set(names)];
          return uniqueNames.length === names.length && arr.every(c => c.name.trim() !== '');
        },
        message: 'Category names must be unique and non-empty.'
      }
    },
    items: {
      type: [galleryItemSchema],
      default: [],
      validate: {
        validator: function (items) {
          const categoryNames = this.gallerySection.categories.map(c => c.name);
          const subcategoryMap = {};
          this.gallerySection.categories.forEach(c => {
            subcategoryMap[c.name] = c.subcategories || [];
          });
          return items.every(item => {
            const isValidCategory = categoryNames.includes(item.category);
            const isValidSubcategory = !item.subcategory || subcategoryMap[item.category]?.includes(item.subcategory);
            return isValidCategory && isValidSubcategory;
          });
        },
        message: 'Each gallery item must have a valid category and subcategory.'
      }
    }
  },
  footer: {
    orgName: { type: String, default: 'PMAFA Gallery' },
    description: { type: String, default: 'Gallery description for footer.' },
    address: { type: String, default: '123 Community Avenue\nNew York, NY 10001' },
    email: { type: String, default: 'info@pmafa.org' },
    phone: { type: String, default: '(555) 123-4567' },
    copyright: { type: String, default: `© ${new Date().getFullYear()} PMAFA. All rights reserved.` }
  }
}, {
  timestamps: true,
  versionKey: false
});

galleryPageSchema.statics.getSingleton = async function () {
  console.log('[getSingleton] Attempting findOne...');
  let doc;
  try {
    doc = await this.findOne();
    console.log(`[getSingleton] findOne result: ${doc ? 'Found Document' : 'Not Found'}`);
    if (!doc) {
      console.log('[getSingleton] No document found, creating default...');
      doc = new this();
      console.log('[getSingleton] Attempting to save new default document...');
      await doc.save();
      console.log('[getSingleton] New default document saved successfully.');
      doc = await this.findOne();
      console.log(`[getSingleton] Re-fetched default doc after save: ${doc ? 'Found' : 'Still Not Found!'}`);
    }
  } catch (error) {
    console.error('[getSingleton] Error during find or save:', error);
    throw error;
  }
  return doc;
};

module.exports = mongoose.model('GalleryPage', galleryPageSchema);