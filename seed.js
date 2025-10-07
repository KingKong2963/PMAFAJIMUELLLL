const mongoose = require('mongoose');
const HomePage = require('./models/HomePage'); // Adjust path to your schema file

async function seedHomePage() {
  try {
    // Updated connection string - try different formats
    const connectionOptions = [
      // Option 1: Standard format
      'mongodb+srv://testymech:K6PwXqAly077g2ni@pmafa.muzkrsq.mongodb.net/test?retryWrites=true&w=majority',
      
      // Option 2: With explicit database name
      'mongodb+srv://testymech:K6PwXqAly077g2ni@pmafa.muzkrsq.mongodb.net/your_database_name?retryWrites=true&w=majority',
      
      // Option 3: Direct connection (if cluster0 format)
      'mongodb+srv://testymech:K6PwXqAly077g2ni@cluster0.muzkrsq.mongodb.net/?retryWrites=true&w=majority'
    ];

    // Try connecting with the first option
    await mongoose.connect(connectionOptions[0], {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
    });
    
    console.log('Connected to MongoDB');

    // Clear existing data
    await HomePage.deleteMany({});
    console.log('Cleared existing HomePage data');

    // Create seed data
    const homePageData = {
      siteLogo: '/images/sample-logo.png',
      hero: {
        backgroundImage: '/images/hero-background.jpg',
        title: 'Welcome to Our Organization',
        subtitle: 'Empowering communities through innovation and collaboration.',
        button1: {
          text: 'Learn More',
          link: '/about',
          icon: 'fas fa-info-circle'
        },
        button2: {
          text: 'Get Involved',
          link: '/join',
          icon: 'fas fa-hands-helping'
        }
      },
      featuredStories: {
        title: 'Our Impact Stories',
        subtitle: 'Discover how we\'re making a difference in the community.',
        stories: [
          {
            contentType: 'images',
            images: [
              '/images/story1-image1.jpg',
              '/images/story1-image2.jpg'
            ],
            embedLink: '',
            tag: 'Community',
            tagColor: 'bg-blue-500 text-white',
            title: 'Community Outreach Program',
            description: 'Our latest outreach program helped 500 families with essential supplies.',
            link: '/stories/community-outreach'
          },
          {
            contentType: 'embed',
            images: [],
            embedLink: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            tag: 'Event',
            tagColor: 'bg-green-500 text-white',
            title: 'Annual Charity Event',
            description: 'Watch highlights from our annual charity event that raised $10,000.',
            link: '/stories/charity-event'
          },
          {
            contentType: 'images',
            images: ['/images/story2-image1.jpg'],
            embedLink: '',
            tag: 'Education',
            tagColor: 'bg-purple-500 text-white',
            title: 'Youth Education Initiative',
            description: 'Providing free educational resources to underprivileged youth.',
            link: '/stories/education-initiative'
          }
        ],
        viewAllLink: {
          text: 'View All Stories',
          link: '/stories',
          icon: 'fas fa-arrow-right'
        }
      },
      stats: [
        { value: '1000+', label: 'Families Helped' },
        { value: '50+', label: 'Volunteers Engaged' },
        { value: '$100K', label: 'Funds Raised' },
        { value: '10+', label: 'Programs Launched' }
      ],
      testimonials: {
        title: 'What People Say',
        subtitle: 'Hear from those impacted by our work.',
        testimonials: [
          {
            quote: 'This organization changed my life by providing essential support during tough times.',
            name: 'Jane Doe',
            origin: 'Community Member',
            image: '/images/testimonial1.jpg'
          },
          {
            quote: 'Volunteering here has been an incredibly rewarding experience!',
            name: 'John Smith',
            origin: 'Volunteer',
            image: '/images/testimonial2.jpg'
          }
        ]
      },
      footer: {
        orgName: 'Sample Organization',
        address: '123 Main St, City, Country',
        email: 'contact@sampleorg.com',
        phone: '+1 (123) 456-7890',
        copyright: '© 2025 Sample Organization. All rights reserved.'
      }
    };

    // Insert seed data
    await HomePage.create(homePageData);
    console.log('HomePage data seeded successfully');

    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (err) {
    console.error('Error seeding HomePage data:', err);
    
    // Additional debugging information
    if (err.code === 'ESERVFAIL') {
      console.log('\n🔍 DNS Resolution Failed. Try these steps:');
      console.log('1. Check your internet connection');
      console.log('2. Verify your MongoDB Atlas cluster is running');
      console.log('3. Try using Google DNS (8.8.8.8, 8.8.4.4)');
      console.log('4. Check if your firewall is blocking MongoDB connections');
      console.log('5. Verify your connection string in MongoDB Atlas dashboard');
    }
  }
}

// Run the seed function
seedHomePage();