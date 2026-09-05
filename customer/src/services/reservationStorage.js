export function normalizeReservations(rawValue) {
  if (Array.isArray(rawValue)) {
    return rawValue.filter((item) => item && typeof item === "object");
  }

  if (rawValue && typeof rawValue === "object") {
    return [rawValue];
  }

  return [];
}

function resolveStorage(storage) {
  return storage ?? globalThis.localStorage ?? null;
}

export function generateReservationID() {
  return `RES-${Math.random().toString(36).slice(2, 11).toUpperCase()}`;
}

export function getReservations(storage = null, key = "reservations") {
  const targetStorage = resolveStorage(storage);

  if (!targetStorage) {
    return [];
  }

  try {
    const storedReservations = targetStorage.getItem(key);

    if (storedReservations) {
      return normalizeReservations(JSON.parse(storedReservations));
    }

    const legacyReservation = targetStorage.getItem("reservation");

    if (legacyReservation) {
      const normalized = normalizeReservations(JSON.parse(legacyReservation));
      targetStorage.setItem(key, JSON.stringify(normalized));
      return normalized;
    }

    return [];
  } catch (error) {
    return [];
  }
}

export function saveReservations(reservations, storage = null, key = "reservations") {
  const targetStorage = resolveStorage(storage);

  if (!targetStorage) {
    return reservations;
  }

  const normalized = normalizeReservations(reservations);
  targetStorage.setItem(key, JSON.stringify(normalized));
  return normalized;
}

export function addReservation(storage = null, key = "reservations", values = {}) {
  const reservations = getReservations(storage, key);
  const reservation = {
    id: generateReservationID(),
    ...values,
    warning:
      "If you don't arrive on time, we will wait 30 minutes before canceling the reservation.",
    createdAt: new Date().toISOString(),
  };

  return saveReservations([...reservations, reservation], storage, key);
}
