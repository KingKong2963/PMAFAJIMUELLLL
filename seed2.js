// seed.js (Gallery Page Only)
const mongoose = require('mongoose');
// Only require the model you want to seed
const GalleryPage = require('./models/GalleryPage');

// Make sure this connection string is correct
const dbURI = 'mongodb+srv://testymech:ouiFz7qofyDoj1Xd@pmafa.muzkrsq.mongodb.net/?retryWrites=true&w=majority&appName=PMAFA';

mongoose.connect(dbURI)
  .then(async () => {
    console.log('Connected to MongoDB for Gallery Page seeding...');

    try {
      // Clear only existing GalleryPage data
      console.log('Clearing existing GalleryPage data...');
      await GalleryPage.deleteMany({});
      console.log('Existing GalleryPage data cleared.');

      // Create a GalleryPage document using schema defaults
      console.log('Seeding GalleryPage...');
      const galleryPage = new GalleryPage(); // Uses defaults from GalleryPage schema
      await galleryPage.save();
      console.log('GalleryPage seeded successfully!');

    } catch (seedError) {
        console.error('Error during GalleryPage seeding:', seedError);
    } finally {
        // Close the connection
        await mongoose.connection.close();
        console.log('MongoDB connection closed.');
    }

}).catch((err) => {
  console.error('Error connecting to MongoDB for seeding:', err);
  mongoose.connection.close().catch(closeErr => console.error('Error closing MongoDB connection:', closeErr));
});