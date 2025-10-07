
const express = require('express');
const router = express.Router();
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
const User = require('../models/User');
const PasswordReset = require('../models/PasswordReset');
const transporter = require('../utils/nodemailer');



router.use(async (req, res, next) => {
  try {
    // Fetch site logo once and make it available globally
    const homeData = await HomePage.findOne({}, { siteLogo: 1 }); // Only fetch siteLogo field
    res.locals.siteLogo = homeData?.siteLogo || '/images/default-logo.png';
    next();
  } catch (error) {
    console.error('Error fetching site logo:', error);
    res.locals.siteLogo = '/images/default-logo.png'; // Fallback
    next();
  }
});


router.get('/', async (req, res) => {
  try {
    let homeData = await HomePage.findOne();
    if (!homeData) {
      homeData = await new HomePage().save();
    }
    
    // Pass siteLogo explicitly to make it available as locals.siteLogo in the template
    res.render('home', { 
      homeData, 
      siteLogo: homeData.siteLogo, // This makes it available as locals.siteLogo
      isHome: true 
    });
  } catch (err) {
    console.error(err);
    res.status(500).render('error', { error: 'Failed to load home page' });
  }
});

router.get('/about', (req, res) => {
  res.render('about', { isAbout: true });
});

router.get('/login', (req, res) => {
  if (req.session.isAdmin) {
    return res.redirect('/admin/dashboard');
  }
  res.render('login', { title: 'Admin Login', error: req.session.loginError });
  delete req.session.loginError;
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });
    if (user && await user.comparePassword(password)) {
      console.log('Admin login successful');
      
      // Don't regenerate session - it can cause issues in serverless environments
      // Instead, just set the session data and force save
      req.session.isAdmin = true;
      req.session.userId = user._id; // Store user ID for reference
      
      // CRITICAL: Force session save before redirect
      req.session.save((err) => {
        if (err) {
          console.error("Session save error:", err);
          return res.status(500).render('error', { 
            title: 'Login Error', 
            error: 'Failed to establish session.',
            details: err.message 
          });
        }
        
        console.log('Session saved successfully, redirecting to dashboard');
        res.redirect('/admin/dashboard');
      });
      
    } else {
      console.log('Admin login failed');
      req.session.loginError = 'Invalid username or password.';
      res.redirect('/login');
    }
  } catch (err) {
    console.error('Login error:', err);
    req.session.loginError = 'Server error during login.';
    res.redirect('/login');
  }
});

router.get('/logout', (req, res, next) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error destroying session:', err);
      return next(err);
    }
    console.log('Admin logout successful');
    res.redirect('/login');
  });
});

router.get('/forgot-password', (req, res) => {
  res.render('forgot-password', { title: 'Forgot Password', error: null });
});

router.post('/forgot-password', async (req, res) => {
  try {
    const user = await User.findOne({ email: process.env.ADMIN_EMAIL });
    if (!user) {
      return res.render('forgot-password', { title: 'Forgot Password', error: 'Email not registered.' });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const reset = new PasswordReset({ email: user.email, code });
    await reset.save();

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: 'Password Reset Code',
      text: `Your password reset code is: ${code}. It expires in 10 minutes.`
    };

    await transporter.sendMail(mailOptions);
    res.render('verify-code', { title: 'Verify Code', email: user.email, error: null });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.render('forgot-password', { title: 'Forgot Password', error: 'Failed to send reset code.' });
  }
});

