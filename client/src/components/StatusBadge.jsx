const MAP = {
  AVAILABLE: ["bg-green-100 text-green-800 border-green-200", "Available"],
  RESERVED: ["bg-amber-100 text-amber-800 border-amber-200", "Reserved"],
  BOOKED: ["bg-indigo-100 text-indigo-800 border-indigo-200", "Booked"],
  MOBILIZED: ["bg-blue-100 text-blue-800 border-blue-200", "Mobilized"],
  VACATION: [
    "bg-purple-100 text-purple-800 border-purple-200",
    "Vacation / Halted",
  ],
};

export default function StatusBadge({ status }) {
  const [cls, label] = MAP[status] || MAP.AVAILABLE;
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border whitespace-nowrap ${cls}`}
    >
      {label}
    </span>
  );
}
