// seedLeadership.js
const mongoose = require('mongoose');
const LeadershipPage = require('./models/LeadershipPage'); // Adjust path if your model is elsewhere
require('dotenv').config(); // Load environment variables

// Data based on your provided JSON, with the new hero.backgroundImage added
const leadershipDataToSeed = {
  hero: {
    title: "PMAFA EXECUTIVE OFFICERS",
    subtitle: "", // Kept as empty string from your data
    buttonText: "Meet the Team",
    backgroundImage: "/images/default-leadership-hero.jpg" // Added new field with default
  },
  leadershipSection: {
    title: "", // Kept as empty string
    subtitle: "", // Kept as empty string
    mayor: {
      name: "Atty. Stephen A. Palmares, CPA",
      title: "City Mayor",
      bio: "",
      image: "/images/1745056961265-263294280_105832201941957_1434541867163379323_n.jpg",
      link: "/administration/person/mayor-john-doe",
      email: "",
      tenure: "",
      achievements: ""
    },
    president: {
      name: "Jeanette P. Sayson",
      title: "President",
      bio: "",
      image: "/images/1745849620084-logo.png",
      link: "/administration/person/pmafa-ceres",
      email: "",
      tenure: "",
      achievements: ""
    },
    teamMembers: [
      { name: "Marivic Padura", title: "Vice President", bio: "", image: "/images/1747097461658-476839653_610369751855272_1862811367528695446_n.jpg", link: "#", email: "", tenure: "", achievements: "" },
      { name: "Leolane De Los Santos", title: "Secretary", bio: "", image: "/images/1745849620124-logo.png", link: "#", email: "", tenure: "", achievements: "" },
      { name: "Vivian Pradilla", title: "Asst. Secretary ", bio: "", image: "/images/1745849620148-logo.png", link: "#", email: "", tenure: "", achievements: "" },
      { name: "Rosalie Padura", title: "Treasurer", bio: "", image: "/images/1745849620157-logo.png", link: "#", email: "", tenure: "", achievements: "" },
      { name: "Lorline Basterio", title: "Asst. Treasurer", bio: "", image: "/images/1745849620166-logo.png", link: "#", email: "", tenure: "", achievements: "" },
      { name: "Rogelio Palomo", title: "Auditor", bio: "", image: "/images/1745849620175-logo.png", link: "#", email: "", tenure: "", achievements: "" },
      { name: "Reynaldo Malones", title: "Asst. Auditor", bio: "", image: "/images/1745849620185-logo.png", link: "#", email: "", tenure: "", achievements: "" },
      { name: "Dequito Toledo", title: "Bus. Manager", bio: "", image: "/images/1745849620199-logo.png", link: "#", email: "", tenure: "", achievements: "" },
      { name: "Roque Palomo", title: "Asst. Business Manager", bio: "", image: "/images/1745849620208-logo.png", link: "#", email: "", tenure: "", achievements: "" },
      { name: "Arlin Lantano", title: "P.R.O", bio: "", image: "/images/1745849620215-logo.png", link: "#", email: "", tenure: "", achievements: "" },
      { name: "Milrose Lusaya", title: "Board of Director", bio: "", image: "/images/1745849620224-logo.png", link: "#", email: "", tenure: "", achievements: "" },
      { name: "Gilbert Muyco", title: "Board of Director", bio: "", image: "/images/1745849620233-logo.png", link: "#", email: "", tenure: "", achievements: "" },
      { name: "Ariel Paciente", title: "Board of Director", bio: "", image: "/images/1745849620247-logo.png", link: "#", email: "", tenure: "", achievements: "" },
      { name: "Suzette Paniza", title: "Board of Director", bio: "", image: "/images/1745849620273-logo.png", link: "#", email: "", tenure: "", achievements: "" },
      { name: "Aloha Nakata", title: "Board of Director", bio: "", image: "/images/1745849620284-logo.png", link: "#", email: "", tenure: "", achievements: "" }
    ]
  }
  // Timestamps (createdAt, updatedAt) will be handled by Mongoose automatically
};

const seedDatabase = async () => {
  try {
    console.log('Attempting to seed LeadershipPage data...');

    // Delete existing LeadershipPage document (since it's a singleton)
    await LeadershipPage.deleteMany({});
    console.log('Existing LeadershipPage data cleared.');

    // Create the new LeadershipPage document with the provided data
    // The LeadershipPage model's getSingleton method is for retrieving/creating in the app,
    // for seeding, we directly create. The schema defaults (like for hero.backgroundImage if not provided here)
    // will be applied by Mongoose upon creation.
    await LeadershipPage.create(leadershipDataToSeed);
    console.log('LeadershipPage data seeded successfully with provided information!');

  } catch (error) {
    console.error('Error seeding LeadershipPage data:', error);
    throw error; // Re-throw to be caught by the main execution block
  }
};

// --- Main Execution ---
const runSeed = async () => {
  const dbURI = process.env.DB; // Make sure DB is set in your .env file
  if (!dbURI) {
    console.error('Error: MongoDB connection string (DB) not found in .env file.');
    process.exit(1);
  }

  try {
    await mongoose.connect(dbURI);
    console.log('MongoDB Connected for LeadershipPage Seeding...');
    await seedDatabase();
  } catch (err) {
    console.error('LeadershipPage seeding script failed:', err);
    process.exitCode = 1; // Indicate failure
  } finally {
    console.log('Closing MongoDB connection...');
    await mongoose.connection.close();
    console.log('Connection closed.');
  }
};

// Run the seeder
runSeed();
