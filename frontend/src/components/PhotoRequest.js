import React, { useState } from 'react';
import { sendPhotosViaWhatsApp } from '../utils/api';
import '../styles/PhotoRequest.css';

const PhotoRequest = ({ propertyId, propertyTitle, onClose }) => {
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await sendPhotosViaWhatsApp(phone, propertyId, name);
      setMessage(`✓ Photos will be sent to ${phone} on WhatsApp!`);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      setMessage('Error sending photos. Please try again.');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="photo-request-overlay">
      <div className="photo-request-modal">
        <h3>Get Photos - {propertyTitle}</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Your name"
            />
          </div>
          <div className="form-group">
            <label>WhatsApp Number (10 digits)</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
              maxLength="10"
              required
              placeholder="9876543210"
            />
          </div>
          <div className="form-actions">
            <button type="submit" disabled={isLoading}>
              {isLoading ? 'Sending...' : 'Send Photos'}
            </button>
            <button type="button" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
        {message && <p className="form-message">{message}</p>}
      </div>
    </div>
  );
};

export default PhotoRequest;
