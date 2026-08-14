export const EMP_STATUSES = [
  "AVAILABLE",
  "RESERVED",
  "BOOKED",
  "MOBILIZED",
  "VACATION",
  "HALTED",
];

export const TRADES = [
  "Supervisor",
  "Foreman",
  "Fabricator",
  "Welder",
  "Fitter",
  "Rigger",
  "Helper",
  "Construction Engineer",
  "QC",
  "HSE",
  "Fire Watcher",
  "Habitat Supervisor",
  "Habitat Technician",
  "AP",
  "Other",
];

export function toDateInput(val) {
  if (!val) return "";
  const d = new Date(val);
  if (isNaN(d)) return "";
  return d.toISOString().split("T")[0];
}

export function getLevel(date) {
  if (!date) return "gray";
  const now = new Date();
  const d = new Date(date);
  if (d < now) return "red";
  const soon = new Date();
  soon.setDate(now.getDate() + 30);
  if (d < soon) return "yellow";
  return "green";
}

export function hasDoc(doc) {
  return Boolean(doc?.available);
}

export function isMobReady(emp) {
  return Boolean(
    emp?.documents?.hsePassport?.available &&
      emp?.documents?.cicpaPass?.available,
  );
}
