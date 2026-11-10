"use client";

import { useCountdown } from "@/hooks/useCountdown";

export default function Celebration50() {
  const t = useCountdown();
  return (
    <>
      <div className="ai_f50">
        <div className="container">
          <div className="row align-items-center g-3 text-center text-md-start">
            <div className="col-md-auto">
              <img
                alt="AMAI 50 Years – Enabling 50 years of responsible growth"
                className="ai_f50_logo img-fluid"
                src="/img/50-years-logo.png"
              />
            </div>
            <div className="col-md">
              <div className="ai_f50_txt">
                <b>Celebrating 50 Years of AMAI</b>
              </div>
            </div>
            <div className="col-md-auto">
              <div className="ai_f50_cd" aria-label="Countdown to 28 January 2027">
                <div>
                  <b>{t.d}</b> <span>Days</span>
                </div>
                <div>
                  <b>{t.h}</b> <span>Hours</span>
                </div>
                <div>
                  <b>{t.m}</b> <span>Mins</span>
                </div>
                <div>
                  <b>{t.s}</b> <span>Secs</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
