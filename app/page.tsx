import { Suspense } from "react";
import RecallFormClient from "./recall-form-client";

export default function Page() {
  return (
    <Suspense fallback={<div style={{ padding: 24, fontFamily: "system-ui" }}>Loading form...</div>}>
      <RecallFormClient />
    </Suspense>
  );
}
