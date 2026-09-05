import test from "node:test";
import assert from "node:assert/strict";

import { addReservation, getReservations, normalizeReservations } from "./reservationStorage.js";

function createStorage(initial = {}) {
  const store = { ...initial };

  return {
    getItem(key) {
      return key in store ? store[key] : null;
    },
    setItem(key, value) {
      store[key] = String(value);
    },
    removeItem(key) {
      delete store[key];
    },
  };
}

test("getReservations reads legacy single reservation as array", () => {
  const storage = createStorage({
    reservation: JSON.stringify({ id: "RES-LEGACY", Name: "Ali", email: "ali@test.com" }),
  });

  const reservations = getReservations(storage, "reservations");

  assert.deepEqual(reservations, [{
    id: "RES-LEGACY",
    Name: "Ali",
    email: "ali@test.com",
  }]);
});

test("addReservation appends new reservation to existing list", () => {
  const storage = createStorage({
    reservations: JSON.stringify([
      { id: "RES-1", Name: "Sara", email: "sara@test.com", Date: "2026-09-10", Time: "19:00", party: "2" },
    ]),
  });

  const reservations = addReservation(storage, "reservations", {
    Name: "Jamal",
    email: "jamal@test.com",
    number: "03001234567",
    Time: "20:30",
    Date: "2026-09-11",
    party: "4",
  });

  assert.equal(reservations.length, 2);
  assert.equal(reservations[1].Name, "Jamal");
  assert.match(reservations[1].id, /^RES-/);
  assert.equal(reservations[1].warning.includes("30 minutes"), true);
});
