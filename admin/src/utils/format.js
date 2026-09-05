const rupees = new Intl.NumberFormat("en-PK", { maximumFractionDigits: 0 });

export const formatPrice = (value) => `Rs ${rupees.format(Number(value) || 0)}`;

export const formatDate = (value) =>
  new Date(value).toLocaleString("en-PK", { dateStyle: "medium", timeStyle: "short" });
