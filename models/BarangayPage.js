// models/BarangayPage.js
const mongoose = require('mongoose');

// Schema for Board of Directors entries
const directorSchema = new mongoose.Schema({
    title: { type: String, default: 'Position/Purok' }, // e.g., "Purok 1", "Representative"
    name: { type: String, default: 'Director Name' }
}, { _id: false });

// Schema for all officers
const officersSchema = new mongoose.Schema({
    president: { type: String, default: 'President Name Not Set' },
    presidentImage: { type: String, default: 'https://via.placeholder.com/150/cccccc/888888?text=No+Image' },
    vicePresident: { type: String, default: 'VP Name Not Set' },
    secretary: { type: String, default: 'Secretary Name Not Set' },
    asstSecretary: { type: String, default: 'Asst. Secretary Name Not Set' },
    treasurer: { type: String, default: 'Treasurer Name Not Set' },
    asstTreasurer: { type: String, default: 'Asst. Treasurer Name Not Set' },
    auditor: { type: String, default: 'Auditor Name Not Set' },
    asstAuditor: { type: String, default: 'Asst. Auditor Name Not Set' },
    businessManager: { type: String, default: 'Bus. Manager Name Not Set' },
    asstBusManager: { type: String, default: 'Asst. Bus. Manager Name Not Set' },
    pio: { type: String, default: 'PIO Name Not Set' },
    asstPio: { type: String, default: 'Asst. PIO Name Not Set' },
    muse: { type: String, default: 'Muse Name Not Set' },
    escort: { type: String, default: 'Escort Name Not Set' },
    boardOfDirectors: { type: [directorSchema], default: [] }
}, { _id: false });

// Schema for an individual Barangay
const barangaySchema = new mongoose.Schema({
    name: { type: String, required: true, default: 'Barangay Name' },
    officers: { type: officersSchema, default: () => ({}) } // Default to an empty officers object
}, { _id: false });

// Schema for the entire Barangay Page (singleton)
const barangayPageSchema = new mongoose.Schema({
  hero: {
    backgroundImage: { type: String, default: '/images/default-barangay-hero.jpg' }, // Hero background image
    title: { type: String, default: 'Barangay Leadership' },
    subtitle: { type: String, default: 'Discover the local leaders...' },
    buttonText: { type: String, default: 'View Barangays' },
  },
  mainSection: {
    title: { type: String, default: 'Our Barangays' },
    subtitle: { type: String, default: 'Information about each Barangay\'s leadership.' },
    barangays: {
        type: [barangaySchema], // Array of individual barangays
        default: [ // Default barangays if none are present
            { 
                name: 'Barangay Alpha (Default)', 
                officers: { 
                    president: 'Default President Alpha', 
                    presidentImage: 'https://via.placeholder.com/150/cccccc/888888?text=Alpha',
                    boardOfDirectors: [{title: "Purok 1", name: "Dir. Alpha 1"}] 
                } 
            },
            { 
                name: 'Barangay Beta (Default)', 
                officers: { 
                    president: 'Default President Beta',
                    presidentImage: 'https://via.placeholder.com/150/cccccc/888888?text=Beta'
                } 
            }
        ]
    }
  }
}, {
  timestamps: true, // Automatically add createdAt and updatedAt timestamps
  versionKey: false // Disable the __v version key
});

// Static method to get the singleton document for the BarangayPage
barangayPageSchema.statics.getSingleton = async function() {
    let doc = await this.findOne();
    if (!doc) {
        console.log('Creating default BarangayPage document because none was found.');
        // Define the complete default structure for a new document
        const defaultData = {
             hero: {
                title: 'Barangay Leadership',
                subtitle: 'Discover the local leaders who serve our communities.',
                buttonText: 'View Barangays',
                backgroundImage: '/images/default-barangay-hero.jpg' // Default hero background
             },
             mainSection: {
                title: 'Our Barangays',
                subtitle: 'Explore the leadership and structure of each local barangay.',
                barangays: [ // Default example barangays
                    { 
                        name: 'Sample Barangay Uno', 
                        officers: { 
                            president: 'Juan Dela Cruz',
                            presidentImage: 'https://via.placeholder.com/150/007bff/ffffff?text=JDC', // Blue placeholder
                            vicePresident: 'Maria Santos',
                            secretary: 'Pedro Reyes',
                            boardOfDirectors: [
                                {title: "Purok Masipag Leader", name: "Ana Gomez"},
                                {title: "Purok Matiyaga Leader", name: "Luis Aquino"}
                            ] 
                        } 
                    },
                    { 
                        name: 'Sample Barangay Dos', 
                        officers: { 
                            president: 'Clara Aguas',
                            presidentImage: 'https://via.placeholder.com/150/28a745/ffffff?text=CA', // Green placeholder
                            vicePresident: 'Antonio Luna'
                        } 
                    }
                ]
            }
        };
        doc = await new this(defaultData).save(); // Create and save the new default document
        console.log('Default BarangayPage document created.');
    } else {
        // Ensure existing document has the hero.backgroundImage field
        if (!doc.hero || typeof doc.hero.backgroundImage === 'undefined') {
            console.log('Updating existing BarangayPage document with default hero.backgroundImage.');
            doc.hero = doc.hero || {}; // Ensure hero object exists
            doc.hero.backgroundImage = '/images/default-barangay-hero.jpg'; // Set default
        }
        // Ensure nested defaults for barangays and their officers are applied if missing on load
        if (doc.mainSection && doc.mainSection.barangays) {
            doc.mainSection.barangays.forEach(b => {
                if (!b.officers) {
                    b.officers = {}; // Initialize if officers object is completely missing
                }
                // Ensure default for presidentImage if missing
                if (typeof b.officers.presidentImage === 'undefined' || !b.officers.presidentImage) {
                    b.officers.presidentImage = 'https://via.placeholder.com/150/cccccc/888888?text=No+Image';
                }
                if (!b.officers.boardOfDirectors) {
                    b.officers.boardOfDirectors = []; // Initialize if boardOfDirectors array is missing
                }
            });
        }
        // If any modifications were made to ensure defaults, save the document
        if(doc.isModified()){
            console.log('Saving modifications to existing BarangayPage document to ensure all defaults.');
            doc = await doc.save();
        }
    }
    return doc;
};

// Export the Mongoose model
module.exports = mongoose.model('BarangayPage', barangayPageSchema);
