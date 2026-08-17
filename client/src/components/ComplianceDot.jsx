import {
  AlertTriangle,
  CheckCircle2,
  CircleDashed,
  XCircle,
} from "lucide-react";

const MAP = {
  green: { Icon: CheckCircle2, cls: "text-green-600" },
  yellow: { Icon: AlertTriangle, cls: "text-amber-500" },
  red: { Icon: XCircle, cls: "text-error" },
  gray: { Icon: CircleDashed, cls: "text-outline" },
};

export default function ComplianceDot({ level }) {
  const { Icon, cls } = MAP[level] || MAP.gray;
  return (
    <span title={level} className="inline-flex">
      <Icon size={15} strokeWidth={2.25} className={cls} aria-label={level} />
    </span>
  );
}
