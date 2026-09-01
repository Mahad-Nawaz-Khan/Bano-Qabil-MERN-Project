import { useState } from "react";
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

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();

    const reservationID = generateReservationID();
    const warning =
      "If you don't arrive on time, we will wait 30 minutes before canceling the reservation.";

    const reservationData = { id: reservationID, ...form, warning };
    localStorage.setItem("reservation", JSON.stringify(reservationData));

    setMessage({
      text: `Reservation Confirmed! Your ID: ${reservationID}. ${warning}`,
      show: true,
      error: false,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });

    setForm(emptyForm);

    setTimeout(() => {
      setMessage((m) => ({ ...m, show: false }));
    }, 60000);
  }

  return (
    <section id="Reservation-container">
      <h1 id="title">Reservation</h1>

      <div className={`msg-box ${message.show ? "show" : ""} ${message.error ? "error" : ""}`}>
        {message.text}
      </div>

      <div id="form-div">
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
          <input type="number" id="party" name="party" value={form.party} onChange={handleChange} required />

          <input type="submit" value="Submit" id="btn" />
        </form>
      </div>
    </section>
  );
}
