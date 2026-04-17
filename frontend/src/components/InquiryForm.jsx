import React, { useState } from 'react';
import '../styles/InquiryForm.css';

import axios from 'axios';

const InquiryForm = () => {
  const [form, setForm] = useState({ name: '', email: '', mobile: '', message: '' });
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  const validate = () => {
    const errs = {};
    if (!form.name.trim() || form.name.trim().length < 2)
      errs.name = 'Please enter your full name (min 2 characters)';
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errs.email = 'Please enter a valid email address';
    if (!form.mobile.trim() || !/^[6-9]\d{9}$/.test(form.mobile))
      errs.mobile = 'Enter a valid 10-digit Indian mobile number';
    if (!form.message.trim() || form.message.trim().length < 10)
      errs.message = 'Please describe your inquiry (min 10 characters)';
    return errs;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    setApiError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    
    setLoading(true);
    setApiError('');
    try {
      await axios.post((import.meta.env.VITE_API_URL || 'http://localhost:5000/api') + '/enquiries', form);
      setSubmitted(true);
      setForm({ name: '', email: '', mobile: '', message: '' });
    } catch (err) {
      setApiError('Failed to submit your inquiry. Please try again or contact us directly.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="contact" className="inquiry-section">
      <div className="inquiry-bg-blob"></div>
      <div className="container inquiry-container">
        {/* Left Info Panel */}
        <div className="inquiry-info">
          <span className="section-tag">Get In Touch</span>
          <h2 className="section-title">
            Start Your <span>Cashflow</span> Journey
          </h2>
          <p className="section-subtitle">
            Whether you need instant cash against your card or want to explore our franchise opportunity — reach out and we'll get back to you within 2 hours.
          </p>

          <div className="inquiry-contact-list">
            <div className="inquiry-contact-item">
              <div className="contact-icon-wrap">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.35 2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 8.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                </svg>
              </div>
              <div>
                <strong>Call Us</strong>
                <span>+91 98765 43210</span>
              </div>
            </div>

            <div className="inquiry-contact-item">
              <div className="contact-icon-wrap">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
              </div>
              <div>
                <strong>Email</strong>
                <span>info@cashflow.in</span>
              </div>
            </div>

            <div className="inquiry-contact-item">
              <div className="contact-icon-wrap">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
              </div>
              <div>
                <strong>Head Office</strong>
                <span>Sangamner, Maharashtra, India</span>
              </div>
            </div>

            <div className="inquiry-contact-item">
              <div className="contact-icon-wrap">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
              </div>
              <div>
                <strong>Working Hours</strong>
                <span>Mon–Sat: 9:00 AM – 7:00 PM</span>
              </div>
            </div>
          </div>

          <div className="inquiry-badge">
            <span>🏆</span>
            <div>
              <strong>Trusted by 2000+ clients</strong>
              <span>across Maharashtra</span>
            </div>
          </div>
        </div>

        {/* Right Form */}
        <div className="inquiry-form-wrap">
          {submitted ? (
            <div className="form-success">
              <div className="success-icon">🎉</div>
              <h3>Inquiry Submitted!</h3>
              <p>Thank you! Our team will contact you within 2 hours.</p>
              <button className="btn-submit" onClick={() => setSubmitted(false)}>
                Submit Another
              </button>
            </div>
          ) : (
            <form className="inquiry-form" onSubmit={handleSubmit} noValidate>
              <h3 className="form-title">Send Us a Message</h3>

              <div className={`form-group ${errors.name ? 'has-error' : ''} ${form.name && !errors.name ? 'has-value' : ''}`}>
                <label htmlFor="name">Full Name</label>
                <div className="input-wrap">
                  <svg className="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Rahul Sharma"
                    autoComplete="name"
                  />
                </div>
                {errors.name && <span className="error-msg">{errors.name}</span>}
              </div>

              <div className={`form-group ${errors.email ? 'has-error' : ''} ${form.email && !errors.email ? 'has-value' : ''}`}>
                <label htmlFor="email">Email Address</label>
                <div className="input-wrap">
                  <svg className="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="rahul@example.com"
                    autoComplete="email"
                  />
                </div>
                {errors.email && <span className="error-msg">{errors.email}</span>}
              </div>

              <div className={`form-group ${errors.mobile ? 'has-error' : ''} ${form.mobile && !errors.mobile ? 'has-value' : ''}`}>
                <label htmlFor="mobile">Mobile Number</label>
                <div className="input-wrap">
                  <svg className="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
                    <line x1="12" y1="18" x2="12.01" y2="18"/>
                  </svg>
                  <input
                    type="tel"
                    id="mobile"
                    name="mobile"
                    value={form.mobile}
                    onChange={handleChange}
                    placeholder="98765 43210"
                    autoComplete="tel"
                    maxLength={10}
                  />
                </div>
                {errors.mobile && <span className="error-msg">{errors.mobile}</span>}
              </div>

              <div className={`form-group ${errors.message ? 'has-error' : ''} ${form.message && !errors.message ? 'has-value' : ''}`}>
                <label htmlFor="message">Your Message</label>
                <div className="input-wrap textarea-wrap">
                  <svg className="input-icon textarea-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  </svg>
                  <textarea
                    id="message"
                    name="message"
                    value={form.message}
                    onChange={handleChange}
                    placeholder="I'm interested in credit card swipe / franchise opportunity..."
                    rows={4}
                  />
                </div>
                {errors.message && <span className="error-msg">{errors.message}</span>}
              </div>

              <button type="submit" className={`btn-submit ${loading ? 'loading' : ''}`} disabled={loading}>
                {loading ? (
                  <>
                    <div className="spinner"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    Send Inquiry
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="22" y1="2" x2="11" y2="13"/>
                      <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                    </svg>
                  </>
                )}
              </button>

              <p className="form-note">
                🔒 Your data is secure. We never share your information.
              </p>
            </form>
          )}
        </div>
      </div>
    </section>
  );
};

export default InquiryForm;
