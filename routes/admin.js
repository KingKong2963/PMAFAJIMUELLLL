
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

// --- Models ---
const HomePage = require('../models/HomePage');
const ServicesPage = require('../models/ServicesPage');
const GalleryPage = require('../models/GalleryPage');
const ContactPage = require('../models/ContactPage');
const VisionPage = require('../models/VisionPage');
const MissionPage = require('../models/MissionPage');
const GoalsPage = require('../models/GoalsPage');
const ObjectivesPage = require('../models/ObjectivesPage');
const HistoryPage = require('../models/HistoryPage');
const LeadershipPage = require('../models/LeadershipPage');
const BarangayPage = require('../models/BarangayPage');

function ensureAuthenticated(req, res, next) {
  console.log('Session Data:', req.session);
  if (req.session.isAdmin) {
    console.log('User is authenticated, proceeding to route.');
    return next();
  } else {
    console.log('Authentication required, redirecting to login.');
    req.session.loginError = 'Please log in to access the admin area.';
    res.redirect('/login');
  }
}

router.use(ensureAuthenticated);

// --- Multer Configuration ---
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '..', 'public', 'images'));
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }
});

// --- Define Middleware Variables ---
const processAllUploads = upload.any();
const processLogoUpload = upload.single('siteLogoImage');
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    console.error("Multer Error:", err);
    let message = 'Image upload failed.';
    if (err.code === 'LIMIT_FILE_SIZE') message = 'Image too large (Max 10MB).';
    return res.status(400).render('error', { title: 'Upload Error', error: message, details: err.field || err.code });
  } else if (err && err.message === 'Only image files are allowed!') {
    console.error("File Type Error:", err);
    return res.status(400).render('error', { title: 'Upload Error', error: 'Invalid file type.', details: 'Only image files are allowed.' });
  } else if (err) {
    console.error("Unknown Upload Error:", err);
    return res.status(500).render('error', { title: 'Server Error', error: 'Error during file upload.', details: err.message });
  }
  next();
};
// --- End Middleware Definitions ---

// --- Admin Routes ---

// Dashboard
router.get('/dashboard', async (req, res) => {
  try {
    const leadershipData = await LeadershipPage.getSingleton();
    const barangayData = await BarangayPage.getSingleton();

    const mayorCount = leadershipData?.leadershipSection?.mayor?.name ? 1 : 0;
    const presidentCount = leadershipData?.leadershipSection?.president?.name ? 1 : 0;
    const teamMemberCount = leadershipData?.leadershipSection?.teamMembers?.length ?? 0;
    const totalLeadership = mayorCount + presidentCount + teamMemberCount;

    const barangayCount = barangayData?.mainSection?.barangays?.length ?? 0;

    res.render('admin/dashboard', {
      title: 'Admin Dashboard',
      currentPage: 'dashboard',
      stats: {
        totalLeadership,
        mayorCount,
        presidentCount,
        teamMemberCount,
        barangayCount
      },
      barangayList: barangayData?.mainSection?.barangays || []
    });
  } catch (err) {
    console.error("Error loading dashboard data:", err);
    res.status(500).render('error', {
      title: 'Server Error',
      error: 'Failed to load dashboard data.',
      details: err.message
    });
  }
});

router.get('/edit-home', async (req, res) => {
  try {
    let homeData = await HomePage.findOne();
    if (!homeData) {
      homeData = await new HomePage().save();
    }
    res.render('admin/edit-home', {
      homeData,
      title: 'Edit Home Page (Preview)',
      currentPage: 'edit-home'
    });
  } catch (err) {
    console.error('Error loading home page edit form:', err);
    res.status(500).render('error', {
      title: 'Server Error',
      error: 'Failed to load the home page form.',
      details: err.message
    });
  }
});

