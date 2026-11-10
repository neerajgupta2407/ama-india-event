export default function Themes() {
  return (
    <>
      <section className="ai_sec ai_themes">
        <div className="ai_rv container">
          <div className="ai_head justify-content-center text-center">
            <div>
              <span className="ai_eyebrow">
                <i aria-hidden="true" className="bi bi-beaker ai_ic"></i> Conference themes
              </span>
              <h2 className="ai_title">Markets · Technology · Sustainability</h2>
            </div>
          </div>
          <div className="row g-4">
            <div className="col-md-4 d-flex">
              <div className="ai_theme_box">
                <img alt="Markets" loading="lazy" src="/img/home/1t.webp" className="img-fluid" />
                <div className="ai_theme_body">
                  <b>Markets</b>
                  <p>Global market dynamics, demand outlooks and emerging opportunities.</p>
                </div>
              </div>
            </div>
            <div className="col-md-4 d-flex">
              <div className="ai_theme_box">
                <img alt="Technology" loading="lazy" src="/img/home/2t.webp" className="img-fluid" />
                <div className="ai_theme_body">
                  <b>Technology</b>
                  <p>Innovation, process efficiency and operational excellence.</p>
                </div>
              </div>
            </div>
            <div className="col-md-4 d-flex">
              <div className="ai_theme_box">
                <img alt="Sustainability" loading="lazy" src="/img/home/3t.webp" className="img-fluid" />
                <div className="ai_theme_body">
                  <b>Sustainability</b>
                  <p>Pathways to a lower-carbon, more resource-efficient future.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
