import styles from "./Footer.module.css";

export default function Footer() {
  return (
    <footer>
      <section className={styles.locationSection}>
        <div className={styles.locationInner}>
          <div className={styles.locationInfo}>
            <img src="/logo.png" alt="Two Wheels World" className={styles.locationLogo} />
            <p className={styles.eyebrow}>Encuéntranos</p>
            <h2 className={styles.sectionTitle}>
              Nuestra <span className={styles.accentWord}>Ubicación</span>
            </h2>
            <ul className={styles.locationList}>
              <li>
                <LocationIcon />
                <span>José Correa y Av. 6 de Diciembre, 170504 Quito, Ecuador</span>
              </li>
              <li>
                <PhoneIcon />
                <a href="tel:+593959491417">0959 491 417</a>
              </li>
              <li>
                <ClockIcon />
                <span>Lun – Sáb: 10:00 – 18:00</span>
              </li>
              <li>
                <WhatsAppIcon />
                <a
                  href="https://wa.me/593959491417"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.whatsappLink}
                >
                  Escríbenos por WhatsApp
                </a>
              </li>
            </ul>
          </div>
          <div className={styles.locationMap}>
            <iframe
              title="Two Wheels World ubicación"
              src="https://maps.google.com/maps?q=José+Correa+y+Av.+6+de+Diciembre,+Quito,+Ecuador&output=embed&hl=es&z=16"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </section>

      <div className={styles.copyright}>
        <p>© {new Date().getFullYear()} Two Wheels World. Diseñado para el Rendimiento.</p>
      </div>
    </footer>
  );
}

function LocationIcon() {
  return (
    <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
    </svg>
  );
}
function PhoneIcon() {
  return (
    <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.27h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.91a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
    </svg>
  );
}
function ClockIcon() {
  return (
    <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  );
}
function WhatsAppIcon() {
  return (
    <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12 0C5.373 0 0 5.373 0 12c0 2.123.555 4.116 1.527 5.845L.057 23.938l6.241-1.634A11.94 11.94 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.797 9.797 0 0 1-5.002-1.368l-.36-.213-3.706.972.988-3.617-.234-.373A9.787 9.787 0 0 1 2.182 12C2.182 6.57 6.57 2.182 12 2.182S21.818 6.57 21.818 12 17.43 21.818 12 21.818z"/>
    </svg>
  );
}
