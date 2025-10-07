// seedBarangay.js
const mongoose = require('mongoose');
const BarangayPage = require('./models/BarangayPage'); // Adjust path if your model is elsewhere
require('dotenv').config(); // Load environment variables from .env file

// --- Sample Data Definition ---
// Using Filipino names for realism
const sampleBarangayData = {
    hero: {
        title: 'Pamunuan ng Ating mga Barangay',
        subtitle: 'Kilalanin ang mga lingkod-bayan sa bawat komunidad ng ating bayan.',
        buttonText: 'Tingnan ang mga Barangay',
    },
    mainSection: {
        title: 'Ang Ating Mga Barangay',
        subtitle: 'Impormasyon tungkol sa pamunuan ng bawat barangay.',
        barangays: [
            // Barangay 1
            {
                name: 'Barangay San Roque',
                officers: {
                    president: 'Roberto "Bobby" Reyes',
                    vicePresident: 'Maria Cristina "Cristy" Santos',
                    secretary: 'Jose "Joey" Garcia',
                    asstSecretary: 'Leticia "Letty" Mendoza',
                    treasurer: 'Eduardo "Eddie" Fernandez',
                    asstTreasurer: 'Corazon "Cora" Lim',
                    auditor: 'Antonio "Tony" Cruz',
                    asstAuditor: 'Rosario "Rose" Bautista',
                    businessManager: 'Felipe "Philip" Mercado',
                    asstBusManager: 'Norma "Normi" Ignacio',
                    pio: 'Ricardo "Ricky" Gonzales',
                    asstPio: 'Teresita "Tess" David',
                    muse: 'Angelica "Angel" Villanueva',
                    escort: 'Christopher "Chris" Ramos',
                    boardOfDirectors: [
                        { title: 'Purok 1 Leader', name: 'Isagani "Gani" Dela Peña' },
                        { title: 'Purok 2 Leader', name: 'Milagros "Mila" Salazar' },
                        { title: 'Purok 3 Leader', name: 'Arturo "Arthur" Bonifacio' },
                        { title: 'Health Committee Head', name: 'Dr. Elvira "Elvie" Santiago' },
                        { title: 'Peace and Order Chair', name: 'Sgt. Manuel "Manny" Lopez (Ret.)' },
                    ]
                    
                }
            },
            // Barangay 2
            {
                name: 'Barangay Santa Cruz',
                officers: {
                    president: 'Gloria "Glo" Macapagal', // Example only :)
                    vicePresident: 'Benigno "Ben" Aquino III', // Example only :)
                    secretary: 'Ferdinand "Bongbong" Marcos Jr.', // Example only :)
                    asstSecretary: 'Sara Duterte-Carpio', // Example only :)
                    treasurer: 'Rodrigo "Rody" Duterte', // Example only :)
                    asstTreasurer: 'Joseph "Erap" Estrada', // Example only :)
                    auditor: 'Fidel "Eddie" Ramos', // Example only :)
                    asstAuditor: 'Corazon "Cory" Aquino', // Example only :)
                    businessManager: 'Ramon "Mon" Magsaysay', // Example only :)
                    asstBusManager: 'Manuel "Manoling" Quezon', // Example only :)
                    pio: 'Emilio "Milio" Aguinaldo', // Example only :)
                    asstPio: 'Andres "Andres" Bonifacio', // Example only :)
                    muse: 'Gabriela Silang', // Example only :)
                    escort: 'Jose Rizal', // Example only :)
                    boardOfDirectors: [
                        { title: 'Purok Maligaya Leader', name: 'Lourdes "Lulu" Castillo' },
                        { title: 'Purok Masagana Leader', name: 'Nestor "Tor" Domingo' },
                        { title: 'SK Chairperson', name: 'Kevin Alvarez' },
                    ]
                }
            },
             // Barangay 3
             {
                name: 'Barangay Poblacion',
                officers: {
                    president: 'Wilfredo "Willy" Torres',
                    vicePresident: 'Anita "Annie" Gomez',
                    secretary: 'Danilo "Danny" Pineda',
                    treasurer: 'Erlinda "Linda" Castro',
                    auditor: 'Renato "Rene" Morales',
                    pio: 'Susan "Sue" Diaz',
                    // Leaving some officers blank intentionally
                    asstSecretary: '',
                    asstTreasurer: '',
                    asstAuditor: '',
                    businessManager: '',
                    asstBusManager: '',
                    asstPio: '',
                    muse: '',
                    escort: '',
                    boardOfDirectors: [
                        { title: 'Purok Centro Leader', name: 'Virginia "Virgie" Navarro' },
                        { title: 'Purok Ilaya Leader', name: 'Rolando "Rolly" De Leon' },
                        { title: 'Women\'s Rep.', name: 'Carmelita "Carmie" Paredes' },
                        { title: 'Senior Citizen Rep.', name: 'Benjamin "Benjie" Francisco Sr.' },
                    ]
                }
            },
            // Barangay 4 (Fewer details)
            {
                name: 'Barangay Bagong Silang',
                officers: {
                    president: 'Jonathan "Jojo" Silvestre',
                    vicePresident: 'Aileen "A" Pascual',
                    secretary: 'Michael "Mike" Evangelista',
                    treasurer: 'Jennifer "Jenny" Rosario',
                    // Many officers left blank
                    boardOfDirectors: [
                         { title: 'Purok A', name: 'Grace Mariano' },
                         { title: 'Purok B', name: 'Noel Samson' },
                    ]
                }
            },
        ]
    }
};

// --- Seeding Function ---
const seedDatabase = async () => {
    try {
        console.log('Attempting to seed BarangayPage data...');

        // Check if data exists
        const existingData = await BarangayPage.findOne();

        if (existingData) {
            console.log('Existing BarangayPage data found. Replacing it...');
            // Option 1: Delete and Create (simple replacement)
            // await BarangayPage.deleteMany({}); // Delete all (should be only one)
            // await BarangayPage.create(sampleBarangayData);

            // Option 2: Update existing (using findOneAndUpdate with overwrite)
            // Note: Overwrite isn't a direct option, upsert is better for create/update
             await BarangayPage.findOneAndUpdate({}, sampleBarangayData, {
               new: true, // Return the updated document
               upsert: true, // Create if it doesn't exist (handles first run)
               runValidators: true,
               setDefaultsOnInsert: true // Apply schema defaults if creating
             });

            console.log('BarangayPage data replaced successfully!');
        } else {
            console.log('No existing BarangayPage data found. Creating new document...');
            await BarangayPage.create(sampleBarangayData);
            console.log('BarangayPage data created successfully!');
        }

    } catch (error) {
        console.error('Error seeding BarangayPage data:', error);
        // Throw error to be caught by the main execution block
        throw error;
    }
};

// --- Main Execution ---
const runSeed = async () => {
    const dbURI = "mongodb+srv://testymech:K6PwXqAly077g2ni@pmafa.muzkrsq.mongodb.net/?retryWrites=true&w=majority&appName=PMAFA";
    if (!dbURI) {
        console.error('Error: MONGODB_URI not found in .env file.');
        process.exit(1);
    }

    try {
        await mongoose.connect(dbURI);
        console.log('MongoDB Connected for Seeding...');
        await seedDatabase();
    } catch (err) {
        console.error('Seeding script failed:', err);
        process.exitCode = 1; // Indicate failure
    } finally {
        // Ensure connection is closed
        console.log('Closing MongoDB connection...');
        await mongoose.connection.close();
        console.log('Connection closed.');
    }
};

// Run the seeder
runSeed();