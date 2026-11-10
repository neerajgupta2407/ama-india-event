import Link from "next/link";

export default function SiteHeader() {
  return (
    <>
      <header>
        <div className="ai_topbar">
          <div className="container">
            <div className="row">
              <div className="col-md-6 text-center text-md-start">
                <span>
                  <i aria-hidden="true" className="bi bi-telephone me-2"></i> 011-4302 7119 |{" "}
                  <i aria-hidden="true" className="bi bi-envelope me-2"></i> hkanand@ama-india.org
                </span>
              </div>
              <div className="col-md-6 text-center text-md-end">
                <div className="ai_soc ai_soc_top">
                  <a
                    aria-label="LinkedIn"
                    className="me-2"
                    href="https://www.linkedin.com/company/amai-india/"
                    rel="noopener"
                    target="_blank"
                  >
                    <i aria-hidden="true" className="bi bi-linkedin ai_ic"></i>
                  </a>{" "}
                  <a
                    aria-label="X"
                    className="me-2"
                    href="https://twitter.com/amai_india"
                    rel="noopener"
                    target="_blank"
                  >
                    <i aria-hidden="true" className="bi bi-twitter-x ai_ic"></i>
                  </a>{" "}
                  <a
                    aria-label="Facebook"
                    className="me-2"
                    href="https://www.facebook.com/amai.india"
                    rel="noopener"
                    target="_blank"
                  >
                    <i aria-hidden="true" className="bi bi-facebook ai_ic"></i>
                  </a>{" "}
                  <a
                    aria-label="Instagram"
                    className="me-2"
                    href="https://www.instagram.com/amai.india/"
                    rel="noopener"
                    target="_blank"
                  >
                    <i aria-hidden="true" className="bi bi-instagram ai_ic"></i>
                  </a>{" "}
                  <a
                    aria-label="YouTube"
                    className="me-2"
                    href="https://www.youtube.com/channel/UCJQUXpEZ7qULElaCUJw4M0w"
                    rel="noopener"
                    target="_blank"
                  >
                    <i aria-hidden="true" className="bi bi-youtube ai_ic"></i>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
        <nav className="ai_nav navbar navbar-expand-xl">
          <div className="ai_nav_in container d-flex align-items-center justify-content-between gap-3">
            <div className="ai_brand_group d-flex align-items-center">
              <Link className="ai_brand" href="/#top">
                <svg aria-label="AMAI" height="45" role="img" viewBox="0 0 250 100" width="90">
                  <ellipse cx="125" cy="50" fill="#1e3a66" rx="125" ry="50"></ellipse>
                  <text
                    dominantBaseline="middle"
                    fill="#ffffff"
                    fontFamily="Arial, Helvetica, sans-serif"
                    fontSize="60"
                    letterSpacing="1"
                    textAnchor="middle"
                    x="125"
                    y="53"
                  >
                    AMAI
                  </text>
                </svg>
                <span>
                  Alkali Manufacturers <br /> Association of India
                </span>
              </Link>{" "}
              <span className="ai_brand_divider" aria-hidden="true"></span>{" "}
              <Link className="ai_brand_50" href="/#top">
                <img alt="AMAI 50 Years – Enabling 50 years of responsible growth" src="/img/50-years-logo.png" />
              </Link>
            </div>
            <button
              aria-controls="aiNav"
              aria-expanded="false"
              aria-label="Toggle menu"
              className="ai_toggler navbar-toggler"
              data-bs-target="#aiNav"
              data-bs-toggle="collapse"
              type="button"
            >
              <i className="bi bi-list"></i>
            </button>
            <div className="ai_nav_wrap collapse navbar-collapse" id="aiNav">
              <ul className="ai_menu navbar-nav mx-auto">
                <li className="nav-item">
                  <Link className="ai_menu_link nav-link" href="/#about">
                    Overview
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="ai_menu_link nav-link" href="/#programme">
                    Programme
                  </Link>
                </li>
                <li className="nav-item dropdown">
                  <a
                    aria-expanded="false"
                    className="ai_dd_toggle nav-link dropdown-toggle"
                    data-bs-toggle="dropdown"
                    href="#participate"
                    role="button"
                  >
                    Participating Organisations
                  </a>
                  <ul className="ai_dd dropdown-menu">
                    <li>
                      <a className="ai_menu_link" href="">
                        Sponsors
                      </a>
                    </li>
                    <li>
                      <a className="ai_menu_link" href="">
                        Exhibitors
                      </a>
                    </li>
                    <li>
                      <a className="ai_menu_link" href="">
                        Media Partners
                      </a>
                    </li>
                    <li>
                      <a className="ai_menu_link" href="">
                        Deligates
                      </a>
                    </li>
                  </ul>
                </li>
                <li className="nav-item dropdown">
                  <a
                    aria-expanded="false"
                    className="ai_dd_toggle nav-link dropdown-toggle"
                    data-bs-toggle="dropdown"
                    href="#organisations"
                    role="button"
                  >
                    Past Events
                  </a>
                  <ul className="ai_dd dropdown-menu">
                    <li>
                      <Link className="ai_menu_link" href="/#po-2026">
                        2026
                      </Link>
                    </li>
                    <li>
                      <Link className="ai_menu_link" href="/#po-2025">
                        2025
                      </Link>
                    </li>
                    <li>
                      <Link className="ai_menu_link" href="/#po-2024">
                        2024
                      </Link>
                    </li>
                  </ul>
                </li>
                <li className="nav-item">
                  <Link className="ai_menu_link nav-link" href="/#contact">
                    Contact Us
                  </Link>
                </li>
              </ul>
              <div className="ai_nav_cta d-flex flex-wrap align-items-start align-items-xl-center gap-2 mt-3 mt-xl-0">
                <div className="ai_partner dropdown">
                  <button
                    aria-expanded="false"
                    className="ai_btn dropdown-toggle"
                    data-bs-toggle="dropdown"
                    id="aiPartnerBtn"
                    type="button"
                  >
                    Partner Us
                  </button>
                  <ul aria-labelledby="aiPartnerBtn" className="ai_dd ai_partner_menu dropdown-menu">
                    <li>
                      <Link className="ai_dd_item dropdown-item" href="/#sponsorship">
                        <i aria-hidden="true" className="bi bi-award"></i> Sponsorship
                      </Link>
                    </li>
                    <li>
                      <Link className="ai_dd_item dropdown-item" href="/#exhibitor">
                        <i aria-hidden="true" className="bi bi-shop-window"></i> Exhibitor
                      </Link>
                    </li>
                    <li>
                      <Link className="ai_dd_item dropdown-item" href="/#media-partner">
                        <i aria-hidden="true" className="bi bi-megaphone"></i> Media Partner
                      </Link>
                    </li>
                  </ul>
                </div>
                <Link className="ai_btn ai_btn_hlight px-lg-5" href="/#register">
                  Register Now
                </Link>
              </div>
            </div>
          </div>
        </nav>
      </header>
    </>
  );
}