router.post('/edit-home', processAllUploads, handleMulterError, async (req, res) => {
  try {
    let homeData = await HomePage.findOne();
    if (!homeData) {
      return res.status(404).render('error', { title: 'Error', error: 'Cannot update missing home page data.', details: 'Data not found in database.' });
    }

    const formData = req.body;
    const originalData = homeData.toObject();
    const fileUpdates = {};
    const storyNewImages = {};

    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        const webPath = '/images/' + file.filename;
        if (file.fieldname === 'siteLogoImage') fileUpdates['siteLogo'] = webPath;
        if (file.fieldname === 'heroBackgroundImage') fileUpdates['hero.backgroundImage'] = webPath;
        const storyNewMatch = file.fieldname.match(/^newStoryImages\[(\d+)\]\[\]$/);
        if (storyNewMatch) {
          const index = storyNewMatch[1];
          if (!storyNewImages[index]) storyNewImages[index] = [];
          storyNewImages[index].push(webPath);
        }
        const testimonialMatch = file.fieldname.match(/^testimonialImage_(\d+)$/);
        if (testimonialMatch) fileUpdates[`testimonials.testimonials.${testimonialMatch[1]}.image`] = webPath;
      });
    }

    if (!homeData.hero) homeData.hero = {};
    if (!homeData.featuredStories) homeData.featuredStories = { stories: [] };
    if (!homeData.stats) homeData.stats = [];
    if (!homeData.testimonials) homeData.testimonials = { testimonials: [] };
    if (!homeData.footer) homeData.footer = {};

    homeData.siteLogo = fileUpdates['siteLogo'] || homeData.siteLogo || '/images/default-logo.png';

    homeData.hero.backgroundImage = fileUpdates['hero.backgroundImage'] || homeData.hero.backgroundImage;
    homeData.hero.title = formData['hero.title'] ?? homeData.hero.title;
    homeData.hero.subtitle = formData['hero.subtitle'] ?? homeData.hero.subtitle;
    if (!homeData.hero.button1) homeData.hero.button1 = {};
    homeData.hero.button1.text = formData['hero.button1.text'] ?? homeData.hero.button1.text;
    if (!homeData.hero.button2) homeData.hero.button2 = {};
    homeData.hero.button2.text = formData['hero.button2.text'] ?? homeData.hero.button2.text;

    homeData.featuredStories.title = formData['featuredStories.title'] ?? homeData.featuredStories.title;
    homeData.featuredStories.subtitle = formData['featuredStories.subtitle'] ?? homeData.featuredStories.subtitle;
    if (!homeData.featuredStories.viewAllLink) homeData.featuredStories.viewAllLink = {};
    homeData.featuredStories.viewAllLink.text = formData['featuredStories.viewAllLink.text'] ?? homeData.featuredStories.viewAllLink.text;

    const updatedStories = [];
    let storyIndex = 0;
    while (formData[`featuredStories.stories[${storyIndex}].title`] !== undefined || 
           formData[`featuredStories.stories[${storyIndex}].description`] !== undefined || 
           storyNewImages[storyIndex] || 
           (formData.existingStoryImages && formData.existingStoryImages[storyIndex]) || 
           formData[`featuredStories.stories[${storyIndex}].embedLink`]) {
      const existingStory = homeData.featuredStories.stories?.[storyIndex] || {};
      const title = formData[`featuredStories.stories[${storyIndex}].title`];
      const description = formData[`featuredStories.stories[${storyIndex}].description`];
      const contentType = formData[`featuredStories.stories[${storyIndex}].contentType`] || 'images';
      let keptImages = (formData.existingStoryImages && formData.existingStoryImages[storyIndex]) || [];
      if (!Array.isArray(keptImages)) keptImages = [keptImages].filter(Boolean);
      const newImages = storyNewImages[storyIndex] || [];
      const images = contentType === 'images' ? [...keptImages, ...newImages] : [];
      const embedLink = contentType === 'embed' ? formData[`featuredStories.stories[${storyIndex}].embedLink`] : '';

      if (title || description || images.length > 0 || embedLink) {
        updatedStories.push({
          contentType: contentType,
          images: images,
          embedLink: embedLink || '',
          tag: existingStory.tag || 'Story',
          tagColor: existingStory.tagColor || 'bg-indigo-600 text-white',
          link: existingStory.link || '#',
          title: title || '',
          description: description || ''
        });
      }
      storyIndex++;
    }
    homeData.featuredStories.stories = updatedStories;

    const updatedStats = [];
    for (let i = 0; i < 4; i++) {
      updatedStats.push({
        value: formData[`stats[${i}].value`] ?? homeData.stats?.[i]?.value ?? '0',
        label: formData[`stats[${i}].label`] ?? homeData.stats?.[i]?.label ?? 'Stat'
      });
    }
    homeData.stats = updatedStats;

    homeData.testimonials.title = formData['testimonials.title'] ?? homeData.testimonials.title;
    homeData.testimonials.subtitle = formData['testimonials.subtitle'] ?? homeData.testimonials.subtitle;

    const updatedTestimonials = [];
    let testimonialIndex = 0;
    while (formData[`testimonials.testimonials[${testimonialIndex}].quote`] !== undefined || 
           formData[`testimonials.testimonials[${testimonialIndex}].name`] !== undefined || 
           fileUpdates[`testimonials.testimonials.${testimonialIndex}.image`]) {
      const existingTestimonial = homeData.testimonials.testimonials?.[testimonialIndex] || {};
      const uploadedImagePath = fileUpdates[`testimonials.testimonials.${testimonialIndex}.image`];
      const quote = formData[`testimonials.testimonials[${testimonialIndex}].quote`];
      const name = formData[`testimonials.testimonials[${testimonialIndex}].name`];

      if (quote || name || uploadedImagePath) {
        updatedTestimonials.push({
          image: uploadedImagePath || existingTestimonial.image || '/images/default-testimonial.jpg',
          quote: quote || '',
          name: name || '',
          origin: formData[`testimonials.testimonials[${testimonialIndex}].origin`] || ''
        });
      }
      testimonialIndex++;
    }
    homeData.testimonials.testimonials = updatedTestimonials;

    homeData.footer.orgName = formData['footer.orgName'] ?? homeData.footer.orgName;
    homeData.footer.address = formData['footer.address'] ?? homeData.footer.address;
    homeData.footer.email = formData['footer.email'] ?? homeData.footer.email;
    homeData.footer.phone = formData['footer.phone'] ?? homeData.footer.phone;
    homeData.footer.copyright = formData['footer.copyright'] ?? homeData.footer.copyright;

    homeData.markModified('featuredStories.stories');
    homeData.markModified('testimonials.testimonials');
    homeData.markModified('stats');

    await homeData.save();
    console.log('Home page data updated successfully.');
    res.redirect('/admin/edit-home');
  } catch (err) {
    console.error('Error saving home page data:', err);
    if (err.name === 'ValidationError') {
      return res.status(400).render('error', { title: 'Validation Error', error: 'Failed to save: Check input values.', details: err.message });
    }
    res.status(500).render('error', { title: 'Server Error', error: 'Failed to save home page data.', details: err.message });
  }
});

// --- Services Page Routes ---
router.get('/edit-services', async (req, res) => {
  try {
    const servicesData = await ServicesPage.getSingleton();
    if (!servicesData) {
      return res.status(404).render('error', { title: 'Error', error: 'Services page data not found.', details: 'Data not found in database.' });
    }
    res.render('admin/edit-services', {
      servicesData,
      title: 'Edit Services Page (Preview)',
      currentPage: 'edit-services'
    });
  } catch (err) {
    console.error('Error loading services edit form:', err);
    res.status(500).render('error', {
      title: 'Server Error',
      error: 'Failed to load services edit form.',
      details: err.message
    });
  }
});

router.post('/edit-services', processAllUploads, handleMulterError, async (req, res) => {
  try {
    let servicesData = await ServicesPage.getSingleton();
    if (!servicesData) {
      return res.status(404).render('error', { title: 'Error', error: 'Services data not found.', details: 'Data not found in database.' });
    }
    const formData = req.body;
    const originalData = servicesData.toObject();
    const fileUpdates = {};
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        const webPath = '/images/' + file.filename;
        if (file.fieldname === 'heroBackgroundImage') fileUpdates['hero.backgroundImage'] = webPath;
        const serviceMatch = file.fieldname.match(/^serviceImage_(\d+)$/);
        if (serviceMatch) fileUpdates[`servicesSection.services.${serviceMatch[1]}.image`] = webPath;
      });
    }
    servicesData.hero = {
      ...originalData.hero,
      backgroundImage: fileUpdates['hero.backgroundImage'] || originalData.hero?.backgroundImage,
      title: formData['hero.title'] ?? originalData.hero?.title,
      subtitle: formData['hero.subtitle'] ?? originalData.hero?.subtitle,
      buttonText: formData['hero.buttonText'] ?? originalData.hero?.buttonText
    };
    servicesData.servicesSection = {
      ...originalData.servicesSection,
      title: formData['servicesSection.title'] ?? originalData.servicesSection?.title,
      subtitle: formData['servicesSection.subtitle'] ?? originalData.servicesSection?.subtitle,
      services: []
    };
    let serviceIndex = 0;
    while (formData[`services[${serviceIndex}].title`] !== undefined || formData[`services[${serviceIndex}].description`] !== undefined) {
      const existingService = originalData.servicesSection?.services?.[serviceIndex] || {};
      servicesData.servicesSection.services.push({
        icon: existingService.icon || 'fas fa-concierge-bell',
        title: formData[`services[${serviceIndex}].title`] || '',
        description: formData[`services[${serviceIndex}].description`] || '',
        image: fileUpdates[`servicesSection.services.${serviceIndex}.image`] || existingService.image || '/images/placeholder-service.jpg',
        link: existingService.link || '#'
      });
      serviceIndex++;
    }
    if (servicesData.servicesSection.services.length === 0) {
      console.warn("No services submitted for services page.");
    }
    await servicesData.save();
    console.log('Services page data updated successfully.');
    res.redirect('/admin/edit-services');
  } catch (err) {
    console.error('Error updating services page data:', err);
    if (err.name === 'ValidationError') {
      return res.status(400).render('error', { title: 'Validation Error', error: 'Failed to update: Check input values.', details: err.message });
    }
    res.status(500).render('error', { title: 'Server Error', error: 'Failed to update services page data.', details: err.message });
  }
});

