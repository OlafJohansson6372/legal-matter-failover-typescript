export type VendorState = "available" | "unavailable";

export type Vendor = {
  name: string;
  state: VendorState;
};

export function chooseVendor(vendors: Vendor[]): Vendor {
  const selected = vendors.find((vendor) => vendor.state === "available");
  if (!selected) {
    throw new Error("No model vendor is available for this matter");
  }
  return selected;
}

export function matterPrompt(input: {
  matterId: string;
  intake: string;
  signedDocumentId: string;
  followUpDate: string;
}): string {
  return [
    `Matter ${input.matterId} intake: ${input.intake}`,
    `Prepare delivery instructions for signed document ${input.signedDocumentId}.`,
    `Create a deadline follow-up for ${input.followUpDate}.`,
  ].join("\n");
}
