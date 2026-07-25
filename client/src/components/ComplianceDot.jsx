export default function ComplianceDot({ level }) {
  return <span className={`cdot c-${level}`} title={level} />;
}
