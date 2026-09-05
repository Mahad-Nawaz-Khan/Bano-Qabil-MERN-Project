// Guest cart. Names and prices here are for display only: the server re-prices every line
// from the database on merge and at checkout, so tampering with this storage changes nothing.
const STORAGE_KEY = "ghalib_guest_cart";

export const MAX_ITEM_QUANTITY = 20;

const clamp = (value) => Math.min(MAX_ITEM_QUANTITY, Math.max(1, Math.round(Number(value) || 1)));

function read() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((line) => typeof line?.menuItem === "string" && /^[a-f0-9]{24}$/i.test(line.menuItem))
      .map((line) => ({
        menuItem: line.menuItem,
        name: String(line.name || "Menu item"),
        image: String(line.image || ""),
        unitPrice: Number(line.unitPrice) || 0,
        quantity: clamp(line.quantity),
      }));
  } catch {
    return [];
  }
}

function write(items) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // A full or blocked storage quota must not break the page.
  }
  return items;
}

export const guestCart = {
  read,
  clear: () => { try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ } },
  addItem: (line, quantity) => {
    const items = read();
    const existing = items.find((entry) => entry.menuItem === line.menuItem);
    if (existing) existing.quantity = clamp(existing.quantity + quantity);
    else items.push({ ...line, quantity: clamp(quantity) });
    return write(items);
  },
  updateQuantity: (menuItem, quantity) =>
    write(read().map((line) => (line.menuItem === menuItem ? { ...line, quantity: clamp(quantity) } : line))),
  removeItem: (menuItem) => write(read().filter((line) => line.menuItem !== menuItem)),
  toPayload: () => read().map(({ menuItem, quantity }) => ({ menuItem, quantity })),
};

export function summarise(items) {
  const lines = items.map((line) => ({ ...line, lineTotal: line.unitPrice * line.quantity }));
  return {
    items: lines,
    subtotal: lines.reduce((sum, line) => sum + line.lineTotal, 0),
    total: lines.reduce((sum, line) => sum + line.lineTotal, 0),
    count: lines.reduce((sum, line) => sum + line.quantity, 0),
  };
}
