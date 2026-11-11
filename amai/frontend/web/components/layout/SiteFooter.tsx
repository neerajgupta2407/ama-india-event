import Link from "next/link";

export default function SiteFooter() {
  return (
    <>
      <footer className="ai_footer">
        <div className="container">
          <div className="row g-3 align-items-center">
            <div className="col-lg-4">
              <div>
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
                </Link>
                <div className=" mt-3">
                  12<sup>th</sup> AMAI Alkali Industry Conference. <br /> 28–29 January 2027
                </div>
              </div>
            </div>
            <div className="col-lg-5">
              <div>
                <ul className="nav gap-1 gap-md-3 ">
                  <li>
                    <a href="mailto:hkanand@ama-india.org">Contact Us</a>
                  </li>
                  <li>|</li>
                  <li>
                    <a href="" rel="" target="_blank">
                      Disclaimer
                    </a>
                  </li>
                  <li>|</li>
                  <li>
                    <a href="/sitemap.xml">Sitemap</a>
                  </li>
                  <li>|</li>
                  <li>
                    <a href="" rel="" target="_blank">
                      Privacy Policy
                    </a>
                  </li>
                </ul>
              </div>
            </div>
            <div className="col-lg-3 text-lg-end">
              <div className="ai_soc">
                <a
                  aria-label="LinkedIn"
                  className="me-2"
                  href="https://www.linkedin.com/company/amai-india/"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  <i aria-hidden="true" className="bi bi-linkedin ai_ic"></i>
                </a>{" "}
                <a aria-label="X" className="me-2" href="https://twitter.com/amai_india" rel="noopener noreferrer" target="_blank">
                  <i aria-hidden="true" className="bi bi-twitter-x ai_ic"></i>
                </a>{" "}
                <a
                  aria-label="Facebook"
                  className="me-2"
                  href="https://www.facebook.com/amai.india"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  <i aria-hidden="true" className="bi bi-facebook ai_ic"></i>
                </a>{" "}
                <a
                  aria-label="Instagram"
                  className="me-2"
                  href="https://www.instagram.com/amai.india/"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  <i aria-hidden="true" className="bi bi-instagram ai_ic"></i>
                </a>{" "}
                <a
                  aria-label="YouTube"
                  className="me-2"
                  href="https://www.youtube.com/channel/UCJQUXpEZ7qULElaCUJw4M0w"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  <i aria-hidden="true" className="bi bi-youtube ai_ic"></i>
                </a>
              </div>
            </div>
          </div>
          <hr className="ai_hr" />
          <div className="d-flex justify-content-center flex-wrap">
            <span>© Alkali Manufacturers Association of India. All Rights Reserved.</span>
          </div>
        </div>
      </footer>
    </>
  );
}
