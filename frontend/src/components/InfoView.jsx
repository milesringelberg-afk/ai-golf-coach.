const STEPS = [
  {
    icon: "🎥",
    title: "Je uploadt een swing",
    body: "De video gaat naar de server en wordt teruggespeeld in de speler. Op de gratis hosting worden video's niet permanent bewaard.",
  },
  {
    icon: "🦴",
    title: "Je lichaam wordt herkend",
    body: "MediaPipe Pose draait volledig in je eigen browser en volgt punten als schouders, heupen, knieën en polsen — frame voor frame.",
  },
  {
    icon: "📐",
    title: "Hoeken worden berekend",
    body: "Uit die punten volgt simpele meetkunde: kniebuiging en rughoek bij address, plus schouder- en heupdraaiing tijdens de swing.",
  },
  {
    icon: "⏱️",
    title: "Fases worden geschat",
    body: "Aan de hand van de polshoogte en -snelheid schat de app waar address, top, impact en finish zitten.",
  },
];

export default function InfoView() {
  return (
    <div className="info-view">
      <section className="stats-block">
        <h2 className="section-title">Hoe het werkt</h2>
        <div className="info-grid">
          {STEPS.map((step, i) => (
            <article className="info-card" key={step.title} style={{ animationDelay: `${i * 60}ms` }}>
              <span className="info-icon">{step.icon}</span>
              <h3>{step.title}</h3>
              <p>{step.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="stats-block">
        <h2 className="section-title">Wat dit (nog) niet is</h2>
        <ul className="caveat-list">
          <li>
            <strong>Geen echte coach.</strong> De tips zijn vaste voorbeeldteksten en grove
            vuistregels op basis van hoeken — geen gepersonaliseerd advies.
          </li>
          <li>
            <strong>Geen bal- of clubherkenning.</strong> De app ziet alleen je lichaam, dus
            balpositie, clubface en balvlucht kunnen niet worden beoordeeld.
          </li>
          <li>
            <strong>Fasedetectie is niet gevalideerd.</strong> De momenten voor top en impact zijn
            een schatting; controleer zelf of ze kloppen met wat je ziet.
          </li>
          <li>
            <strong>Eén camerahoek.</strong> Er wordt nog geen onderscheid gemaakt tussen opnames
            van voren en van achteren langs de doellijn.
          </li>
        </ul>
      </section>
    </div>
  );
}
