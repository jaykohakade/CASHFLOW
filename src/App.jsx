import React from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Services from './components/Services';
import Reviews from './components/Reviews';
import InquiryForm from './components/InquiryForm';
import Footer from './components/Footer';
import './styles/global.css';

function App() {
  return (
    <div className="app">
      <Navbar />
      <main>
        <Hero />
        <Services />
        <Reviews />
        <InquiryForm />
      </main>
      <Footer />
    </div>
  );
}

export default App;
