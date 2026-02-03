import React, { useState } from 'react';
import ChatInterface from '../components/ChatInterface';
import PropertyListing from '../components/PropertyListing';
import '../styles/Home.css';

const Home = () => {
  const [sessionId] = useState(Math.random().toString(36).substr(2, 9));

  return (
    <div className="home-page">
      <header className="header">
        <h1>🏠 Real Estate Voice Assistant</h1>
        <p>Talk to our AI agent to find your perfect property</p>
      </header>

      <main className="main-content">
        <div className="content-grid">
          <section className="chat-section">
            <ChatInterface sessionId={sessionId} />
          </section>
          <section className="properties-section">
            <PropertyListing />
          </section>
        </div>
      </main>

      <footer className="footer">
        <p>© 2026 Real Estate Voice Assistant. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Home;
