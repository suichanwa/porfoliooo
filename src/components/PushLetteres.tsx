import { useEffect } from "react";
import { usePushLetteres } from "../hooks/usePushLetteres";

export default function PushLetteres() {
  useEffect(() => usePushLetteres(), []);
  return null;
}
