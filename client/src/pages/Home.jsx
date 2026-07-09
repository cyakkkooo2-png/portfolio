import { useState, useEffect } from 'react';
import Hero from '../components/Hero';
import WorksGrid from '../components/WorksGrid';
import About from '../components/About';
import Contact from '../components/Contact';
import Footer from '../components/Footer';
import WorkDetailModal from '../components/WorkDetailModal';

export default function Home() {
  const [selectedWork, setSelectedWork] = useState(null);

  // Scroll reveal effect
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    document.querySelectorAll('.section-reveal').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div>
      <Hero />
      <WorksGrid onSelectWork={setSelectedWork} />
      <About />
      <Contact />
      <Footer />
      {selectedWork && <WorkDetailModal work={selectedWork} onClose={() => setSelectedWork(null)} />}
    </div>
  );
}