router.post('/verify-code', async (req, res) => {
  const { email, code, newPassword } = req.body;

  try {
    const reset = await PasswordReset.findOne({ email, code });
    if (!reset) {
      return res.render('verify-code', { title: 'Verify Code', email, error: 'Invalid or expired code.' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.render('verify-code', { title: 'Verify Code', email, error: 'User not found.' });
    }

    user.password = newPassword;
    await user.save();
    await PasswordReset.deleteOne({ email, code });

    res.render('login', { title: 'Admin Login', error: 'Password reset successful. Please log in.' });
  } catch (err) {
    console.error('Verify code error:', err);
    res.render('verify-code', { title: 'Verify Code', email, error: 'Failed to reset password.' });
  }
});

router.get('/about/vision', async (req, res) => {
  try {
    const visionData = await VisionPage.getSingleton();
    if (!visionData) {
      return res.render('vision', { visionData: null, title: 'Our Vision', isAbout: true });
    }
    res.render('vision', { visionData, title: 'Our Vision', isAbout: true });
  } catch (err) {
    console.error('Error loading vision page:', err);
    res.status(500).render('error', { title: 'Error', error: 'Failed to load vision page.', details: err.message });
  }
});

router.get('/about/mission', async (req, res) => {
  try {
    const missionData = await MissionPage.getSingleton();
    if (!missionData) {
      return res.render('mission', { missionData: null, title: 'Our Mission', isAbout: true });
    }
    res.render('mission', { missionData, title: 'Our Mission', isAbout: true });
  } catch (err) {
    console.error('Error loading mission page:', err);
    res.status(500).render('error', { title: 'Error', error: 'Failed to load mission page.', details: err.message });
  }
});

router.get('/about/goals', async (req, res) => {
  try {
    const goalsData = await GoalsPage.getSingleton();
    if (!goalsData) {
      return res.render('goals', { goalsData: null, title: 'Our Goals', isAbout: true });
    }
    res.render('goals', { goalsData, title: 'Our Goals', isAbout: true });
  } catch (err) {
    console.error('Error loading goals page:', err);
    res.status(500).render('error', { title: 'Error', error: 'Failed to load goals page.', details: err.message });
  }
});

router.get('/about/objectives', async (req, res) => {
  try {
    const objectivesData = await ObjectivesPage.getSingleton();
    if (!objectivesData) {
      return res.render('objectives', { objectivesData: null, title: 'Our Objectives', isAbout: true });
    }
    res.render('objectives', { objectivesData, title: 'Our Objectives', isAbout: true });
  } catch (err) {
    console.error('Error loading objectives page:', err);
    res.status(500).render('error', { title: 'Error', error: 'Failed to load objectives page.', details: err.message });
  }
});

router.get('/about/history', async (req, res) => {
  try {
    const historyData = await HistoryPage.getSingleton();
    if (!historyData) {
      return res.render('history', { historyData: null, title: 'Our History', isAbout: true });
    }
    res.render('history', { historyData, title: 'Our History', isAbout: true });
  } catch (err) {
    console.error('Error loading history page:', err);
    res.status(500).render('error', { title: 'Error', error: 'Failed to load history page.', details: err.message });
  }
});

router.get('/about/leadership', async (req, res) => {
  try {
    const leadershipData = await LeadershipPage.getSingleton();
    if (!leadershipData) {
      return res.render('leadership', { leadershipData: null, title: 'Our Leadership', isAbout: true });
    }
    res.render('leadership', { leadershipData, title: 'Our Leadership', isAbout: true });
  } catch (err) {
    console.error('Error loading leadership page:', err);
    res.status(500).render('error', { title: 'Error', error: 'Failed to load leadership page.', details: err.message });
  }
});

router.get('/administration/barangay-leadership', async (req, res) => {
  try {
    const barangayData = await BarangayPage.getSingleton();
    if (!barangayData) {
      return res.render('barangay-leadership', { barangayData: null, title: 'Barangay Leadership', isAdminSection: true });
    }
    res.render('barangay-leadership', { barangayData, title: 'Barangay Leadership', isAdminSection: true });
  } catch (err) {
    console.error('Error loading barangay leadership page:', err);
    res.status(500).render('error', { title: 'Error', error: 'Failed to load Barangay Leadership page.', details: err.message });
  }
});

router.get('/services', async (req, res) => {
  try {
    const servicesData = await ServicesPage.getSingleton();
    res.render('services', { servicesData, title: 'Our Services', isServices: true });
  } catch (err) {
    console.error('Error loading services page:', err);
    res.status(500).render('error', { title: 'Error', error: 'Failed to load services page.' });
  }
});

router.get('/gallery', async (req, res) => {
  try {
    console.log("Attempting to fetch GalleryPage and HomePage data...");
    
    // Fetch GalleryPage data
    const galleryData = await GalleryPage.getSingleton();
    if (!galleryData) {
      console.error('GalleryPage.getSingleton() returned null/undefined.');
    }

    // Fetch HomePage data
    const homeData = await HomePage.findOne();
    if (!homeData) {
      console.error('HomePage.findOne() returned null/undefined.');
    }

    // Combine gallery items and story images
    const galleryItems = galleryData?.gallerySection?.items || [];
    const storyItems = [];

    // Process story images from homeData
    if (homeData?.featuredStories?.stories?.length > 0) {
      homeData.featuredStories.stories.forEach(story => {
        if (story.images && story.images.length > 0) {
          story.images.forEach(image => {
            storyItems.push({
              image: image,
              title: story.title || 'Story Image',
              description: story.description || 'Image from a featured story',
              category: 'Stories', // Default category for story images
              subcategory: '', // No subcategory for story images
              createdAt: story.createdAt || story.updatedAt || new Date() // Use story's timestamp
            });
          });
        }
      });
    }

    // Combine and sort items by recency (newest first)
    const combinedItems = [...galleryItems, ...storyItems].sort((a, b) => {
      const dateA = new Date(a.createdAt || a.updatedAt || 0);
      const dateB = new Date(b.createdAt || b.updatedAt || 0);
      return dateB - dateA; // Sort descending (newest first)
    });

    // Update galleryData with combined items
    const updatedGalleryData = {
      ...galleryData?.toObject(),
      gallerySection: {
        ...galleryData?.gallerySection,
        items: combinedItems,
        categories: [
          ...(galleryData?.gallerySection?.categories || []),
          { name: 'Stories', subcategories: [] } // Add Stories category if not already present
        ].filter((cat, index, self) => 
          index === self.findIndex(c => c.name === cat.name)
        )
      }
    };

    res.render('gallery', {
      galleryData: updatedGalleryData,
      title: 'Gallery',
      isGallery: true
    });
  } catch (err) {
    console.error('ERROR in /gallery route:', err);
    res.status(500).render('error', {
      title: 'Server Error',
      error: 'Failed to load gallery page due to an internal error.',
      details: err.message
    });
  }
});

router.get('/contact', async (req, res) => {
  try {
    const contactData = await ContactPage.getSingleton();
    if (!contactData) {
      return res.render('contact', { contactData: null, title: 'Contact Us', isContact: true });
    }
    res.render('contact', { contactData, title: 'Contact Us', isContact: true });
  } catch (err) {
    console.error('Error loading contact page:', err);
    res.status(500).render('error', { title: 'Error', error: 'Failed to load contact page.', details: err.message });
  }
});

router.post('/process-contact', async (req, res) => {
  console.log('--- Initiating /process-contact ---'); // LOG: Route hit

  // 1. Log incoming form data
  console.log('[LOG] Received request body:', req.body);
  const { name, email, subject, message } = req.body;

  // 2. Basic Server-Side Validation
  if (!name || !email || !subject || !message) {
    console.error('[ERROR] Contact form submission missing fields.');
    // Send an error response back to the client-side script
    return res.status(400).json({ success: false, message: 'Validation Error: Please fill out all fields.' });
  }
  console.log('[LOG] Basic validation passed.');

  try {
    // 3. Fetch the ContactPage data
    console.log('[LOG] Attempting to fetch ContactPage data...');
    const contactData = await ContactPage.getSingleton();

    if (!contactData) {
      console.error('[ERROR] Failed to fetch ContactPage data from database. getSingleton() returned null/undefined.');
      return res.status(500).json({ success: false, message: 'Server Error: Could not load contact configuration.' });
    }
    console.log('[LOG] ContactPage data fetched successfully.');

    // 4. Get and validate the recipient email from the fetched data
    const recipientEmail = contactData?.formSection?.formRecipientEmail;
    console.log(`[LOG] Recipient email from DB: ${recipientEmail}`);

    if (!recipientEmail || typeof recipientEmail !== 'string' || !recipientEmail.includes('@')) {
      console.error(`[ERROR] Invalid or missing recipient email in database. Value: ${recipientEmail}`);
      // Avoid exposing the exact email config issue to the user for security
      return res.status(500).json({ success: false, message: 'Server Configuration Error: Cannot send message at this time.' });
    }
    console.log(`[LOG] Recipient email is valid: ${recipientEmail}`);

    // 5. Configure the email options
    const mailOptions = {
      from: `"PMAFA" <${process.env.EMAIL_USER}>`, // Sender address (shows your name/app name and email)
      to: recipientEmail,           // The email address from the database
      replyTo: email,               // Set the user's email as the Reply-To address
      subject: `Contact Form: ${subject}`, // Clear subject line
      text: `New message from your website contact form:\n\n` +
            `Name: ${name}\n` +
            `Email: ${email}\n` +
            `Subject: ${subject}\n\n` +
            `Message:\n${message}`,
      // Optional HTML version
      html: `<p>New message from your website contact form:</p>
             <ul>
               <li><strong>Name:</strong> ${name}</li>
               <li><strong>Email:</strong> ${email}</li>
               <li><strong>Subject:</strong> ${subject}</li>
             </ul>
             <p><strong>Message:</strong></p>
             <p>${message.replace(/\n/g, '<br>')}</p>`
    };
    console.log('[LOG] Mail options prepared:', JSON.stringify(mailOptions, null, 2)); // Log the options

    // 6. Send the email using Nodemailer transporter
    console.log('[LOG] Attempting to send email via Nodemailer...');
    const info = await transporter.sendMail(mailOptions);

    console.log('[LOG] Email sent successfully!');
    console.log('[LOG] Nodemailer response info:', info); // Log Nodemailer's success response

    // 7. Send a success response back to the client-side script
    console.log('[LOG] Sending success response to client (200).');
    res.status(200).json({ success: true, message: 'Message sent successfully!' });

  } catch (error) {
    // 8. Catch ANY error during the process (DB fetch, mail sending, etc.)
    console.error('---!!! ERROR in /process-contact !!!---');
    console.error('[ERROR] Detailed error object:', error); // Log the full error object

    // Determine the type of error if possible (e.g., Nodemailer error codes)
    let userMessage = 'Server Error: Failed to send message due to an internal issue.';
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        userMessage = 'Server Error: Could not connect to the email server.';
    } else if (error.responseCode === 535) { // Example: Authentication error
        userMessage = 'Server Configuration Error: Email authentication failed.';
    }

    console.log(`[LOG] Sending error response to client (500): ${userMessage}`);
    res.status(500).json({ success: false, message: userMessage });
  } finally {
      console.log('--- Exiting /process-contact ---'); // LOG: Route finished
  }
});

router.get('/administration/person/:slug', async (req, res) => {
  try {
    const slugParam = req.params.slug;
    if (!slugParam) {
      return res.status(400).render('error', { title: 'Bad Request', error: 'Missing person identifier.' });
    }
    const targetLink = `/administration/person/${slugParam}`;
    console.log(`Looking for person with link: ${targetLink}`);

    let personData = null;
    let sourcePage = null;

    const leadershipData = await LeadershipPage.getSingleton();
    const barangayData = await BarangayPage.getSingleton();

    if (leadershipData?.leadershipSection) {
      const ls = leadershipData.leadershipSection;
      if (ls.mayor?.link === targetLink) {
        personData = ls.mayor;
        sourcePage = '/about/leadership';
        console.log("Found person in Mayor data.");
      } else if (ls.president?.link === targetLink) {
        personData = ls.president;
        sourcePage = '/about/leadership';
        console.log("Found person in President data.");
      } else if (ls.teamMembers?.length > 0) {
        const foundMember = ls.teamMembers.find(member => member.link === targetLink);
        if (foundMember) {
          personData = foundMember;
          sourcePage = '/about/leadership';
          console.log("Found person in Team Members data.");
        }
      }
    }

    if (!personData && barangayData?.mainSection?.barangays) {
      console.log("Searching Barangay coordinators...");
      for (const barangay of barangayData.mainSection.barangays) {
        if (barangay.coordinator?.link === targetLink) {
          personData = barangay.coordinator;
          sourcePage = '/administration/barangay-leadership';
          console.log(`Found person in Barangay '${barangay.name}' coordinator data.`);
          break;
        }
      }
    }

    if (personData) {
      console.log(`Rendering detail for: ${personData.name}`);
      const personForView = {
        ...(personData.toObject ? personData.toObject() : personData),
        description: personData.bio,
        backLink: sourcePage || '/about'
      };
      res.render('person-detail', {
        person: personForView,
        title: personData.name || 'Person Details',
        isAbout: sourcePage === '/about/leadership',
        isAdminSection: sourcePage === '/administration/barangay-leadership'
      });
    } else {
      console.log(`Person with link ${targetLink} not found.`);
      res.status(404).render('error', { title: 'Not Found', error: 'Person details not found.' });
    }
  } catch (err) {
    console.error(`Error loading person detail for slug ${req.params.slug}:`, err);
    res.status(500).render('error', { title: 'Server Error', error: 'Failed to load person details.', details: err.message });
  }
});



router.get('/about/vmgo', async (req, res) => {
  try {
    const visionData = await VisionPage.getSingleton();
    const missionData = await MissionPage.getSingleton();
    const goalsData = await GoalsPage.getSingleton();
    const objectivesData = await ObjectivesPage.getSingleton();
    
    res.render('vmgo', {
      visionData,
      missionData,
      goalsData,
      objectivesData,
      title: 'Vision, Mission, Goals, Objectives',
      isAbout: true
    });
  } catch (err) {
    console.error('Error loading VMGO page:', err);
    res.status(500).render('error', {
      title: 'Error',
      error: 'Failed to load VMGO page.',
      details: err.message
    });
  }
});

module.exports = router;