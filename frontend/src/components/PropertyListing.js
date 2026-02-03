import React, { useState, useEffect } from 'react';
import { getAllProperties } from '../utils/api';
import PhotoRequest from './PhotoRequest';
import CallRequest from './CallRequest';
import '../styles/PropertyListing.css';

const PropertyListing = ({ onSelectProperty }) => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [photoModal, setPhotoModal] = useState(null); // {id, title}
  const [callModal, setCallModal] = useState(null); // {id, title, city}

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      const response = await getAllProperties();
      setProperties(response.data);
    } catch (err) {
      setError('Failed to load properties');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading properties...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="property-listing">
      <h2>Featured Properties</h2>
      <div className="properties-grid">
        {properties.map((property) => (
          <div key={property._id} className="property-card">
            <div className="property-image">
              {property.photos && property.photos.length > 0 ? (
                <img src={property.photos[0].url} alt={property.title} />
              ) : (
                <div className="no-image">No Image</div>
              )}
            </div>
            <div className="property-info">
              <h3>{property.title}</h3>
              <p className="location">📍 {property.location}</p>
              <p className="rent">Rs. {property.rent}/month</p>
              <p className="description">{property.description}</p>
              <div className="specs">
                {property.bedrooms && <span>🛏️ {property.bedrooms} BHK</span>}
                {property.bathrooms && <span>🚿 {property.bathrooms} Baths</span>}
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {onSelectProperty && (
                  <button onClick={() => onSelectProperty(property)}>
                    View Details
                  </button>
                )}
                <button onClick={() => setPhotoModal({ id: property._id, title: property.title })}>
                  WhatsApp Photos
                </button>
                <button onClick={() => setCallModal({ id: property._id, title: property.title, city: property.location })}>
                  Call Me
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {photoModal && (
        <PhotoRequest
          propertyId={photoModal.id}
          propertyTitle={photoModal.title}
          onClose={() => setPhotoModal(null)}
        />
      )}
      {callModal && (
        <CallRequest
          propertyId={callModal.id}
          propertyTitle={callModal.title}
          city={callModal.city}
          onClose={() => setCallModal(null)}
        />
      )}
    </div>
  );
};

export default PropertyListing;
