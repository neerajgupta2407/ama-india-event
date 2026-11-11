export default function Participate() {
  return (
    <>
      <section className="ai_sec ai_bg_soft ai_participate" id="participate">
        <div className="ai_rv container">
          <div className="ai_head">
            <div>
              <span className="ai_eyebrow">
                <i aria-hidden="true" className="bi bi-recycle ai_ic"></i> Participate
              </span>
              <h2 className="ai_title">Exhibit or partner with AMAI</h2>
            </div>
          </div>
          <div className="row g-4 justify-content-center">
            <div className="col-md-6 col-lg-4 d-flex" id="exhibitor">
              <div className="ai_pr">
                <div className="ai_pr_img">
                  <img alt="Exhibit at AMAI 2027" loading="lazy" src="/img/home/1e.webp" className="img-fluid" />
                </div>
                <div className="ai_pr_body">
                  <h3>Exhibit at AMAI 2027</h3>
                  <p>
                    Showcase your expertise, connect with key decision-makers and raise your profile across the alkali
                    industry.
                  </p>
                  <a className="ai_btn" href="mailto:hkanand@ama-india.org">
                    Enquire Now <i aria-hidden="true" className="bi bi-arrow-right ai_ic"></i>
                  </a>
                </div>
              </div>
            </div>
            <div className="col-md-6 col-lg-4 d-flex" id="sponsorship">
              <div className="ai_pr">
                <div className="ai_pr_img">
                  <img alt="Sponsor" loading="lazy" src="/img/home/2e.webp" className="img-fluid" />
                </div>
                <div className="ai_pr_body">
                  <h3>Sponsor</h3>
                  <p>
                    Align your organisation with a trusted industry platform and demonstrate your commitment to the
                    alkali industry.
                  </p>
                  <a className="ai_btn" href="mailto:hkanand@ama-india.org">
                    Enquire Now <i aria-hidden="true" className="bi bi-arrow-right ai_ic"></i>
                  </a>
                </div>
              </div>
            </div>
            <div className="col-md-6 col-lg-4 d-flex" id="delegates">
              <div className="ai_pr">
                <div className="ai_pr_img">
                  <img alt="Register as Delegate" className="img-fluid" loading="lazy" src="/img/home/3e.webp" />
                </div>
                <div className="ai_pr_body">
                  <h3>Register as Delegate</h3>
                  <p>
                    Join industry leaders, policymakers and experts for two days of sessions, discussions and networking
                    across the alkali and chemical industry.
                  </p>
                  <a className="ai_btn" href="#register">
                    Register Now <i aria-hidden="true" className="bi bi-arrow-right ai_ic"></i>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
