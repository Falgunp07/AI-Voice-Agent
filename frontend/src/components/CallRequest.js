import React, { useState } from 'react';
import { initiateVoiceCall } from '../utils/api';
import '../styles/CallRequest.css';

const CallRequest = ({ propertyId, propertyTitle, city, onClose }) => {
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    try {
      const payload = { to: `+91${phone}` };
      if (propertyId) payload.propertyId = propertyId;
      if (city) payload.city = city;
      const response = await initiateVoiceCall(payload);
      const mode = response.data.mode || 'simulated';
      if (mode === 'twilio') {
        setMessage('✓ Call is being placed to your number.');
      } else {
        setMessage('Simulated call. Configure Twilio to place real calls.');
      }
      setTimeout(() => onClose(), 2000);
    } catch (err) {
      console.error(err);
      setMessage('Error initiating call. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="call-request-overlay">
      <div className="call-request-modal">
        <h3>Get a Call - {propertyTitle}</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Mobile Number (10 digits)</label>
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
              {isLoading ? 'Calling...' : 'Call Me'}
            </button>
            <button type="button" onClick={onClose}>Cancel</button>
          </div>
        </form>
        {message && <p className="form-message">{message}</p>}
      </div>
    </div>
  );
};

export default CallRequest;
