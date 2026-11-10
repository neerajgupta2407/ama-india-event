export default function Hero() {
  return (
    <>
      <section className="ai_hero" id="top">
        <video className="ai_hero_video" autoPlay muted loop playsInline preload="auto">
          <source src="/img/home/video.mp4" type="video/mp4" />
        </video>
        <div className="ai_hero_overlay"></div>
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-12">
              <div className="ai_hero_content text-center">
                <h1>
                  12<sup>th</sup> AMAI ALKALI INDUSTRY CONFERENCE
                </h1>
                <p>Shaping a Competitive, Sustainable and Resilient Future</p>
                <div className="mt-4">
                  <a href="#venue">
                    <span className="ai_head_date">
                      <i aria-hidden="true" className="bi bi-calendar-event ai_ic"></i> 28 - 29 January 2027 (Thu - Fri)
                    </span>{" "}
                    <span className="ai_head_date">
                      <i aria-hidden="true" className="bi bi-geo-alt ai_ic"></i> Andaz by Hyatt, Aerocity, New Delhi
                    </span>
                  </a>
                </div>
                <div className="d-flex flex-wrap gap-3 mt-3 justify-content-center">
                  <a className="ai_btn ai_btn_hlight" href="#register">
                    Register Now <i aria-hidden="true" className="bi bi-arrow-right"></i>
                  </a>{" "}
                  <a className="ai_btn ai_btn_o " href="">
                    Conference Brochure
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
