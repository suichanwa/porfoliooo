import { memo } from "react";
import { useSimDateLabel, type SimDateStore } from "../../hooks/useSimDateStore";

interface SimDateReadoutProps {
  store: SimDateStore;
  className?: string;
}

function SimDateReadout({ store, className }: SimDateReadoutProps) {
  const formattedDate = useSimDateLabel(store);
  return <span className={className}>{formattedDate}</span>;
}

export default memo(SimDateReadout);
