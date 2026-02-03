// Sample data to seed the database
// Run this in MongoDB to populate initial properties

db.properties.insertMany([
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
        url: "https://via.placeholder.com/400x300?text=Apartment+1",
        description: "Living Room"
      },
      {
        url: "https://via.placeholder.com/400x300?text=Bedroom",
        description: "Master Bedroom"
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
        url: "https://via.placeholder.com/400x300?text=Villa+1",
        description: "Front View"
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
        url: "https://via.placeholder.com/400x300?text=Studio",
        description: "Full View"
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
        url: "https://via.placeholder.com/400x300?text=Penthouse+1",
        description: "Living Area"
      }
    ],
    availability: true
  }
]);