// --- Gallery Page Routes ---
router.get('/edit-gallery', async (req, res) => {
  try {
    const galleryData = await GalleryPage.getSingleton();
    if (!galleryData) {
      return res.status(404).render('error', { title: 'Error', error: 'Gallery page data not found.', details: 'Data not found in database.' });
    }
    res.render('admin/edit-gallery', {
      galleryData,
      title: 'Edit Gallery Page (Preview)',
      currentPage: 'edit-gallery'
    });
  } catch (err) {
    console.error('Error loading gallery edit form:', err);
    res.status(500).render('error', {
      title: 'Server Error',
      error: 'Failed to load gallery edit form.',
      details: err.message
    });
  }
});

router.post('/edit-gallery', processAllUploads, handleMulterError, async (req, res) => {
  try {
    let galleryData = await GalleryPage.getSingleton();
    if (!galleryData) {
      return res.status(404).render('error', { title: 'Error', error: 'Gallery data not found.', details: 'Data not found in database.' });
    }
    const formData = req.body;
    const originalData = galleryData.toObject();
    const fileUpdates = {};
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        const webPath = '/images/' + file.filename;
        if (file.fieldname === 'heroBackgroundImage') fileUpdates['hero.backgroundImage'] = webPath;
        const galleryMatch = file.fieldname.match(/^galleryImage_(\d+)$/);
        if (galleryMatch) fileUpdates[`gallerySection.items.${galleryMatch[1]}.image`] = webPath;
      });
    }

    // Update hero section
    galleryData.hero = {
      ...originalData.hero,
      backgroundImage: fileUpdates['hero.backgroundImage'] || originalData.hero?.backgroundImage,
      title: formData['hero.title'] ?? originalData.hero?.title,
      subtitle: formData['hero.subtitle'] ?? originalData.hero?.subtitle,
      buttonText: formData['hero.buttonText'] ?? originalData.hero?.buttonText
    };

    // Update gallery section
    galleryData.gallerySection = {
      ...originalData.gallerySection,
      title: formData['gallerySection.title'] ?? originalData.gallerySection?.title,
      subtitle: formData['gallerySection.subtitle'] ?? originalData.gallerySection?.subtitle,
      items: []
    };

    // Handle categories and subcategories
    const newCategories = [];
    let categoryIndex = 0;
    while (formData[`gallerySection.categories[${categoryIndex}].name`]) {
      const catName = formData[`gallerySection.categories[${categoryIndex}].name`]?.toLowerCase().trim();
      if (catName) {
        const subcategories = formData[`gallerySection.categories[${categoryIndex}].subcategories`] || [];
        const cleanedSubcategories = (Array.isArray(subcategories) ? subcategories : [subcategories])
          .map(s => s.toLowerCase().trim())
          .filter(s => s !== '')
          .filter((s, i, arr) => arr.indexOf(s) === i); // Ensure uniqueness
        newCategories.push({
          name: catName,
          subcategories: cleanedSubcategories
        });
      }
      categoryIndex++;
    }
    galleryData.gallerySection.categories = newCategories.length > 0 ? newCategories : [{ name: 'community', subcategories: [] }];

    // Update gallery items
    const categoryNames = galleryData.gallerySection.categories.map(c => c.name);
    const subcategoryMap = {};
    galleryData.gallerySection.categories.forEach(c => {
      subcategoryMap[c.name] = c.subcategories || [];
    });

    let itemIndex = 0;
    while (formData[`items[${itemIndex}].title`] !== undefined || formData[`items[${itemIndex}].description`] !== undefined || formData[`items[${itemIndex}].category`] !== undefined) {
      const existingItem = originalData.gallerySection?.items?.[itemIndex] || {};
      const category = formData[`items[${itemIndex}].category`]?.toLowerCase().trim();
      const subcategory = formData[`items[${itemIndex}].subcategory`]?.toLowerCase().trim() || '';
      // Only include items with valid categories
      if (category && categoryNames.includes(category) && (!subcategory || subcategoryMap[category].includes(subcategory))) {
        galleryData.gallerySection.items.push({
          title: formData[`items[${itemIndex}].title`] || '',
          description: formData[`items[${itemIndex}].description`] || '',
          category: category,
          subcategory: subcategory,
          image: fileUpdates[`gallerySection.items.${itemIndex}.image`] || existingItem.image || '/images/placeholder-gallery.jpg'
        });
      }
      itemIndex++;
    }

    // Update footer
    galleryData.footer = {
      ...originalData.footer,
      orgName: formData['footer.orgName'] ?? originalData.footer?.orgName,
      description: formData['footer.description'] ?? originalData.footer?.description,
      address: formData['footer.address'] ?? originalData.footer?.address,
      email: formData['footer.email'] ?? originalData.footer?.email,
      phone: formData['footer.phone'] ?? originalData.footer?.phone,
      copyright: formData['footer.copyright'] ?? originalData.footer?.copyright
    };

    galleryData.markModified('gallerySection.items');
    galleryData.markModified('gallerySection.categories');

    await galleryData.save();
    console.log('Gallery page data updated successfully.');
    res.redirect('/admin/edit-gallery');
  } catch (err) {
    console.error('Error updating gallery page data:', err);
    if (err.name === 'ValidationError') {
      return res.status(400).render('error', { title: 'Validation Error', error: 'Failed to update: Check input values.', details: err.message });
    }
    res.status(500).render('error', { title: 'Server Error', error: 'Failed to update gallery page data.', details: err.message });
  }
});

// --- Contact Page Routes ---
router.get('/edit-contact', async (req, res) => {
  try {
    const contactData = await ContactPage.getSingleton();
    if (!contactData) {
      return res.status(404).render('error', { title: 'Error', error: 'Contact page data not found.', details: 'Data not found in database.' });
    }
    res.render('admin/edit-contact', {
      contactData,
      title: 'Edit Contact Page (Preview)',
      currentPage: 'edit-contact'
    });
  } catch (err) {
    console.error('Error loading contact edit form:', err);
    res.status(500).render('error', {
      title: 'Server Error',
      error: 'Failed to load contact edit form.',
      details: err.message
    });
  }
});

