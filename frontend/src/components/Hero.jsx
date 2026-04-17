import { useNavigate } from "react-router-dom";
import React from 'react';
import '../styles/Hero.css';

const Hero = () => {

   const navigate = useNavigate();

  return (


    <section id="home" className="hero">
      {/* Background Blobs */}
      <div className="hero-blob hero-blob-1"></div>
      <div className="hero-blob hero-blob-2"></div>

      <div className="container hero-container">
        {/* Left Content */}
        <div className="hero-content">
          <span className="section-tag">🚀 India's Fastest Cashflow Network</span>

          <h1 className="hero-heading">
            Credit Card Swipe in <span className="highlight">Less Charges</span> &amp; <br/> <span className="highlight-olive">Spot Instant Cash</span>
          </h1>

          <p className="hero-subtext">
            Get instant liquidity from your credit card with minimal charges. Our franchise network ensures same-day cashflow across Maharashtra and beyond.
          </p>

          <div className="hero-stats">
            <div className="stat">
              <strong>₹50Cr+</strong>
              <span>Monthly Volume</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat">
              <strong>2000+</strong>
              <span>Happy Clients</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat">
              <strong>48hrs</strong>
              <span>Fast Processing</span>
            </div>
          </div>

          <div className="hero-cta-group">
            <a href="#contact" className="btn-primary"  onClick={() => navigate("/Login")}>
              Get Started
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </a>
            <a href="#contact" className="btn-outline" >
              Inquire for Franchise
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
            </a>
          </div>
        </div>

        {/* Right Visual */}
        <div className="hero-visual">
          {/* Animated Credit Card */}
          <div className="card-scene">
            <div className="credit-card card-main">
              <div className="card-bg-pattern"></div>
              <div className="card-top">
                <div className="card-chip">
                  <div className="chip-lines"></div>
                </div>
                <div className="card-wifi">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" opacity="0.8">
                    <path d="M5 12.55a11 11 0 0 1 14.08 0"/>
                    <path d="M1.42 9a16 16 0 0 1 21.16 0"/>
                    <path d="M8.53 16.11a6 6 0 0 1 6.95 0"/>
                    <circle cx="12" cy="20" r="1" fill="white"/>
                  </svg>
                </div>
              </div>
              <div className="card-number">4532 •••• •••• 7841</div>
              <div className="card-bottom">
                <div>
                  <div className="card-label">CARD HOLDER</div>
                  <div className="card-value">RAHUL SHARMA</div>
                </div>
                <div>
                  <div className="card-label">EXPIRES</div>
                  <div className="card-value">08/27</div>
                </div>
                <div className="card-network">
                  <div className="circle-o circle-left"></div>
                  <div className="circle-o circle-right"></div>
                </div>
              </div>
            </div>

            {/* Second card behind */}
            <div className="credit-card card-back"></div>

            {/* Floating transaction notification */}
            <div className="notif-card notif-1">
              <div className="notif-icon">✅</div>
              <div className="notif-text">
                <strong>Transaction Success</strong>
                <span>₹50,000 credited</span>
              </div>
            </div>

            <div className="notif-card notif-2">
              <div className="notif-icon">💸</div>
              <div className="notif-text">
                <strong>Low Charge: 1.2%</strong>
                <span>Saved ₹1,800 today</span>
              </div>
            </div>

            {/* Swipe indicator */}
            {/* <div className="swipe-indicator">
              <div className="swipe-bar">
                <div className="swipe-thumb">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </div>
              </div>
              <span>Swipe to Cashflow</span>
            </div> */}
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="scroll-hint">
        <div className="scroll-mouse">
          <div className="scroll-wheel"></div>
        </div>
        <span>Scroll to explore</span>
      </div>
    </section>
  );
};

export default Hero;
