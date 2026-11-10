export default function About() {
  return (
    <>
      <section className="ai_sec ai_about_wrap" id="about">
        <div className="ai_rv container">
          <div className="row">
            <div className="col-lg-6 mb-4">
              <div className="ai_about_img_wrapper">
                <img alt="About the conference" className="ai_about_img img-fluid" src="/img/home/abt-img.webp" />
              </div>
            </div>
            <div className="col-lg-6">
              <div>
                <span className="ai_eyebrow">
                  <i aria-hidden="true" className="bi bi-flask"></i> About the Conference
                </span>
                <h2 className="ai_title">India’s Alkali Industry: Entering a New Era of Growth</h2>
                <p className="ai_sub">
                  Building on the success of previous AMAI conferences, the <br />
                  <b>AMAI Annual Alkali Industry Conference & Exhibition 2027</b> will bring together Indian and
                  international producers, global energy experts, technology licensors, equipment manufacturers and
                  suppliers, safety professionals, logistics specialists, policymakers, regulators, and sustainability
                  leaders on a common platform to explore emerging opportunities and address key challenges.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
