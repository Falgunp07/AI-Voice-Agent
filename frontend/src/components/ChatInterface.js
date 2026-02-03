import React, { useState, useRef, useEffect } from 'react';
import { processQuery } from '../utils/api';
import { startListening, speakText, stopSpeech } from '../utils/voiceHandler';
import '../styles/ChatInterface.css';

const ChatInterface = ({ sessionId }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isListening, isListeningSet] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [photoIndices, setPhotoIndices] = useState({}); // Track current photo index for each message
  const recognitionRef = useRef(null);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      stopSpeech();
      setIsSpeaking(false);
    };
  }, []);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    // Add user message to chat
    setMessages((prev) => [...prev, { type: 'user', text: input }]);
    setIsLoading(true);

    try {
      const response = await processQuery(input, sessionId);
      const botMessage = response.data.response;
      const photos = response.data.photos;

      // Add bot response to chat
      setMessages((prev) => [...prev, { type: 'bot', text: botMessage, photos: photos || [] }]);

      // Speak bot response
      setIsSpeaking(true);
      speakText(botMessage, () => {
        setIsSpeaking(false);
      });

      setInput('');
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages((prev) => [
        ...prev,
        { type: 'bot', text: 'Sorry, something went wrong. Please try again.' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoiceInput = () => {
    if (isListening) {
      recognitionRef.current.stop();
      isListeningSet(false);
    } else {
      isListeningSet(true);
      recognitionRef.current = startListening(
        async (transcript) => {
          setInput(transcript);
          isListeningSet(false);
          
          // Auto-send message after voice input
          if (transcript.trim()) {
            // Add user message to chat
            setMessages((prev) => [...prev, { type: 'user', text: transcript }]);
            setIsLoading(true);

            try {
              const response = await processQuery(transcript, sessionId);
              const botMessage = response.data.response;
              const photos = response.data.photos;

              // Add bot response to chat
              setMessages((prev) => [...prev, { type: 'bot', text: botMessage, photos: photos || [] }]);

              // Speak bot response
              setIsSpeaking(true);
              speakText(botMessage, () => {
                setIsSpeaking(false);
              });

              setInput('');
            } catch (error) {
              console.error('Error sending message:', error);
              setMessages((prev) => [
                ...prev,
                { type: 'bot', text: 'Sorry, something went wrong. Please try again.' },
              ]);
            } finally {
              setIsLoading(false);
            }
          }
        },
        (error) => {
          console.error('Voice input error:', error);
          isListeningSet(false);
        }
      );
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !isLoading) {
      handleSendMessage();
    }
  };

  const handleStopSpeech = () => {
    stopSpeech();
    setIsSpeaking(false);
  };

  const handleNextPhoto = (msgIdx, photoCount) => {
    setPhotoIndices((prev) => ({
      ...prev,
      [msgIdx]: ((prev[msgIdx] || 0) + 1) % photoCount,
    }));
  };

  const handlePrevPhoto = (msgIdx, photoCount) => {
    setPhotoIndices((prev) => ({
      ...prev,
      [msgIdx]: ((prev[msgIdx] || 0) - 1 + photoCount) % photoCount,
    }));
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h2>Real Estate Voice Assistant</h2>
      </div>

      <div className="chat-messages">
        {messages.map((msg, idx) => (
          <div key={idx} className={`message ${msg.type}`}>
            <p>{msg.text}</p>
            {msg.photos && msg.photos.length > 0 && (
              <div className="photo-carousel">
                <button
                  className="carousel-btn prev"
                  onClick={() => handlePrevPhoto(idx, msg.photos.length)}
                  disabled={msg.photos.length <= 1}
                >
                  ◀
                </button>
                <div className="carousel-container">
                  <div className="photo-item">
                    <img
                      src={msg.photos[photoIndices[idx] || 0].url}
                      alt={msg.photos[photoIndices[idx] || 0].description || 'Property'}
                    />
                    <div className="photo-caption">
                      <strong>{msg.photos[photoIndices[idx] || 0].propertyTitle}</strong>
                      {msg.photos[photoIndices[idx] || 0].description && (
                        <p>{msg.photos[photoIndices[idx] || 0].description}</p>
                      )}
                      {msg.photos[photoIndices[idx] || 0].location && (
                        <p className="location">
                          📍 {msg.photos[photoIndices[idx] || 0].location}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  className="carousel-btn next"
                  onClick={() => handleNextPhoto(idx, msg.photos.length)}
                  disabled={msg.photos.length <= 1}
                >
                  ▶
                </button>
                <div className="carousel-dots">
                  {msg.photos.map((_, photoIdx) => (
                    <span
                      key={photoIdx}
                      className={`dot ${photoIdx === (photoIndices[idx] || 0) ? 'active' : ''}`}
                      onClick={() =>
                        setPhotoIndices((prev) => ({ ...prev, [idx]: photoIdx }))
                      }
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="chat-input-area">
        <div className="input-group">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your query or use voice..."
            disabled={isLoading}
          />
          <button onClick={handleSendMessage} disabled={isLoading || !input.trim()}>
            Send
          </button>
          {isSpeaking ? (
            <button
              onClick={handleStopSpeech}
              className="stop-btn"
              title="Stop speaking"
            >
              ⏹️ Stop
            </button>
          ) : (
            <button
              onClick={handleVoiceInput}
              className={`voice-btn ${isListening ? 'listening' : ''}`}
            >
              🎤 {isListening ? 'Listening...' : 'Voice'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