router.post('/edit-contact', processAllUploads, handleMulterError, async (req, res) => {
  try {
    let contactData = await ContactPage.getSingleton();
    if (!contactData) {
      return res.status(404).render('error', { title: 'Error', error: 'Contact data not found.', details: 'Data not found in database.' });
    }
    const formData = req.body;
    const originalData = contactData.toObject(); // Get a plain JS object for reliable access to original values
    const fileUpdates = {};

    // Process uploaded files
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        const webPath = '/images/' + file.filename;
        // Specifically check for the hero background image upload
        if (file.fieldname === 'heroBackgroundImage') {
          fileUpdates['hero.backgroundImage'] = webPath;
        }
        // Add other file.fieldname checks here if you add more image uploads to this form
      });
    }

    // Ensure nested objects exist before assigning to them or spreading them
    contactData.hero = contactData.hero || {};
    contactData.formSection = contactData.formSection || {};
    contactData.infoSection = contactData.infoSection || {};
    contactData.infoSection.address = contactData.infoSection.address || {};
    contactData.infoSection.phone = contactData.infoSection.phone || {};
    contactData.infoSection.email = contactData.infoSection.email || {};
    contactData.footer = contactData.footer || {};

    // Update Hero Section
    contactData.hero = {
      ...originalData.hero, // Preserve other original hero properties
      title: formData['hero.title'] ?? originalData.hero?.title,
      subtitle: formData['hero.subtitle'] ?? originalData.hero?.subtitle,
      buttonText: formData['hero.buttonText'] ?? originalData.hero?.buttonText,
      // Use the new image if uploaded, otherwise keep the existing one or the default
      backgroundImage: fileUpdates['hero.backgroundImage'] || originalData.hero?.backgroundImage || '/images/default-contact-hero.jpg'
    };

    // Update Form Section
    contactData.formSection = {
      ...originalData.formSection,
      title: formData['formSection.title'] ?? originalData.formSection?.title,
      subtitle: formData['formSection.subtitle'] ?? originalData.formSection?.subtitle,
      formRecipientEmail: formData['formSection.formRecipientEmail'] ?? originalData.formSection?.formRecipientEmail
    };

    // Update Info Section
    contactData.infoSection = {
      ...originalData.infoSection,
      title: formData['infoSection.title'] ?? originalData.infoSection?.title,
      subtitle: formData['infoSection.subtitle'] ?? originalData.infoSection?.subtitle,
      address: {
        ...originalData.infoSection?.address,
        icon: originalData.infoSection?.address?.icon ?? 'fas fa-map-marker-alt',
        lines: formData['infoSection.address.lines'] ?? originalData.infoSection?.address?.lines
      },
      phone: {
        ...originalData.infoSection?.phone,
        icon: originalData.infoSection?.phone?.icon ?? 'fas fa-phone-alt',
        number: formData['infoSection.phone.number'] ?? originalData.infoSection?.phone?.number,
        link: `tel:${(formData['infoSection.phone.number'] ?? originalData.infoSection?.phone?.number)?.replace(/\D/g,'')}`
      },
      email: {
        ...originalData.infoSection?.email,
        icon: originalData.infoSection?.email?.icon ?? 'fas fa-envelope',
        address: formData['infoSection.email.address'] ?? originalData.infoSection?.email?.address,
        link: `mailto:${formData['infoSection.email.address'] ?? originalData.infoSection?.email?.address}`
      },
      mapEmbedUrl: formData['infoSection.mapEmbedUrl'] ?? originalData.infoSection?.mapEmbedUrl
    };

    // Update Footer Section
    contactData.footer = {
      ...originalData.footer,
      orgName: formData['footer.orgName'] ?? originalData.footer?.orgName,
      description: formData['footer.description'] ?? originalData.footer?.description,
      address: formData['footer.address'] ?? originalData.footer?.address,
      email: formData['footer.email'] ?? originalData.footer?.email,
      phone: formData['footer.phone'] ?? originalData.footer?.phone,
      copyright: formData['footer.copyright'] ?? originalData.footer?.copyright
    };
    
    // Explicitly mark nested paths as modified if direct assignment isn't always detected
    contactData.markModified('hero');
    contactData.markModified('formSection');
    contactData.markModified('infoSection');
    contactData.markModified('footer');

    await contactData.save();
    console.log('Contact page data updated successfully.');
    res.redirect('/admin/edit-contact');
  } catch (err) {
    console.error('Error updating contact page data:', err);
    if (err.name === 'ValidationError') {
      return res.status(400).render('error', { title: 'Validation Error', error: 'Failed to update: Check input values.', details: err.message });
    }
    res.status(500).render('error', { title: 'Server Error', error: 'Failed to update contact page data.', details: err.message });
  }
});

// --- Vision Page Routes ---
router.get('/edit-vision', async (req, res) => {
  try {
    const visionData = await VisionPage.getSingleton();
    if (!visionData) {
      return res.status(404).render('error', { title: 'Error', error: 'Vision page data not found.', details: 'Data not found.' });
    }
    res.render('admin/edit-vision', {
      visionData,
      title: 'Edit Vision Page (Preview)',
      currentPage: 'edit-vision'
    });
  } catch (err) {
    console.error('Error loading vision edit form:', err);
    res.status(500).render('error', {
      title: 'Server Error',
      error: 'Failed to load vision edit form.',
      details: err.message
    });
  }
});

router.post('/edit-vision', processAllUploads, handleMulterError, async (req, res) => {
  try {
    let visionData = await VisionPage.getSingleton();
    if (!visionData) {
      return res.status(404).render('error', { title: 'Error', error: 'Vision data not found.', details: 'Data not found.' });
    }
    const formData = req.body;
    const originalData = visionData.toObject();
    const fileUpdates = {};
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        const webPath = '/images/' + file.filename;
        if (file.fieldname === 'heroBackgroundImage') fileUpdates['hero.backgroundImage'] = webPath;
      });
    }
    visionData.hero = {
      ...originalData.hero,
      backgroundImage: fileUpdates['hero.backgroundImage'] || originalData.hero?.backgroundImage,
      title: formData['hero.title'] ?? originalData.hero?.title,
      subtitle: formData['hero.subtitle'] ?? originalData.hero?.subtitle,
    };
    visionData.content = {
      ...originalData.content,
      title: formData['content.title'] ?? originalData.content?.title,
      body: formData['content.body'] ?? originalData.content?.body,
    };
    await visionData.save();
    console.log('Vision page data updated successfully.');
    res.redirect('/admin/edit-vision');
  } catch (err) {
    console.error('Error updating vision page data:', err);
    if (err.name === 'ValidationError') {
      return res.status(400).render('error', { title: 'Validation Error', error: 'Failed to update: Check input values.', details: err.message });
    }
    res.status(500).render('error', { title: 'Server Error', error: 'Failed to update vision page data.', details: err.message });
  }
});

