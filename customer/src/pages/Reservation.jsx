import { useEffect, useRef, useState } from "react";
import { reservationApi } from "../services/reservationApi.js";
import { useAuth } from "../hooks/useAuth.js";
import "./Reservation.css";

const emptyForm = {
  Name: "",
  email: "",
  number: "",
  Time: "",
  Date: "",
  party: "",
  specialRequests: "",
  policyAccepted: false,
};

const timeSlots = Array.from({ length: 14 }, (_, index) => {
  const totalMinutes = 17 * 60 + index * 30;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const value = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
  const displayHour = hours > 12 ? hours - 12 : hours;
  return { value, label: `${displayHour}:${String(minutes).padStart(2, "0")} ${hours >= 12 ? "PM" : "AM"}` };
});

function localDateValue(date = new Date()) {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

export default function Reservation() {
  const { user, isAuthenticated } = useAuth();
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState({ text: "", show: false, error: false });
  const messageTimer = useRef(null);
  const today = localDateValue();
  const selectedToday = form.Date === today;
  const currentTime = new Date().toTimeString().slice(0, 5);

  useEffect(() => () => clearTimeout(messageTimer.current), []);
  useEffect(() => { if (user) setForm((current) => ({ ...current, Name: current.Name || user.name, email: current.email || user.email })); }, [user]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
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
    if (!Number.isInteger(partySize) || partySize < 1 || partySize > 12) {
      clearTimeout(messageTimer.current);
      setMessage({
        text: "Party size must be between 1 and 12 guests. For larger parties, please call the restaurant.",
        show: true,
        error: true,
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
      messageTimer.current = setTimeout(() => {
        setMessage((m) => ({ ...m, show: false }));
      }, 6000);
      return;
    }
    if (!isAuthenticated) {
      setMessage({ text: "Please sign in to save and manage your reservation.", show: true, error: true });
      return;
    }
    if (!form.policyAccepted) {
      setMessage({ text: "Please accept the reservation policy to continue.", show: true, error: true });
      return;
    }

    try {
      const response = await reservationApi.create({ name: form.Name, email: form.email, phone: form.number, date: form.Date, time: form.Time, partySize, specialRequests: form.specialRequests, policyAccepted: form.policyAccepted });
      setMessage({
        text: `Reservation received! Your ID: ${response.data.reservationNumber}. We will confirm it shortly.`,
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
        text: storageError.message || "Could not save your reservation. Please try again.",
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

          <label htmlFor="Time">Preferred Time:</label>
          <select id="Time" name="Time" value={form.Time} onChange={handleChange} required>
            <option value="" disabled>Select a time slot</option>
            {timeSlots.map((slot) => (
              <option key={slot.value} value={slot.value} disabled={selectedToday && slot.value <= currentTime}>
                {slot.label}
              </option>
            ))}
          </select>
          <p className="time-slot-note">Table reservations are available every 30 minutes from 5:00 PM to 12:00 AM.</p>

          <label htmlFor="Date">Date:</label>
          <input type="date" id="Date" name="Date" min={today} value={form.Date} onChange={handleChange} required />

          <label htmlFor="party">Party Size:</label>
          <input
            type="number"
            id="party"
            name="party"
            min="1"
            max="12"
            step="1"
            value={form.party}
            onChange={handleChange}
            required
          />
          <p className="time-slot-note">For parties larger than 12, please call us so we can arrange suitable seating.</p>

          <label htmlFor="specialRequests">Special Requests (optional):</label>
          <textarea id="specialRequests" name="specialRequests" value={form.specialRequests} onChange={handleChange} maxLength="300" placeholder="Birthday, allergy, high chair, or seating preference" />

          <label className="policy-check"><input type="checkbox" name="policyAccepted" checked={form.policyAccepted} onChange={(event) => setForm((prev) => ({ ...prev, policyAccepted: event.target.checked }))} /> I understand the restaurant holds tables for 30 minutes.</label>

          <input type="submit" value="Submit" className="reservation-submit-btn" id="btn" />
        </form>
      </div>
    </section>
  );
}
