const MAP = {
  AVAILABLE: ['b-available', 'Available'],
  RESERVED: ['b-reserved', 'Reserved'],
  BOOKED: ['b-booked', 'Booked'],
  MOBILIZED: ['b-mobilized', 'Mobilized'],
  VACATION: ['b-vacation', 'Vacation / Halted'],
};

export default function StatusBadge({ status }) {
  const [cls, label] = MAP[status] || MAP.AVAILABLE;
  return (
    <span className={`badge ${cls}`}>
      <span className="dot" />
      {label}
    </span>
  );
}
