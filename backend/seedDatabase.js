const mongoose = require('mongoose');
const Property = require('./models/Property');
require('dotenv').config();

const properties = [
  {
    title: "Modern 2BHK Apartment",
    description: "Spacious apartment with modern amenities in heart of city",
    rent: 25000,
    location: "Mumbai",
    bedrooms: 2,
    bathrooms: 2,
    amenities: ["WiFi", "AC", "Water Tank", "Parking", "Gym"],
    photos: [
      {
        url: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&h=300&fit=crop",
        description: "Living Room"
      },
      {
        url: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=300&fit=crop",
        description: "Master Bedroom"
      },
      {
        url: "https://images.unsplash.com/photo-1556912172-45b7abe8b7e1?w=400&h=300&fit=crop",
        description: "Kitchen"
      }
    ],
    availability: true
  },
  {
    title: "Luxury 3BHK Villa",
    description: "Premium villa with garden and terrace",
    rent: 50000,
    location: "Bangalore",
    bedrooms: 3,
    bathrooms: 3,
    amenities: ["WiFi", "AC", "Garden", "Parking", "Swimming Pool", "Gym"],
    photos: [
      {
        url: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&h=300&fit=crop",
        description: "Front View"
      },
      {
        url: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=400&h=300&fit=crop",
        description: "Garden View"
      },
      {
        url: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400&h=300&fit=crop",
        description: "Interior"
      }
    ],
    availability: true
  },
  {
    title: "Cozy 1BHK Studio",
    description: "Compact studio perfect for singles and couples",
    rent: 15000,
    location: "Delhi",
    bedrooms: 1,
    bathrooms: 1,
    amenities: ["WiFi", "AC", "Parking"],
    photos: [
      {
        url: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=300&fit=crop",
        description: "Full View"
      },
      {
        url: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=400&h=300&fit=crop",
        description: "Workspace"
      }
    ],
    availability: true
  },
  {
    title: "Premium 4BHK Penthouse",
    description: "Luxury penthouse with city view and modern fittings",
    rent: 75000,
    location: "Mumbai",
    bedrooms: 4,
    bathrooms: 4,
    amenities: ["WiFi", "AC", "Gym", "Parking", "Concierge", "Swimming Pool", "Home Theater"],
    photos: [
      {
        url: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=400&h=300&fit=crop",
        description: "Living Area"
      },
      {
        url: "https://images.unsplash.com/photo-1600607687644-aac4c3eac7f4?w=400&h=300&fit=crop",
        description: "Terrace"
      },
      {
        url: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=400&h=300&fit=crop",
        description: "Bedroom"
      }
    ],
    availability: true
  },
  {
    title: "Affordable 2BHK Flat",
    description: "Budget-friendly flat in residential area",
    rent: 18000,
    location: "Pune",
    bedrooms: 2,
    bathrooms: 1,
    amenities: ["WiFi", "Parking", "Water Tank"],
    photos: [
      {
        url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&h=300&fit=crop",
        description: "Living Room"
      },
      {
        url: "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=400&h=300&fit=crop",
        description: "Bedroom"
      }
    ],
    availability: true
  },
  {
    title: "Spacious 3BHK Apartment",
    description: "Family-friendly apartment with balcony and parking",
    rent: 32000,
    location: "Hyderabad",
    bedrooms: 3,
    bathrooms: 2,
    amenities: ["WiFi", "AC", "Parking", "Gym", "Children's Play Area"],
    photos: [
      {
        url: "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=400&h=300&fit=crop",
        description: "Hall"
      },
      {
        url: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400&h=300&fit=crop",
        description: "Balcony View"
      },
      {
        url: "https://images.unsplash.com/photo-1600566753151-384129cf4e3e?w=400&h=300&fit=crop",
        description: "Master Bedroom"
      }
    ],
    availability: true
  },
  {
    title: "Elegant 2BHK with Pool",
    description: "Modern apartment in gated community with pool access",
    rent: 28000,
    location: "Chennai",
    bedrooms: 2,
    bathrooms: 2,
    amenities: ["WiFi", "AC", "Swimming Pool", "Parking", "Security", "Gym"],
    photos: [
      {
        url: "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=400&h=300&fit=crop",
        description: "Living Area"
      },
      {
        url: "https://images.unsplash.com/photo-1600607687644-c7171b42498f?w=400&h=300&fit=crop",
        description: "Pool View"
      }
    ],
    availability: true
  },
  {
    title: "Luxurious 3BHK Flat",
    description: "High-end apartment with premium finishes",
    rent: 45000,
    location: "Delhi",
    bedrooms: 3,
    bathrooms: 3,
    amenities: ["WiFi", "AC", "Parking", "Gym", "Club House", "Power Backup"],
    photos: [
      {
        url: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=400&h=300&fit=crop",
        description: "Living Space"
      },
      {
        url: "https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=400&h=300&fit=crop",
        description: "Dining Area"
      },
      {
        url: "https://images.unsplash.com/photo-1600573472556-e636c2f49c9e?w=400&h=300&fit=crop",
        description: "Bedroom"
      }
    ],
    availability: true
  },
  {
    title: "Compact 1BHK Near Metro",
    description: "Convenient location near metro station",
    rent: 12000,
    location: "Bangalore",
    bedrooms: 1,
    bathrooms: 1,
    amenities: ["WiFi", "Parking"],
    photos: [
      {
        url: "https://images.unsplash.com/photo-1600585154363-67eb9e2e2099?w=400&h=300&fit=crop",
        description: "Room View"
      },
      {
        url: "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=400&h=300&fit=crop",
        description: "Interior"
      }
    ],
    availability: true
  },
  {
    title: "Sea View 3BHK Apartment",
    description: "Beautiful sea-facing apartment with modern amenities",
    rent: 55000,
    location: "Mumbai",
    bedrooms: 3,
    bathrooms: 2,
    amenities: ["WiFi", "AC", "Sea View", "Parking", "Gym", "Swimming Pool"],
    photos: [
      {
        url: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400&h=300&fit=crop",
        description: "Sea View"
      },
      {
        url: "https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=400&h=300&fit=crop",
        description: "Living Room"
      },
      {
        url: "https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=400&h=300&fit=crop",
        description: "Balcony"
      }
    ],
    availability: true
  },
  {
    title: "Garden View 2BHK",
    description: "Ground floor apartment with private garden",
    rent: 22000,
    location: "Pune",
    bedrooms: 2,
    bathrooms: 2,
    amenities: ["WiFi", "AC", "Garden", "Parking", "Pet Friendly"],
    photos: [
      {
        url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&h=300&fit=crop",
        description: "Garden"
      },
      {
        url: "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=400&h=300&fit=crop",
        description: "Living Area"
      }
    ],
    availability: true
  },
  {
    title: "Smart 2BHK with Automation",
    description: "Tech-enabled smart home with voice control",
    rent: 35000,
    location: "Bangalore",
    bedrooms: 2,
    bathrooms: 2,
    amenities: ["WiFi", "AC", "Smart Home", "Parking", "Gym", "Security"],
    photos: [
      {
        url: "https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=400&h=300&fit=crop",
        description: "Smart Living Room"
      },
      {
        url: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=400&h=300&fit=crop",
        description: "Bedroom"
      },
      {
        url: "https://images.unsplash.com/photo-1556912172-45b7abe8b7e1?w=400&h=300&fit=crop",
        description: "Modern Kitchen"
      }
    ],
    availability: true
  },
  {
    title: "Lakefront 3BHK",
    description: "Scenic lake view apartment with large balconies",
    rent: 42000,
    location: "Bangalore",
    bedrooms: 3,
    bathrooms: 3,
    amenities: ["WiFi", "AC", "Parking", "Gym", "Lake View"],
    photos: [
      {
        url: "https://images.unsplash.com/photo-1470246973918-29a93221c455?w=400&h=300&fit=crop",
        description: "Lake View Balcony"
      },
      {
        url: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=400&h=300&fit=crop",
        description: "Living Room"
      }
    ],
    availability: true
  },
  {
    title: "Tech Park Proximity 2BHK",
    description: "Walk-to-work flat near major tech parks",
    rent: 30000,
    location: "Bangalore",
    bedrooms: 2,
    bathrooms: 2,
    amenities: ["WiFi", "AC", "Power Backup", "Parking"],
    photos: [
      {
        url: "https://images.unsplash.com/photo-1505693415763-3ed5e04ba4cd?w=400&h=300&fit=crop",
        description: "Exterior"
      },
      {
        url: "https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=400&h=300&fit=crop",
        description: "Bedroom"
      }
    ],
    availability: true
  },
  {
    title: "Airport Express 1BHK",
    description: "Compact unit near airport express line",
    rent: 14000,
    location: "Bangalore",
    bedrooms: 1,
    bathrooms: 1,
    amenities: ["WiFi", "AC", "Parking"],
    photos: [
      {
        url: "https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=400&h=300&fit=crop",
        description: "Studio Layout"
      }
    ],
    availability: true
  },
  {
    title: "Golf Course 4BHK Villa",
    description: "Luxury villa overlooking golf course",
    rent: 90000,
    location: "Gurgaon",
    bedrooms: 4,
    bathrooms: 4,
    amenities: ["WiFi", "AC", "Golf View", "Parking", "Swimming Pool", "Gym"],
    photos: [
      {
        url: "https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=400&h=300&fit=crop",
        description: "Front Lawn"
      },
      {
        url: "https://images.unsplash.com/photo-1505692069463-5e3405e3e7ee?w=400&h=300&fit=crop",
        description: "Living"
      }
    ],
    availability: true
  },
  {
    title: "Business Bay 2BHK",
    description: "City-center apartment ideal for professionals",
    rent: 38000,
    location: "Mumbai",
    bedrooms: 2,
    bathrooms: 2,
    amenities: ["WiFi", "AC", "Parking", "Lift", "Power Backup"],
    photos: [
      {
        url: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&h=300&fit=crop",
        description: "Hall"
      },
      {
        url: "https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=400&h=300&fit=crop",
        description: "Bedroom"
      }
    ],
    availability: true
  },
  {
    title: "Riverside 3BHK",
    description: "Quiet riverside apartment with green views",
    rent: 36000,
    location: "Pune",
    bedrooms: 3,
    bathrooms: 2,
    amenities: ["WiFi", "AC", "Parking", "Garden", "Gym"],
    photos: [
      {
        url: "https://images.unsplash.com/photo-1470246973918-29a93221c455?w=400&h=300&fit=crop",
        description: "Riverside"
      },
      {
        url: "https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=400&h=300&fit=crop",
        description: "Living"
      }
    ],
    availability: true
  }
];

async function seedDatabase() {
  try {
    // Connect to MongoDB
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/voiceagent';
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB');

    // Clear existing properties
    await Property.deleteMany({});
    console.log('Cleared existing properties');

    // Insert new properties
    const insertedProperties = await Property.insertMany(properties);
    console.log(`✓ Successfully seeded ${insertedProperties.length} properties`);

    // Show summary
    console.log('\nProperties by location:');
    const locations = await Property.aggregate([
      { $group: { _id: '$location', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    locations.forEach(loc => {
      console.log(`  ${loc._id}: ${loc.count} properties`);
    });

    console.log('\nAll properties have photos and are available for rent!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();
