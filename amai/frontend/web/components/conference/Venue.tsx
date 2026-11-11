export default function Venue() {
  return (
    <>
      <section className="ai_sec ai_bg_soft ai_venue" id="venue">
        <div className="ai_rv container">
          <div className="row g-4">
            <div className="col-lg-5">
              <div>
                <span className="ai_eyebrow">
                  <i aria-hidden="true" className="bi bi-flask-florence-fill ai_ic"></i> Venue &amp; accommodation
                </span>
                <h2 className="ai_title">
                  Andaz by Hyatt, Aerocity <br /> New Delhi
                </h2>
                <p className="ai_sub">
                  The 12<sup>th</sup> AMAI Alkali Industry Conference will be held on <br /> 28–29 January 2027
                  (Thursday - Friday). Further information on accommodation options and travel guidance will be provided
                  in due course.
                </p>
                <div>
                  <a className="" href="https://www.hyatt.com/andaz/delaz-andaz-delhi" rel="noopener noreferrer" target="_blank">
                    <img
                      src="/img/home/andaz1.webp"
                      alt="Andaz by Hyatt, Aerocity, New Delhi"
                      className="img-fluid w-100"
                    />
                  </a>
                </div>
              </div>
            </div>
            <div className="col-lg-7">
              <div className="ai_map">
                <iframe
                  height="100%"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3504.5125372575567!2d77.11870727549798!3d28.554368175707513!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390d1c68e56ccff3%3A0x377c64cf8683b859!2sAndaz%20Delhi%2C%20by%20Hyatt!5e0!3m2!1sen!2sin!4v1765434052256!5m2!1sen!2sin"
                  title="Map"
                  width="100%"
                ></iframe>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
