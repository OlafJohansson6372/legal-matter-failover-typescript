import test from "node:test";
import assert from "node:assert/strict";
import { chooseVendor, matterPrompt } from "../src/failover_decision.ts";

test("moves a matter to the secondary vendor when the primary is unavailable", () => {
  const selected = chooseVendor([
    { name: "primary", state: "unavailable" },
    { name: "secondary", state: "available" },
  ]);

  assert.equal(selected.name, "secondary");
  assert.match(matterPrompt({ matterId: "m-7", intake: "lease renewal", signedDocumentId: "doc-7", followUpDate: "2026-08-17" }), /doc-7/);
});