// --- Mission Page Routes ---
router.get('/edit-mission', async (req, res) => {
  try {
    const missionData = await MissionPage.getSingleton();
    if (!missionData) {
      return res.status(404).render('error', { title: 'Error', error: 'Mission page data not found.', details: 'Data not found.' });
    }
    res.render('admin/edit-mission', {
      missionData,
      title: 'Edit Mission Page (Preview)',
      currentPage: 'edit-mission'
    });
  } catch (err) {
    console.error('Error loading mission edit form:', err);
    res.status(500).render('error', {
      title: 'Server Error',
      error: 'Failed to load mission edit form.',
      details: err.message
    });
  }
});

router.post('/edit-mission', processAllUploads, handleMulterError, async (req, res) => {
  try {
    let missionData = await MissionPage.getSingleton();
    if (!missionData) {
      return res.status(404).render('error', { title: 'Error', error: 'Mission data not found.', details: 'Data not found.' });
    }
    const formData = req.body;
    const originalData = missionData.toObject();
    const fileUpdates = {};
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        const webPath = '/images/' + file.filename;
        if (file.fieldname === 'heroBackgroundImage') fileUpdates['hero.backgroundImage'] = webPath;
      });
    }
    missionData.hero = {
      ...originalData.hero,
      backgroundImage: fileUpdates['hero.backgroundImage'] || originalData.hero?.backgroundImage,
      title: formData['hero.title'] ?? originalData.hero?.title,
      subtitle: formData['hero.subtitle'] ?? originalData.hero?.subtitle,
    };
    missionData.content = {
      ...originalData.content,
      title: formData['content.title'] ?? originalData.content?.title,
      body: formData['content.body'] ?? originalData.content?.body,
    };
    await missionData.save();
    console.log('Mission page data updated successfully.');
    res.redirect('/admin/edit-mission');
  } catch (err) {
    console.error('Error updating mission page data:', err);
    if (err.name === 'ValidationError') {
      return res.status(400).render('error', { title: 'Validation Error', error: 'Failed to update: Check input values.', details: err.message });
    }
    res.status(500).render('error', { title: 'Server Error', error: 'Failed to update mission page data.', details: err.message });
  }
});

// --- Goals Page Routes ---
router.get('/edit-goals', async (req, res) => {
  try {
    const goalsData = await GoalsPage.getSingleton();
    if (!goalsData) {
      return res.status(404).render('error', { title: 'Error', error: 'Goals page data not found.', details: 'Data not found.' });
    }
    res.render('admin/edit-goals', {
      goalsData,
      title: 'Edit Goals Page (Preview)',
      currentPage: 'edit-goals'
    });
  } catch (err) {
    console.error('Error loading goals edit form:', err);
    res.status(500).render('error', {
      title: 'Server Error',
      error: 'Failed to load goals edit form.',
      details: err.message
    });
  }
});

router.post('/edit-goals', processAllUploads, handleMulterError, async (req, res) => {
  try {
    let goalsData = await GoalsPage.getSingleton();
    if (!goalsData) {
      return res.status(404).render('error', { title: 'Error', error: 'Goals data not found.', details: 'Data not found.' });
    }

    const formData = req.body;
    const originalData = goalsData.toObject();
    const fileUpdates = {};

    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        const webPath = '/images/' + file.filename;
        if (file.fieldname === 'heroBackgroundImage') fileUpdates['hero.backgroundImage'] = webPath;
      });
    }

    goalsData.hero = {
      ...originalData.hero,
      backgroundImage: fileUpdates['hero.backgroundImage'] || originalData.hero?.backgroundImage,
      title: formData['hero.title'] ?? originalData.hero?.title,
      subtitle: formData['hero.subtitle'] ?? originalData.hero?.subtitle,
    };

    goalsData.content = {
      ...originalData.content,
      title: formData['content.title'] ?? originalData.content?.title,
      goals: []
    };
    if (Array.isArray(formData['content.goals'])) {
      goalsData.content.goals = formData['content.goals']
        .map(goal => (goal || '').trim())
        .filter(goal => goal !== '');
    } else if (typeof formData['content.goals'] === 'string' && formData['content.goals'].trim() !== '') {
      goalsData.content.goals = [formData['content.goals'].trim()];
    }

    console.log("Processed goals array:", goalsData.content.goals);

    if (goalsData.content.goals.length === 0) {
      console.warn("No goals submitted or all goals were empty.");
    }

    await goalsData.save();
    console.log('Goals page data updated successfully.');
    res.redirect('/admin/edit-goals');
  } catch (err) {
    console.error('Error updating goals page data:', err);
    if (err.name === 'ValidationError') {
      return res.status(400).render('error', { title: 'Validation Error', error: 'Failed to update: Check input values.', details: err.message });
    }
    res.status(500).render('error', { title: 'Server Error', error: 'Failed to update goals page data.', details: err.message });
  }
});

// --- Objectives Page Routes ---
router.get('/edit-objectives', async (req, res) => {
  try {
    const objectivesData = await ObjectivesPage.getSingleton();
    if (!objectivesData) {
      return res.status(404).render('error', { title: 'Error', error: 'Objectives page data not found.' });
    }
    res.render('admin/edit-objectives', {
      objectivesData,
      title: 'Edit Objectives Page (Preview)',
      currentPage: 'edit-objectives'
    });
  } catch (err) {
    console.error('Error loading objectives edit form:', err);
    res.status(500).render('error', {
      title: 'Server Error',
      error: 'Failed to load objectives edit form.',
      details: err.message
    });
  }
});

router.post('/edit-objectives', processAllUploads, handleMulterError, async (req, res) => {
  try {
    let objectivesData = await ObjectivesPage.getSingleton();
    if (!objectivesData) {
      return res.status(404).render('error', { title: 'Error', error: 'Objectives data not found.' });
    }

    const formData = req.body;
    const originalData = objectivesData.toObject();
    const fileUpdates = {};

    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        const webPath = '/images/' + file.filename;
        if (file.fieldname === 'heroBackgroundImage') fileUpdates['hero.backgroundImage'] = webPath;
      });
    }

    objectivesData.hero = {
      ...originalData.hero,
      backgroundImage: fileUpdates['hero.backgroundImage'] || originalData.hero?.backgroundImage,
      title: formData['hero.title'] ?? originalData.hero?.title,
      subtitle: formData['hero.subtitle'] ?? originalData.hero?.subtitle,
    };

    objectivesData.content = {
      ...originalData.content,
      title: formData['content.title'] ?? originalData.content?.title,
      objectives: []
    };
    if (Array.isArray(formData['content.objectives'])) {
      objectivesData.content.objectives = formData['content.objectives']
        .map(obj => (obj || '').trim())
        .filter(obj => obj !== '');
    } else if (typeof formData['content.objectives'] === 'string' && formData['content.objectives'].trim() !== '') {
      objectivesData.content.objectives = [formData['content.objectives'].trim()];
    }

    console.log("Processed objectives array:", objectivesData.content.objectives);

    if (objectivesData.content.objectives.length === 0) {
      console.warn("No objectives submitted for objectives page.");
    }

    await objectivesData.save();
    console.log('Objectives page data updated successfully.');
    res.redirect('/admin/edit-objectives');
  } catch (err) {
    console.error('Error updating objectives page data:', err);
    if (err.name === 'ValidationError') {
      return res.status(400).render('error', { title: 'Validation Error', error: 'Failed to update: Check input values.', details: err.message });
    }
    res.status(500).render('error', { title: 'Server Error', error: 'Failed to update objectives page data.', details: err.message });
  }
});

