import { useEffect, useState } from "react";
import "./AboutUs.css";

const introduction = "Established with a passion for authentic flavors, GHALIB Restaurant has become a landmark for food lovers. We believe that dining is not just about eating; it's about the experience, the aroma, and the memories shared around the table.";
const heritage = "Our chefs use age-old recipes passed down through generations, combined with the freshest local ingredients, to bring you the true essence of traditional cuisine. Whether it's our signature Mandi or our aromatic Biryani, every dish tells a story of heritage.";

const values = [
  {
    title: "Authenticity",
    text: "We stay true to our roots, using original spices and traditional cooking methods.",
  },
  {
    title: "Quality",
    text: "Only the finest cuts of meat and hand-picked vegetables make it to our kitchen.",
  },
  {
    title: "Hospitality",
    text: "At Ghalib, every guest is treated like family. Your comfort is our priority.",
  },
];

export default function AboutUs() {
  const [typedCharacters, setTypedCharacters] = useState(0);
  const totalCharacters = introduction.length + heritage.length;
  const typedIntroduction = introduction.slice(0, Math.min(typedCharacters, introduction.length));
  const typedHeritage = heritage.slice(0, Math.max(0, typedCharacters - introduction.length));

  useEffect(() => {
    const revealElements = document.querySelectorAll(".reveal");
    const reveal = (element) => element.classList.add("is-visible");

    if (!("IntersectionObserver" in window)) {
      revealElements.forEach(reveal);
      return undefined;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        reveal(entry.target);
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.15 });

    revealElements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setTypedCharacters(totalCharacters);
      return undefined;
    }

    if (typedCharacters >= totalCharacters) return undefined;

    const timer = window.setTimeout(
      () => setTypedCharacters((count) => count + 1),
      typedCharacters === introduction.length ? 450 : 18,
    );

    return () => window.clearTimeout(timer);
  }, [totalCharacters, typedCharacters]);

  return (
    <>
      <section className="about-hero">
        <div className="about-text hero-reveal">
          <h1>The Story of GHALIB</h1>
          <p className="subtitle">A Tradition of Taste and Excellence</p>
          <hr className="line" />
          <p className="typing-text">
            {typedIntroduction}
            {typedCharacters < introduction.length && <span className="typing-cursor" aria-hidden="true" />}
          </p>
          <p className="typing-text">
            {typedHeritage}
            {typedCharacters >= introduction.length && typedCharacters < totalCharacters && (
              <span className="typing-cursor" aria-hidden="true" />
            )}
          </p>
        </div>
      </section>

      <section className="values">
        {values.map((v, index) => (
          <div className="value-card reveal" key={v.title} style={{ "--reveal-delay": `${index * 120}ms` }}>
            <h3>{v.title}</h3>
            <p>{v.text}</p>
          </div>
        ))}
      </section>

      <section className="location-section reveal" aria-labelledby="location-heading">
        <div className="location-heading">
          <p>Find Us</p>
          <h2 id="location-heading">Visit GHALIB Restaurant</h2>
        </div>
       
      </section>
    </>
  );
}
