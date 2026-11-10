export default function Programme() {
  return (
    <>
      <section className="ai_sec ai_agenda_modern  d-none" id="programme">
        <div className="ai_rv container">
          <div className="ai_head ai_agenda_head">
            <div>
              <span className="ai_eyebrow">
                <i aria-hidden="true" className="bi bi-flask-florence ai_ic"></i> Conference Schedule
              </span>
              <h2 className="ai_title">Two-day Programme</h2>
              <p className="ai_sub">Two days of industry insights, innovation and meaningful connections.</p>
            </div>
          </div>
          <div className="ai_agenda_list">
            <div className="ai_agenda_card">
              <div className="ai_agenda_date">
                <span className="ai_agenda_month">JAN</span> <strong>28</strong>{" "}
                <span className="ai_agenda_year">2027</span>
              </div>
              <div className="ai_agenda_content">
                <div className="ai_agenda_day">
                  <span className="ai_agenda_dot"></span> DAY 01 <span className="ai_agenda_separator">/</span> THURSDAY
                </div>
                <h3>Industry Outlook &amp; Strategic Insights</h3>
                <p>
                  Key industry themes with expert insights and panel discussions. Detailed agenda will be shared soon.
                </p>
                <div className="ai_agenda_tags">
                  <span>
                    <i className="bi bi-graph-up-arrow"></i> Markets
                  </span>{" "}
                  <span>
                    <i className="bi bi-mic"></i> Keynotes
                  </span>{" "}
                  <span>
                    <i className="bi bi-people"></i> Panels
                  </span>
                </div>
              </div>
              <div className="ai_agenda_arrow">
                <i className="bi bi-arrow-up-right" aria-hidden="true"></i>
              </div>
            </div>
            <div className="ai_agenda_card">
              <div className="ai_agenda_date">
                <span className="ai_agenda_month">JAN</span> <strong>29</strong>{" "}
                <span className="ai_agenda_year">2027</span>
              </div>
              <div className="ai_agenda_content">
                <div className="ai_agenda_day">
                  <span className="ai_agenda_dot"></span> DAY 02 <span className="ai_agenda_separator">/</span> FRIDAY
                </div>
                <h3>Technology, Innovation &amp; Collaboration</h3>
                <p>Continuation of the programme with further insights, case studies and industry discussions.</p>
                <div className="ai_agenda_tags">
                  <span>
                    <i className="bi bi-gear"></i> Technology
                  </span>{" "}
                  <span>
                    <i className="bi bi-journal-text"></i> Case studies
                  </span>{" "}
                  <span>
                    <i className="bi bi-people"></i> Networking
                  </span>
                </div>
              </div>
              <div className="ai_agenda_arrow">
                <i className="bi bi-arrow-up-right" aria-hidden="true"></i>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
