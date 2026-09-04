import { useEffect, useRef, useState } from "react";
import "./Reservation.css";

const emptyForm = {
  Name: "",
  email: "",
  number: "",
  Time: "",
  Date: "",
  party: "",
};

function generateReservationID() {
  return "RES-" + Math.random().toString(36).substr(2, 9).toUpperCase();
}

export default function Reservation() {
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState({ text: "", show: false, error: false });
  const messageTimer = useRef(null);

  useEffect(() => () => clearTimeout(messageTimer.current), []);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();

    // Check that selected date and time represent a future slot
    const reservationDate = new Date(`${form.Date}T${form.Time}`);
    if (isNaN(reservationDate.getTime()) || reservationDate <= new Date()) {
      clearTimeout(messageTimer.current);
      setMessage({
        text: "Please select a valid future date and time for your reservation.",
        show: true,
        error: true,
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
      messageTimer.current = setTimeout(() => {
        setMessage((m) => ({ ...m, show: false }));
      }, 6000);
      return;
    }

    const partySize = Number(form.party);
    if (!Number.isInteger(partySize) || partySize < 1) {
      clearTimeout(messageTimer.current);
      setMessage({
        text: "Party size must be at least 1 person.",
        show: true,
        error: true,
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
      messageTimer.current = setTimeout(() => {
        setMessage((m) => ({ ...m, show: false }));
      }, 6000);
      return;
    }

    const reservationID = generateReservationID();
    const warning =
      "If you don't arrive on time, we will wait 30 minutes before canceling the reservation.";
    const reservationData = { id: reservationID, ...form, warning };

    try {
      localStorage.setItem("reservation", JSON.stringify(reservationData));
      setMessage({
        text: `Reservation Confirmed! Your ID: ${reservationID}. ${warning}`,
        show: true,
        error: false,
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
      setForm(emptyForm);

      clearTimeout(messageTimer.current);
      messageTimer.current = setTimeout(() => {
        setMessage((m) => ({ ...m, show: false }));
      }, 60000);
    } catch (storageError) {
      clearTimeout(messageTimer.current);
      setMessage({
        text: "Could not save reservation locally. Please check your browser storage settings and try again.",
        show: true,
        error: true,
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
      messageTimer.current = setTimeout(() => {
        setMessage((m) => ({ ...m, show: false }));
      }, 6000);
    }
  }

  return (
    <section className="reservation-page" id="Reservation-container">
      <h1 className="reservation-title" id="title">Reservation</h1>

      <div
        className={`msg-box ${message.show ? "show" : ""} ${message.error ? "error" : ""}`}
        role={message.error ? "alert" : "status"}
      >
        {message.text}
      </div>

      <div className="reservation-form-container" id="form-div">
        <form onSubmit={handleSubmit}>
          <label htmlFor="Name">Name:</label>
          <input type="text" id="Name" name="Name" value={form.Name} onChange={handleChange} required />

          <label htmlFor="email">Email:</label>
          <input type="email" id="email" name="email" value={form.email} onChange={handleChange} required />

          <label htmlFor="number">Phone Number:</label>
          <input type="tel" id="number" name="number" value={form.number} onChange={handleChange} required />

          <label htmlFor="Time">Time:</label>
          <input type="time" id="Time" name="Time" value={form.Time} onChange={handleChange} required />

          <label htmlFor="Date">Date:</label>
          <input type="date" id="Date" name="Date" value={form.Date} onChange={handleChange} required />

          <label htmlFor="party">Party Size:</label>
          <input
            type="number"
            id="party"
            name="party"
            min="1"
            step="1"
            value={form.party}
            onChange={handleChange}
            required
          />

          <input type="submit" value="Submit" className="reservation-submit-btn" id="btn" />
        </form>
      </div>
    </section>
  );
}
