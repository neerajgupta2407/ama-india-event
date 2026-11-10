"use client";

import { useCountdown } from "@/hooks/useCountdown";

export default function Countdown() {
  const t = useCountdown();
  return (
    <>
      <section>
        <div className="container">
          <div className="ai_cd_wrap">
            <div className="ai_cd">
              <div>
                <div className="ai_eyebrow mb-3">
                  <i aria-hidden="true" className="bi bi-hourglass-split"></i> Countdown
                </div>
                <div className="fw-bold">Conference begins 28 January 2027</div>
              </div>
              <div className="ai_cd_boxes">
                <div className="ai_cd_box">
                  <b>{t.d}</b> <span>Days</span>
                </div>
                <div className="ai_cd_sep"></div>
                <div className="ai_cd_box">
                  <b>{t.h}</b> <span>Hours</span>
                </div>
                <div className="ai_cd_sep"></div>
                <div className="ai_cd_box">
                  <b>{t.m}</b> <span>Minutes</span>
                </div>
                <div className="ai_cd_sep"></div>
                <div className="ai_cd_box">
                  <b>{t.s}</b> <span>Seconds</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
