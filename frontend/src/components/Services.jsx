import React from 'react';
import '../styles/Services.css';

const services = [
  {
    id: 1,
    icon: '💳',
    title: 'Credit Card Swipe',
    description: 'Get instant cash against your credit card limit with the lowest charges in the market. Same-day processing guaranteed across all networks.',
    tag: 'Most Popular',
    color: '#723480',
  },
  {
    id: 2,
    icon: '🔄',
    title: 'Credit Card Renewal',
    description: 'Seamlessly renew your credit card before expiry. We handle all the paperwork and coordination with your bank for a hassle-free renewal experience.',
    tag: 'Quick Process',
    color: '#808034',
  },
  {
    id: 3,
    icon: '📋',
    title: 'Credit Card Application',
    description: 'Apply for a new credit card through our expert team. We match you with the best card based on your profile and maximize your approval chances.',
    tag: 'High Approval',
    color: '#9b3db3',
  },
];

const Services = () => {
  return (
    <section id="services" className="services-section">
      <div className="services-bg-accent"></div>
      <div className="container">
        <div className="services-header">
          <span className="section-tag">Our Services</span>
          <h2 className="section-title">
            Everything You Need for <span>Smart Cashflow</span>
          </h2>
          <p className="section-subtitle">
            From instant swipes to new card applications — we handle it all with speed, transparency, and minimal charges.
          </p>
        </div>

        <div className="services-grid">
          {services.map((service, index) => (
            <div
              className="service-card"
              key={service.id}
              style={{ animationDelay: `${index * 0.15}s` }}
            >
              <div className="service-card-inner">
                {/* Top */}
                <div className="service-top">
                  <div className="service-icon-wrap" style={{ background: `${service.color}14`, border: `1.5px solid ${service.color}22` }}>
                    <span className="service-icon">{service.icon}</span>
                  </div>
                  <span className="service-tag" style={{ background: `${service.color}14`, color: service.color }}>
                    {service.tag}
                  </span>
                </div>

                {/* Content */}
                <h3 className="service-title">{service.title}</h3>
                <p className="service-desc">{service.description}</p>

                {/* Features */}
                <ul className="service-features">
                  <li>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                    Fast Processing
                  </li>
                  <li>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                    Minimal Charges
                  </li>
                  <li>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                    Trusted & Secure
                  </li>
                </ul>

                {/* Arrow CTA */}
                <a href="#contact" className="service-arrow-btn" style={{ '--accent': service.color }}>
                  <span>Learn More</span>
                  <div className="arrow-circle">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </div>
                </a>
              </div>

              {/* Hover glow */}
              <div className="service-glow" style={{ background: `radial-gradient(circle at 50% 100%, ${service.color}18 0%, transparent 60%)` }}></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Services;
