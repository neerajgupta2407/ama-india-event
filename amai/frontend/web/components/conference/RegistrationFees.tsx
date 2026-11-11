import Link from "next/link";

export default function RegistrationFees() {
  return (
    <>
      <section className="ai_sec ai_bg_soft2 ai_register" id="register">
        <div className="ai_rv container">
          <div className="text-center mb-5">
            <span className="ai_eyebrow">
              <i aria-hidden="true" className="bi bi-droplet ai_ic"></i> Registration
            </span>
            <h2 className="ai_title">
              Register for the 12<sup className="text-lowercase">th</sup> AMAI Alkali Industry Conference
            </h2>
            <p className="ai_sub mx-auto">
              28–29 January 2027 (Thursday - Friday) · Andaz by Hyatt, Aerocity, New Delhi
            </p>
          </div>
          <div className="row justify-content-center">
            <div className="col-lg-4 col-md-6 mb-4 d-flex">
              <div className="ai_fee">
                <h3>
                  <i className="bi bi-person-badge ai_ic" aria-hidden="true"></i> Member Delegates
                </h3>
                <div className="ai_fee_amt">₹ 30,000</div>
                <small>+ GST as applicable</small>
                <ul>
                  <li>
                    <i className="bi bi-check2 ai_ic" aria-hidden="true"></i>{" "}
                    <span>10% early-bird discount on registration fee</span>
                  </li>
                  <li>
                    <i className="bi bi-check2 ai_ic" aria-hidden="true"></i>{" "}
                    <span>10% multiple-delegate discount for 3 or more participants from the same organisation</span>
                  </li>
                </ul>
                <Link href="/register/member" className="ai_btn">
                  Register
                </Link>
              </div>
            </div>
            <div className="col-lg-4 col-md-6 mb-4 d-flex">
              <div className="ai_fee">
                <h3>
                  <i className="bi bi-person ai_ic" aria-hidden="true"></i> Non-Member Delegates
                </h3>
                <div className="ai_fee_amt">₹ 35,000</div>
                <small>+ GST as applicable</small>
                <ul>
                  <li>
                    <i className="bi bi-check2 ai_ic" aria-hidden="true"></i>{" "}
                    <span>10% early-bird discount on registration fee</span>
                  </li>
                  <li>
                    <i className="bi bi-check2 ai_ic" aria-hidden="true"></i>{" "}
                    <span>10% multiple-delegate discount for 3 or more participants from the same organisation</span>
                  </li>
                </ul>
                <Link href="/register/non-member" className="ai_btn">
                  Register
                </Link>
              </div>
            </div>
            <div className="col-lg-4 col-md-6 mb-4 d-flex">
              <div className="ai_fee">
                <h3>
                  <i className="bi bi-globe2 ai_ic" aria-hidden="true"></i> International Delegates
                </h3>
                <div className="ai_fee_amt">US$ 900</div>
                <small>per foreign participant</small>
                <ul>
                  <li>
                    <i className="bi bi-check2 ai_ic" aria-hidden="true"></i>{" "}
                    <span>10% multiple-delegate and early-bird discounts as per the registration form</span>
                  </li>
                  <li>
                    <i className="bi bi-check2 ai_ic" aria-hidden="true"></i> <span>For foreign participants</span>
                  </li>
                </ul>
                <Link href="/register/international" className="ai_btn">
                  Register
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
