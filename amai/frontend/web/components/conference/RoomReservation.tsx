export default function RoomReservation() {
  return (
    <>
      <section className="ai_sec ai_room_modern" id="room-reservation">
        <div className="container ai_rv">
          <div className="ai_room_card">
            <div className="ai_room_content">
              <span className="ai_eyebrow">
                <i className="bi bi-flask-fill"></i> CONFERENCE ACCOMMODATION
              </span>
              <h2 className="ai_title">Accommodation & Room Reservation</h2>
              <p className="ai_sub">
                Make your conference visit comfortable with a stay at <br /> Andaz by Hyatt, Aerocity, New Delhi. <br />{" "}
                Reserve your room through the official conference group-booking link.
              </p>
              <div className="ai_room_hotel">
                <span className="ai_room_hotel_icon">
                  <i className="bi bi-geo-alt"></i>
                </span>
                <div>
                  <h3>Andaz by Hyatt</h3>
                  <p>Aerocity, New Delhi</p>
                </div>
              </div>
              <a
                className="ai_btn"
                href="https://www.hyatt.com/events/en-US/group-booking/DELAZ/G-AMA1"
                target="_blank"
                rel="noopener noreferrer"
              >
                Reserve Your Room <i className="bi bi-arrow-up-right"></i>
              </a>
              <p className="ai_small pt-3">
                <i className="bi bi-info-circle"></i> Click the button to access the hotel group-booking page.
              </p>
            </div>
            <div className="ai_room_visual">
              <div className="ai_room_visual_icon">
                <i className="bi bi-buildings"></i>
              </div>
              <span className="ai_room_visual_label">YOUR STAY, MADE COMFORTABLE</span>
              <h3>
                Stay Close. <br /> Connect Better.
              </h3>
              <span className="ai_room_visual_line"></span>
              <p>AMAI Alkali Industry Conference</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
