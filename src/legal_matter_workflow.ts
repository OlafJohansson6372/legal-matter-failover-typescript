import { chooseVendor, matterPrompt, type Vendor } from "./failover_decision.ts";
import { askInfrai } from "./infrai_chat.ts";

const vendors: Vendor[] = [
  { name: "primary", state: "available" },
  { name: "secondary", state: "available" },
];

const matter = {
  matterId: "matter-1042",
  intake: "Tenant requests review of a signed lease renewal.",
  signedDocumentId: "lease-renewal-1042",
  followUpDate: "2026-08-17",
};

export async function runMatterIntake(): Promise<void> {
  const vendor = chooseVendor(vendors);
  const checklist = await askInfrai(matter, `matter:${matter.matterId}:delivery`);
  console.log(JSON.stringify({ vendor: vendor.name, matter, prompt: matterPrompt(matter), checklist }, null, 2));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await runMatterIntake();
}
