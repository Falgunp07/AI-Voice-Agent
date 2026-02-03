const express = require('express');
const router = express.Router();
const propertyController = require('../controllers/propertyController');

// Get all properties
router.get('/', propertyController.getAllProperties);

// Get property by ID
router.get('/:id', propertyController.getPropertyById);

// Search by location
router.get('/search/location', propertyController.searchByLocation);

// Get rent info
router.get('/:propertyId/rent', propertyController.getRentInfo);

// Get property photos
router.get('/:propertyId/photos', propertyController.getPropertyPhotos);

// Create property (Admin)
router.post('/', propertyController.createProperty);

// Update property
router.put('/:id', propertyController.updateProperty);

// Delete property
router.delete('/:id', propertyController.deleteProperty);

module.exports = router;
