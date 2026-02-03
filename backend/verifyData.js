const mongoose = require('mongoose');
const Property = require('./models/Property');
require('dotenv').config();

async function verifyData() {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/voiceagent';
    await mongoose.connect(mongoURI);
    
    const count = await Property.countDocuments();
    const withPhotos = await Property.countDocuments({ 'photos.0': { $exists: true } });
    
    console.log('✓ Total properties:', count);
    console.log('✓ Properties with photos:', withPhotos);
    
    if (count > 0) {
      const sample = await Property.findOne().select('title location photos');
      console.log('\nSample property:');
      console.log('  Title:', sample.title);
      console.log('  Location:', sample.location);
      console.log('  Photos:', sample.photos.length);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

verifyData();
