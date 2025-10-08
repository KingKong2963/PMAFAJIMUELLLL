require('dotenv').config();

const express = require('express');
const session = require('express-session');
const path = require('path');
const mongoose = require('mongoose');
const MongoStore = require('connect-mongo');

const indexRoutes = require('./routes/index');
const adminRoutes = require('./routes/admin');
const HomePage = require('./models/HomePage');
const User = require('./models/User');

const app = express();
const port = 80;
const dbURI = process.env.MONGODB_URI || process.env.DB;

if (!dbURI) {
  console.error('FATAL ERROR: MONGODB_URI or DB environment variable is not set.');
  process.exit(1);
}

// Cache the Mongoose connection globally for serverless reuse
let cached = global.mongoose;
if (!cached) {
  cached = { conn: null, promise: null };
  global.mongoose = cached;
}

async function connectToDatabase() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };
    cached.promise = mongoose.connect(dbURI, opts).then((mongoose) => mongoose);
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

// *** REFINEMENT ***: Get the connection promise once for MongoStore
const connectionPromise = connectToDatabase();

// Basic Middleware (BEFORE session)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// *** CRITICAL FIX: Trust Vercel's proxy ***
// This is essential for secure cookies to work correctly in a production environment like Vercel.
app.set('trust proxy', 1);

// Session Configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'fallback-secret-key',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    // *** REFINEMENT ***: Pass the connection promise directly.
    // This is a cleaner and more robust way to integrate with your connection logic.
    clientPromise: connectionPromise.then(conn => conn.connection.getClient()),
    collectionName: 'sessions',
    ttl: 14 * 24 * 60 * 60, // 14 days in seconds
    autoRemove: 'native'
  }),
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // Will be true on Vercel
    maxAge: 1000 * 60 * 60 * 24, // 24 hours
    sameSite: 'lax'
  },
  name: 'pmafa.sid'
}));

// Session debugging middleware
app.use((req, res, next) => {
  console.log('Session Debug:', {
    sessionID: req.sessionID,
    isAdmin: req.session?.isAdmin,
    sessionExists: !!req.session,
    url: req.originalUrl
  });
  next();
});

// Global Data Middleware (ensure it runs after session)
app.use(async (req, res, next) => {
  try {
    const homeData = await HomePage.findOne();
    if (homeData) {
      res.locals.siteLogo = homeData.siteLogo;
      res.locals.footerData = homeData.footer;
    } else {
      // Default values if no data is found
      res.locals.siteLogo = '/images/default-logo.png';
      res.locals.footerData = { /* ... default footer data ... */ };
      console.warn("HomePage data not found, using defaults.");
    }
    // Set isAdmin from session for all views
    res.locals.isAdmin = req.session.isAdmin || false;
  } catch (err) {
    console.error("Error fetching global data:", err);
    // Set safe defaults on error
    res.locals.siteLogo = '/images/default-logo.png';
    res.locals.footerData = { /* ... default footer data ... */ };
    res.locals.isAdmin = false;
  }
  next();
});

// Routes
app.use('/', indexRoutes);
app.use('/admin', adminRoutes);

// Error Handling
app.use((req, res, next) => {
  res.status(404).render('error', {
    title: 'Page Not Found',
    error: 'Sorry, the page you are looking for does not exist.',
    details: `Cannot ${req.method} ${req.originalUrl}`
  });
});

app.use((err, req, res, next) => {
  console.error('Server Error:', err.stack);
  const details = process.env.NODE_ENV === 'development' ? err.message : null;
  res.status(err.status || 500).render('error', {
    title: 'Server Error',
    error: 'Something went wrong on our end!',
    details: details
  });
});

// For local development
async function startServer() {
  try {
    await connectionPromise; // Wait for the initial connection
    console.log('Database connected successfully.');

    // Create default admin user if none exists
    const adminCount = await User.countDocuments();
    if (adminCount === 0) {
      const defaultUser = new User({
        username: process.env.ADMIN_USERNAME || 'admin',
        email: process.env.ADMIN_EMAIL || 'admin@example.com',
        password: process.env.ADMIN_PASSWORD || 'defaultpassword123'
      });
      await defaultUser.save();
      console.log('Default admin user created.');
    }

    app.listen(port, () => {
      console.log(`Server running at http://localhost:${port}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

// This condition ensures the server only tries to start listening in a non-serverless environment
if (process.env.NODE_ENV !== 'production') {
  startServer();
}

// Export the app for Vercel
module.exports = app;