// --- History Page Routes ---
router.get('/edit-history', async (req, res) => {
  try {
    const historyData = await HistoryPage.getSingleton();
    if (!historyData) {
      return res.status(404).render('error', { title: 'Error', error: 'History page data not found.' });
    }
    res.render('admin/edit-history', {
      historyData,
      title: 'Edit History Page (Preview)',
      currentPage: 'edit-history'
    });
  } catch (err) {
    console.error('Error loading history edit form:', err);
    res.status(500).render('error', {
      title: 'Server Error',
      error: 'Failed to load history edit form.',
      details: err.message
    });
  }
});

router.post('/edit-history', processAllUploads, handleMulterError, async (req, res) => {
  try {
    let historyData = await HistoryPage.getSingleton();
    if (!historyData) {
      return res.status(404).render('error', { title: 'Error', error: 'History data not found.' });
    }

    const formData = req.body;
    const originalData = historyData.toObject();
    const fileUpdates = {};

    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        const webPath = '/images/' + file.filename;
        if (file.fieldname === 'heroBackgroundImage') fileUpdates['hero.backgroundImage'] = webPath;
      });
    }

    historyData.hero = {
      ...originalData.hero,
      backgroundImage: fileUpdates['hero.backgroundImage'] || originalData.hero?.backgroundImage,
      title: formData['hero.title'] ?? originalData.hero?.title,
      subtitle: formData['hero.subtitle'] ?? originalData.hero?.subtitle,
    };

    historyData.content = {
      ...originalData.content,
      title: formData['content.title'] ?? originalData.content?.title,
      timelineEvents: []
    };
    let eventIndex = 0;
    while (formData[`events[${eventIndex}].year`] !== undefined || formData[`events[${eventIndex}].title`] !== undefined || formData[`events[${eventIndex}].description`] !== undefined) {
      historyData.content.timelineEvents.push({
        year: formData[`events[${eventIndex}].year`] || '',
        title: formData[`events[${eventIndex}].title`] || '',
        description: formData[`events[${eventIndex}].description`] || ''
      });
      eventIndex++;
    }

    if (historyData.content.timelineEvents.length === 0) {
      console.warn("No timeline events submitted for history page.");
    }

    await historyData.save();
    console.log('History page data updated successfully.');
    res.redirect('/admin/edit-history');
  } catch (err) {
    console.error('Error updating history page data:', err);
    if (err.name === 'ValidationError') {
      return res.status(400).render('error', { title: 'Validation Error', error: 'Failed to update: Check input values.', details: err.message });
    }
    res.status(500).render('error', { title: 'Server Error', error: 'Failed to update history page data.', details: err.message });
  }
});

// --- Leadership Page Routes ---
router.get('/edit-leadership', async (req, res) => {
  try {
    const leadershipData = await LeadershipPage.getSingleton();
    if (!leadershipData) {
      console.warn("Leadership data not found, rendering edit page with empty data.");
      return res.render('admin/edit-leadership', {
        leadershipData: {},
        title: 'Edit Leadership Page (New Data)',
        currentPage: 'edit-leadership'
      });
    }
    res.render('admin/edit-leadership', {
      leadershipData,
      title: 'Edit Leadership Page',
      currentPage: 'edit-leadership'
    });
  } catch (err) {
    console.error('Error loading leadership edit form:', err);
    res.status(500).render('error', {
      title: 'Server Error',
      error: 'Failed to load leadership edit form.',
      details: err.message
    });
  }
});

