import "./AboutUs.css";

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
  return (
    <>
      <section className="about-hero">
        <div className="about-text">
          <h1>The Story of GHALIB</h1>
          <p className="subtitle">A Tradition of Taste and Excellence</p>
          <hr className="line" />
          <p>
            Established with a passion for authentic flavors, GHALIB
            Restaurant has become a landmark for food lovers. We believe that
            dining is not just about eating; it's about the experience, the
            aroma, and the memories shared around the table.
          </p>
          <p>
            Our chefs use age-old recipes passed down through generations,
            combined with the freshest local ingredients, to bring you the
            true essence of traditional cuisine. Whether it's our signature
            Mandi or our aromatic Biryani, every dish tells a story of
            heritage.
          </p>
        </div>
      </section>

      <section className="values">
        {values.map((v) => (
          <div className="value-card" key={v.title}>
            <h3>{v.title}</h3>
            <p>{v.text}</p>
          </div>
        ))}
      </section>
    </>
  );
}
