export default function ConferenceGlance() {
  return (
    <>
      <section className="ai_sec ai_glance" id="conference-glance">
        <div className="container">
          <div className="row ai_glance_top align-items-end">
            <div className="col-md-12 mb-4">
              <span className="ai_glance_label">
                <span></span> THE AMAI EXPERIENCE
              </span>
              <h2 className="ai_title  text-white">
                One Industry. <span>One Vision.</span> One Future.
              </h2>
            </div>
          </div>
          <div className="row ai_glance_main">
            <div className="ai_glance_feature col-lg-6 mb-4">
              <div className="ai_glance_feature_bg">
                <i className="bi bi-globe-asia-australia"></i>
              </div>
              <div className="ai_glance_feature_content">
                <span className="ai_glance_overline">INDUSTRY LEADERSHIP</span>
                <h3>
                  Shaping the Next Chapter of <br /> the Alkali Industry
                </h3>
                <p>
                  A shared platform to exchange perspectives, explore emerging technologies and discuss the
                  industry&apos;s evolving priorities.
                </p>
                <a href="#register" className="ai_glance_link  d-none">
                  Explore the Conference <i className="bi bi-arrow-up-right"></i>
                </a>
              </div>
              <span className="ai_glance_watermark">AMAI</span>
            </div>
            <div className="ai_glance_side col-lg-6 mb-4">
              <div className="ai_glance_info">
                <span className="ai_glance_icon">
                  <i className="bi bi-calendar-event"></i>
                </span>
                <div>
                  <span className="ai_glance_small">CONFERENCE DATES</span>
                  <h3>28–29 January 2027</h3>
                  <p>Two days of industry engagement</p>
                </div>
              </div>
              <div className="ai_glance_info">
                <span className="ai_glance_icon">
                  <i className="bi bi-lightbulb"></i>
                </span>
                <div>
                  <span className="ai_glance_small">CORE FOCUS</span>
                  <h3>Innovation & Sustainability</h3>
                  <p>Ideas for a competitive industry</p>
                </div>
              </div>
              <div className="ai_glance_info">
                <span className="ai_glance_icon">
                  <i className="bi bi-people"></i>
                </span>
                <div>
                  <span className="ai_glance_small">INDUSTRY CONNECT</span>
                  <h3>Knowledge & Collaboration</h3>
                  <p>Connect across the industry value chain</p>
                </div>
              </div>
            </div>
          </div>
          <div className="ai_glance_bottom">
            <span>ALKALI MANUFACTURERS ASSOCIATION OF INDIA</span> <span className="ai_glance_bottom_line"></span>{" "}
            <span>CONFERENCE 2027</span>
          </div>
        </div>
      </section>
    </>
  );
}