router.post('/edit-leadership', processAllUploads, handleMulterError, async (req, res) => {
  try {
    let leadershipData = await LeadershipPage.getSingleton();
    // No need for 'isNew' check here if getSingleton ensures the doc exists with defaults
    
    const formData = req.body;
    const originalData = leadershipData.toObject(); // Get plain object for reliable original values
    const fileUpdates = {};

    // console.log("--- Processing /edit-leadership POST ---");
    // console.log("FormData received:", JSON.stringify(formData, null, 2));
    // console.log("Files received:", req.files);

    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        const webPath = '/images/' + file.filename;
        // console.log(`File Process: ${file.fieldname} -> ${webPath}`);
        if (file.fieldname === 'heroBackgroundImage') {
             fileUpdates['hero.backgroundImage'] = webPath;
        }
        if (file.fieldname === 'mayorImage') {
            fileUpdates['leadershipSection.mayor.image'] = webPath;
        }
        if (file.fieldname === 'presidentImage') {
            fileUpdates['leadershipSection.president.image'] = webPath;
        }
        const teamMatch = file.fieldname.match(/^teamMemberImage_(\d+)$/);
        if (teamMatch) {
            fileUpdates[`leadershipSection.teamMembers.${teamMatch[1]}.image`] = webPath;
        }
      });
    }
    // console.log("FileUpdates:", fileUpdates);

    // Ensure nested objects exist before assigning
    leadershipData.hero = leadershipData.hero || {};
    leadershipData.leadershipSection = leadershipData.leadershipSection || {};
    leadershipData.leadershipSection.mayor = leadershipData.leadershipSection.mayor || {};
    leadershipData.leadershipSection.president = leadershipData.leadershipSection.president || {};
    leadershipData.leadershipSection.teamMembers = leadershipData.leadershipSection.teamMembers || [];

    // Hero section
    leadershipData.hero = {
        ...originalData.hero, // Preserve other original hero properties
        title: formData['hero.title'] ?? originalData.hero?.title,
        subtitle: formData['hero.subtitle'] ?? originalData.hero?.subtitle,
        buttonText: formData['hero.buttonText'] ?? originalData.hero?.buttonText,
        backgroundImage: fileUpdates['hero.backgroundImage'] || originalData.hero?.backgroundImage || '/images/default-leadership-hero.jpg'
    };
    // console.log("Hero object state:", leadershipData.hero);

    // Leadership Section Titles
    leadershipData.leadershipSection.title = formData['leadershipSection.title'] ?? originalData.leadershipSection?.title;
    leadershipData.leadershipSection.subtitle = formData['leadershipSection.subtitle'] ?? originalData.leadershipSection?.subtitle;

    // Mayor
    leadershipData.leadershipSection.mayor = {
        ...originalData.leadershipSection?.mayor,
        name: formData['mayor.name'] ?? originalData.leadershipSection?.mayor?.name,
        title: formData['mayor.title'] ?? originalData.leadershipSection?.mayor?.title,
        bio: formData['mayor.bio'] ?? originalData.leadershipSection?.mayor?.bio,
        email: formData['mayor.email'] ?? originalData.leadershipSection?.mayor?.email,
        tenure: formData['mayor.tenure'] ?? originalData.leadershipSection?.mayor?.tenure,
        achievements: formData['mayor.achievements'] ?? originalData.leadershipSection?.mayor?.achievements,
        image: fileUpdates['leadershipSection.mayor.image'] || originalData.leadershipSection?.mayor?.image || 'https://via.placeholder.com/256x256?text=Mayor',
        link: formData['mayor.link'] ?? originalData.leadershipSection?.mayor?.link
    };

    // President
    leadershipData.leadershipSection.president = {
        ...originalData.leadershipSection?.president,
        name: formData['president.name'] ?? originalData.leadershipSection?.president?.name,
        title: formData['president.title'] ?? originalData.leadershipSection?.president?.title,
        bio: formData['president.bio'] ?? originalData.leadershipSection?.president?.bio,
        email: formData['president.email'] ?? originalData.leadershipSection?.president?.email,
        tenure: formData['president.tenure'] ?? originalData.leadershipSection?.president?.tenure,
        achievements: formData['president.achievements'] ?? originalData.leadershipSection?.president?.achievements,
        image: fileUpdates['leadershipSection.president.image'] || originalData.leadershipSection?.president?.image || 'https://via.placeholder.com/256x256?text=President',
        link: formData['president.link'] ?? originalData.leadershipSection?.president?.link
    };
    
    // Team Members
    const updatedTeamMembers = [];
    let memberIndex = 0;
    // Ensure you only process as many members as there are 'name' fields submitted
    while (typeof formData[`teamMembers[${memberIndex}].name`] !== 'undefined') {
        const existingMember = originalData.leadershipSection?.teamMembers?.[memberIndex] || {};
        const uploadedImagePath = fileUpdates[`leadershipSection.teamMembers.${memberIndex}.image`];
        
        updatedTeamMembers.push({
            name: formData[`teamMembers[${memberIndex}].name`] || '', // Default to empty if somehow undefined after check
            title: formData[`teamMembers[${memberIndex}].title`] || '',
            bio: formData[`teamMembers[${memberIndex}].bio`] || '',
            email: formData[`teamMembers[${memberIndex}].email`] || '',
            tenure: formData[`teamMembers[${memberIndex}].tenure`] || '',
            achievements: formData[`teamMembers[${memberIndex}].achievements`] || '',
            image: uploadedImagePath || existingMember.image || 'https://via.placeholder.com/128x128?text=Person',
            link: formData[`teamMembers[${memberIndex}].link`] || '#'
        });
        memberIndex++;
    }
    leadershipData.leadershipSection.teamMembers = updatedTeamMembers;
    // console.log("Team Members array state:", leadershipData.leadershipSection.teamMembers);

    leadershipData.markModified('hero');
    leadershipData.markModified('leadershipSection'); // Mark the whole section as it contains nested objects

    // console.log("Data object BEFORE save:", JSON.stringify(leadershipData.toObject(), null, 2));

    await leadershipData.save();
    console.log('Leadership page data updated successfully.');
    res.redirect('/admin/edit-leadership');
  } catch (err) {
    console.error('Error updating leadership page data:', err);
    if (err.name === 'ValidationError') {
      console.error('Validation Error Details:', err.errors);
      return res.status(400).render('error', { title: 'Validation Error', error: 'Failed to update: Check input values.', details: err.message });
    }
    console.error('Full Error Object:', err);
    res.status(500).render('error', { title: 'Server Error', error: 'Failed to update leadership page data.', details: err.message });
  }
});

// --- Barangay Page Routes ---
router.get('/edit-barangay', async (req, res) => {
  try {
    const barangayData = await BarangayPage.getSingleton();
    if (!barangayData) {
      return res.status(404).render('error', { title: 'Error', error: 'Barangay Leadership page data not found.' });
    }
    res.render('admin/edit-barangay', {
      barangayData,
      title: 'Edit Barangay Leadership Page',
      currentPage: 'edit-barangay'
    });
  } catch (err) {
    console.error('Error loading barangay edit form:', err);
    res.status(500).render('error', {
      title: 'Server Error',
      error: 'Failed to load barangay edit form.',
      details: err.message
    });
  }
});

// routes/admin.js
// ... (other requires and middleware: express, router, multer, models, ensureAuthenticated, processAllUploads, handleMulterError)

