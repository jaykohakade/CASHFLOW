import React, { useState, useRef } from 'react';
import '../styles/Reviews.css';

const reviews = [
  {
    id: 1,
    name: 'Rahul Deshmukh',
    location: 'Pune, Maharashtra',
    lang: 'मराठी',
    langColor: '#723480',
    avatar: 'RD',
    rating: 5,
    text: 'कॅशफ्लोने मला खूप मदत केली! क्रेडिट कार्ड स्वाइप करून तात्काळ पैसे मिळाले. चार्जेस खूप कमी होते आणि सेवा अतिशय जलद होती. मी नक्कीच पुन्हा वापरेन.',
    highlight: 'तात्काळ पैसे मिळाले',
  },
  {
    id: 2,
    name: 'Priya Sharma',
    location: 'Mumbai, Maharashtra',
    lang: 'हिंदी',
    langColor: '#808034',
    avatar: 'PS',
    rating: 5,
    text: 'कैशफ्लो सर्विस बेहद शानदार है! मुझे अचानक पैसों की जरूरत थी और इन्होंने 2 घंटे के अंदर मेरे खाते में पैसे ट्रांसफर कर दिए। बहुत कम चार्ज में बढ़िया सेवा।',
    highlight: '2 घंटे में ट्रांसफर',
  },
  {
    id: 3,
    name: 'Amit Joshi',
    location: 'Nashik, Maharashtra',
    lang: 'English',
    langColor: '#9b3db3',
    avatar: 'AJ',
    rating: 5,
    text: 'Absolutely brilliant service! I needed urgent funds and Cashflow delivered within hours. The charges were the lowest I\'ve seen anywhere, and the team was extremely professional and helpful throughout.',
    highlight: 'Lowest charges anywhere',
  },
  {
    id: 4,
    name: 'Sunita Patil',
    location: 'Sangamner, Maharashtra',
    lang: 'मराठी',
    langColor: '#723480',
    avatar: 'SP',
    rating: 5,
    text: 'फ्रँचाइझी घेण्याचा निर्णय खूप चांगला होता. कॅशफ्लो टीम नेहमीच सपोर्टला असते. ग्राहकांचा विश्वास आहे आणि व्यवसाय खूप चांगला चालतो. धन्यवाद कॅशफ्लो!',
    highlight: 'फ्रँचाइझी व्यवसाय',
  },
  {
    id: 5,
    name: 'Vijay Kumar',
    location: 'Aurangabad, Maharashtra',
    lang: 'हिंदी',
    langColor: '#808034',
    avatar: 'VK',
    rating: 5,
    text: 'मेरा क्रेडिट कार्ड रिन्यूअल बहुत आसान हो गया। कैशफ्लो की टीम ने सारा काम संभाल लिया। न कोई परेशानी, न ज्यादा इंतजार। बेस्ट सर्विस!',
    highlight: 'आसान रिन्यूअल प्रक्रिया',
  },
  {
    id: 6,
    name: 'Sneha Kulkarni',
    location: 'Pune, Maharashtra',
    lang: 'English',
    langColor: '#9b3db3',
    avatar: 'SK',
    rating: 5,
    text: 'Got my new credit card approved through Cashflow with incredible speed. Their team knows exactly which bank to approach for your profile. Highly recommend for anyone looking to build credit.',
    highlight: 'Expert bank guidance',
  },
];

const Reviews = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const sliderRef = useRef(null);
  const visibleCount = 3;

  const scroll = (dir) => {
    const maxIndex = reviews.length - visibleCount;
    setActiveIndex(prev =>
      dir === 'next'
        ? Math.min(prev + 1, maxIndex)
        : Math.max(prev - 1, 0)
    );
  };

  const renderStars = (count) =>
    Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={`star ${i < count ? 'filled' : ''}`}>★</span>
    ));

  return (
    <section id="about" className="reviews-section">
      <div className="reviews-bg"></div>
      <div className="container">
        <div className="reviews-header">
          <span className="section-tag">Testimonials</span>
          <h2 className="section-title">
            What Our <span>Clients Say</span>
          </h2>
          <p className="section-subtitle">
            Real stories from real customers across Maharashtra — in their own language.
          </p>
        </div>

        {/* Language badges */}
        <div className="lang-badges">
          <span className="lang-badge" style={{ background: '#72348014', color: '#723480', border: '1.5px solid #72348030' }}>मराठी Reviews</span>
          <span className="lang-badge" style={{ background: '#80803414', color: '#808034', border: '1.5px solid #80803430' }}>हिंदी Reviews</span>
          <span className="lang-badge" style={{ background: '#9b3db314', color: '#9b3db3', border: '1.5px solid #9b3db330' }}>English Reviews</span>
        </div>

        <div className="reviews-slider-wrap">
          {/* Arrow Controls */}
          <button
            className="slider-arrow arrow-prev"
            onClick={() => scroll('prev')}
            disabled={activeIndex === 0}
            aria-label="Previous"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </button>

          <div className="reviews-slider" ref={sliderRef}>
            <div
              className="reviews-track"
              style={{ transform: `translateX(calc(-${activeIndex * (100 / visibleCount)}% - ${activeIndex * 28}px))` }}
            >
              {reviews.map((review) => (
                <div className="review-card" key={review.id}>
                  {/* Quote */}
                  <div className="review-quote-icon">"</div>

                  {/* Rating */}
                  <div className="review-rating">{renderStars(review.rating)}</div>

                  {/* Text */}
                  <p className="review-text">{review.text}</p>

                  {/* Highlight chip */}
                  <div className="review-highlight">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                    {review.highlight}
                  </div>

                  {/* Author */}
                  <div className="review-author">
                    <div className="review-avatar">{review.avatar}</div>
                    <div className="review-author-info">
                      <strong>{review.name}</strong>
                      <span>{review.location}</span>
                    </div>
                    <span
                      className="review-lang"
                      style={{ background: `${review.langColor}14`, color: review.langColor, border: `1px solid ${review.langColor}25` }}
                    >
                      {review.lang}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            className="slider-arrow arrow-next"
            onClick={() => scroll('next')}
            disabled={activeIndex >= reviews.length - visibleCount}
            aria-label="Next"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </button>
        </div>

        {/* Dots */}
        <div className="slider-dots">
          {Array.from({ length: reviews.length - visibleCount + 1 }, (_, i) => (
            <button
              key={i}
              className={`dot ${i === activeIndex ? 'active' : ''}`}
              onClick={() => setActiveIndex(i)}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Reviews;
