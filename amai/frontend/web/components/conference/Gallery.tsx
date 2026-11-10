export default function Gallery() {
  return (
    <>
      <section className="ai_sec ai_gallery" id="gallery">
        <div className="ai_rv container">
          <div className="ai_head">
            <div>
              <span className="ai_eyebrow">
                <i aria-hidden="true" className="bi bi-beaker-fill ai_ic"></i> Gallery
              </span>
              <h2 className="ai_title">Past Events Highlights</h2>
            </div>
          </div>
          <div className="row g-3">
            <div className="col-6 col-md-4">
              <a className="ai_gal_item d-block" href="" rel="noopener" target="_blank">
                <img alt="Previous conference photo 1" loading="lazy" src="/img/gallery/1.webp" className="img-fluid" />
              </a>
            </div>
            <div className="col-6 col-md-4">
              <a className="ai_gal_item d-block" href="" rel="noopener" target="_blank">
                <img alt="Previous conference photo 2" loading="lazy" src="/img/gallery/2.webp" className="img-fluid" />
              </a>
            </div>
            <div className="col-6 col-md-4">
              <a className="ai_gal_item d-block" href="" rel="noopener" target="_blank">
                <img alt="Previous conference photo 3" loading="lazy" src="/img/gallery/3.webp" className="img-fluid" />
              </a>
            </div>
            <div className="col-6 col-md-4">
              <a className="ai_gal_item d-block" href="" rel="noopener" target="_blank">
                <img alt="Previous conference photo 4" loading="lazy" src="/img/gallery/4.webp" className="img-fluid" />
              </a>
            </div>
            <div className="col-6 col-md-4">
              <a className="ai_gal_item d-block" href="" rel="noopener" target="_blank">
                <img alt="Previous conference photo 5" loading="lazy" src="/img/gallery/5.webp" className="img-fluid" />
              </a>
            </div>
            <div className="col-6 col-md-4">
              <a className="ai_gal_item d-block" href="" rel="noopener" target="_blank">
                <img alt="Previous conference photo 6" loading="lazy" src="/img/gallery/6.webp" className="img-fluid" />
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