router.post('/edit-barangay', processAllUploads, handleMulterError, async (req, res) => {
  try {
      let barangayData = await BarangayPage.getSingleton();
      if (!barangayData) {
          console.error("CRITICAL: BarangayPage singleton returned null even after getSingleton call during POST.");
          return res.status(404).render('error', { title: 'Error', error: 'Barangay Leadership data structure not found.' });
      }

      const formData = req.body;
      const originalData = barangayData.toObject(); // Get plain object for reliable access
      const fileUpdates = {};

      // console.log("Received form data for barangay:", JSON.stringify(formData, null, 2));
      // console.log("Received files for barangay:", req.files);

      if (req.files && req.files.length > 0) {
          req.files.forEach(file => {
              const webPath = '/images/' + file.filename;
              if (file.fieldname === 'heroBackgroundImage') { // Check for hero background
                  fileUpdates['hero.backgroundImage'] = webPath;
              }
              const presMatch = file.fieldname.match(/^barangays\[(\d+)\]\.officers\.presidentImageFile$/);
              if (presMatch) {
                  const index = presMatch[1];
                  // console.log(`Found president image for barangay index ${index}: ${webPath}`);
                  if (!fileUpdates[index]) fileUpdates[index] = {};
                  fileUpdates[index].presidentImage = webPath;
              }
          });
      }
      // console.log("Processed file updates for barangay:", fileUpdates);

      // Ensure top-level objects exist
      barangayData.hero = barangayData.hero || {};
      barangayData.mainSection = barangayData.mainSection || {};
      barangayData.mainSection.barangays = barangayData.mainSection.barangays || [];


      barangayData.hero = {
          ...originalData.hero, // Preserve other original hero properties
          title: formData['hero.title'] ?? originalData.hero?.title,
          subtitle: formData['hero.subtitle'] ?? originalData.hero?.subtitle,
          buttonText: formData['hero.buttonText'] ?? originalData.hero?.buttonText,
          backgroundImage: fileUpdates['hero.backgroundImage'] || originalData.hero?.backgroundImage || '/images/default-barangay-hero.jpg' // Apply update
      };

      barangayData.mainSection.title = formData['mainSection.title'] ?? originalData.mainSection?.title;
      barangayData.mainSection.subtitle = formData['mainSection.subtitle'] ?? originalData.mainSection?.subtitle;
      
      const updatedBarangays = [];
      let barangayIndex = 0;
      while (typeof formData[`barangays[${barangayIndex}].name`] !== 'undefined') {
          const originalBrgyOfficers = originalData.mainSection?.barangays?.[barangayIndex]?.officers || {};
          
          let presidentImagePath = formData[`barangays[${barangayIndex}].officers.presidentImage`] || originalBrgyOfficers.presidentImage || 'https://via.placeholder.com/150/cccccc/888888?text=No+Image';
          if (fileUpdates[barangayIndex] && fileUpdates[barangayIndex].presidentImage) {
              presidentImagePath = fileUpdates[barangayIndex].presidentImage;
          }

          const currentBarangayData = {
              name: formData[`barangays[${barangayIndex}].name`] || `Unnamed Barangay ${barangayIndex + 1}`,
              officers: {
                  // Spread original officers first to preserve any fields not in the form
                  ...originalBrgyOfficers,
                  president: formData[`barangays[${barangayIndex}].officers.president`] ?? originalBrgyOfficers.president,
                  presidentImage: presidentImagePath,
                  vicePresident: formData[`barangays[${barangayIndex}].officers.vicePresident`] ?? originalBrgyOfficers.vicePresident,
                  secretary: formData[`barangays[${barangayIndex}].officers.secretary`] ?? originalBrgyOfficers.secretary,
                  asstSecretary: formData[`barangays[${barangayIndex}].officers.asstSecretary`] ?? originalBrgyOfficers.asstSecretary,
                  treasurer: formData[`barangays[${barangayIndex}].officers.treasurer`] ?? originalBrgyOfficers.treasurer,
                  asstTreasurer: formData[`barangays[${barangayIndex}].officers.asstTreasurer`] ?? originalBrgyOfficers.asstTreasurer,
                  auditor: formData[`barangays[${barangayIndex}].officers.auditor`] ?? originalBrgyOfficers.auditor,
                  asstAuditor: formData[`barangays[${barangayIndex}].officers.asstAuditor`] ?? originalBrgyOfficers.asstAuditor,
                  businessManager: formData[`barangays[${barangayIndex}].officers.businessManager`] ?? originalBrgyOfficers.businessManager,
                  asstBusManager: formData[`barangays[${barangayIndex}].officers.asstBusManager`] ?? originalBrgyOfficers.asstBusManager,
                  pio: formData[`barangays[${barangayIndex}].officers.pio`] ?? originalBrgyOfficers.pio,
                  asstPio: formData[`barangays[${barangayIndex}].officers.asstPio`] ?? originalBrgyOfficers.asstPio,
                  muse: formData[`barangays[${barangayIndex}].officers.muse`] ?? originalBrgyOfficers.muse,
                  escort: formData[`barangays[${barangayIndex}].officers.escort`] ?? originalBrgyOfficers.escort,
                  boardOfDirectors: [] // Will be repopulated below
              }
          };

          let directorIndex = 0;
          const directorsPathBase = `barangays[${barangayIndex}].officers.boardOfDirectors`;
          while (
            typeof formData[`${directorsPathBase}[${directorIndex}].title`] !== 'undefined' ||
            typeof formData[`${directorsPathBase}[${directorIndex}].name`] !== 'undefined'
          ) {
            const dirTitle = formData[`${directorsPathBase}[${directorIndex}].title`];
            const dirName = formData[`${directorsPathBase}[${directorIndex}].name`];

            if ((dirTitle && dirTitle.trim() !== '') || (dirName && dirName.trim() !== '')) {
              currentBarangayData.officers.boardOfDirectors.push({
                title: dirTitle || '',
                name: dirName || ''
              });
            }
            directorIndex++;
          }
          updatedBarangays.push(currentBarangayData);
          barangayIndex++;
      }
      barangayData.mainSection.barangays = updatedBarangays;

      // console.log("Final barangayData.mainSection before save:", JSON.stringify(barangayData.mainSection, null, 2));

      barangayData.markModified('hero');
      barangayData.markModified('mainSection'); // Mark the whole mainSection due to array manipulation

      await barangayData.save();
      console.log('Barangay Leadership page data updated successfully.');
      res.redirect('/admin/edit-barangay');
  } catch (err) {
      console.error('Error updating barangay leadership page data:', err);
      if (err.name === 'ValidationError') {
          console.error("Validation Errors:", err.errors);
          return res.status(400).render('error', { title: 'Validation Error', error: 'Failed to update: Check input values.', details: err.message });
      }
      console.error("Full Error Object:", err);
      res.status(500).render('error', { title: 'Server Error', error: 'Failed to update barangay leadership page data.', details: err.message });
  }
});



// --- Site Logo Routes ---
router.get('/edit-logo', async (req, res) => {
  try {
    const homeData = await HomePage.findOne();
    const currentLogoUrl = homeData?.siteLogo || '/images/default-logo.png';
    res.render('admin/edit-logo', {
      currentLogoUrl,
      title: 'Edit Site Logo',
      currentPage: 'edit-logo'
    });
  } catch (err) {
    console.error('Error loading logo edit form:', err);
    res.status(500).render('error', {
      title: 'Server Error',
      error: 'Failed to load logo edit form.',
      details: err.message
    });
  }
});

router.post('/edit-logo', processLogoUpload, handleMulterError, async (req, res) => {
  try {
    if (!req.file) {
      const homeData = await HomePage.findOne();
      const currentLogoUrl = homeData?.siteLogo || '/images/default-logo.png';
      return res.render('admin/edit-logo', {
        currentLogoUrl,
        title: 'Edit Site Logo',
        uploadError: 'Please select an image file to upload.'
      });
    }

    let homeData = await HomePage.findOne();
    if (!homeData) {
      console.log("HomePage data not found, creating new for logo update.");
      homeData = new HomePage({});
    }

    const newLogoPath = '/images/' + req.file.filename;
    homeData.siteLogo = newLogoPath;
    console.log(`Updating siteLogo to: ${newLogoPath}`);

    await homeData.save();
    console.log('Site logo updated successfully.');
    res.redirect('/admin/edit-logo');
  } catch (err) {
    console.error('Error updating site logo:', err);
    if (err.name === 'ValidationError') {
      return res.status(400).render('error', { title: 'Validation Error', error: 'Failed to save logo.', details: err.message });
    }
    res.status(500).render('error', { title: 'Server Error', error: 'Failed to update site logo.', details: err.message });
  }
});

module.exports = router;