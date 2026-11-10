import { EnquiryForm } from "@/components/conference/EnquiryForm";

export default function Contact() {
  return (
    <>
      <section className="ai_sec ai_contact" id="contact">
        <div className="ai_rv container">
          <div className="row g-5">
            <div className="col-lg-7">
              <div>
                <span className="ai_eyebrow">
                  <i aria-hidden="true" className="bi bi-droplet-half ai_ic"></i> Contact us
                </span>
                <h2 className="ai_title text-white">Get in touch</h2>
                <div className="ai_ct">
                  <div className="ai_ico">
                    <i aria-hidden="true" className="bi bi-geo-alt ai_ic"></i>
                  </div>
                  <div>
                    <b>Office</b>{" "}
                    <span className="d-none d-sm-block">
                      Alkali Manufacturers Association of India (AMAI) <br /> 1009-1010, 10th Floor, Amba Deep Building,
                      14 Kasturba Gandhi Marg <br /> New Delhi-110001 (India)
                    </span>{" "}
                    <span className="d-sm-none">
                      Alkali Manufacturers Association of India (AMAI) <br /> 1009-1010, 10th Floor, Amba Deep Building
                      <br /> 14 Kasturba Gandhi Marg <br /> New Delhi-110001 (India)
                    </span>
                  </div>
                </div>
                <div className="ai_ct">
                  <div className="ai_ico">
                    <i aria-hidden="true" className="bi bi-person ai_ic"></i>
                  </div>
                  <div>
                    <b>Contact</b>{" "}
                    <span>
                      Ms. Harjeet Kaur Anand <br /> (Director)
                    </span>
                  </div>
                </div>
                <div className="ai_ct">
                  <div className="ai_ico">
                    <i aria-hidden="true" className="bi bi-telephone ai_ic"></i>
                  </div>
                  <div>
                    <b>Phone</b> <a href="tel:+919818904989">+91 98189 04989</a>
                  </div>
                </div>
                <div className="ai_ct">
                  <div className="ai_ico">
                    <i aria-hidden="true" className="bi bi-envelope ai_ic"></i>
                  </div>
                  <div>
                    <b>Email</b> <a href="mailto:hkanand@ama-india.org">hkanand@ama-india.org</a>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-lg-5">
              <div className="ai_contact_form">
                <div>
                  <h2 className="ai_title text-white">Our Team Is Here to Support You</h2>
                  <p className="ai_sub text-white">
                    Get in touch with our team for event participation, sponsorship opportunities, industry
                    partnerships, and upcoming event details. We’re here to help you connect, collaborate, and make the
                    most of every opportunity.
                  </p>
                </div>
                <EnquiryForm />
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
