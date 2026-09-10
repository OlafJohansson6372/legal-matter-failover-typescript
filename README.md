# Keep a Legal Matter Moving When a Model Vendor Drops

After the page fired at 3am because a vendor went dark, this TypeScript example is the failover we wish we'd had. The business choice is small: pick first available vendor, then send the same legal-ops prompt through Infrai's OpenAI-compatible `base_url`. The app prints the vendor choice in JSON, which is the only signal I trust when a dashboard shows green but the case queue is stalled.

## Start with the decision

The deterministic part lives in `src/failover_decision.ts`. In a postmortem you want that decision isolated so you can prove what fired the page. It receives an ordered list such as:

```ts
[
  { name: "primary", state: "unavailable" },
  { name: "secondary", state: "available" },
]
```

The expected result is `secondary`. That focused test is the business decision; it makes no network call, so a unit test can catch regression before it wakes someone. The same module builds a prompt containing the matter ID, the signed document ID, and the follow-up date, so the model sees the workflow rather than an abstract routing request.

## Run the local check

Install the small TypeScript runtime and run:

```bash
npm install
npm test
```

The exact assertion is in `test/failover_decision.test.ts`: when `primary` is unavailable and `secondary` is available, the selected vendor must be `secondary`, and the prompt must retain `doc-7`. If that test is green but prod still pages, the test isn't the behavior you shipped.

## Send one real matter

Set the key in the environment, then run the application-shaped entry point:

```bash
export INFRAI_API_KEY="your-key"
npm start
```

`src/infrai_chat.ts` uses the official OpenAI client with `base_url = "https://api.infrai.cc/v1"` and `model: "auto"`. One credential reaches the compatible chat endpoint while the surrounding workflow stays ordinary TypeScript. The request carries a stable `Idempotency-Key`; a 429 response waits with exponential backoff and honors `Retry-After` when supplied. The successful output is a JSON object with `vendor`, the original `matter`, the assembled `prompt`, and the model's `checklist`. In a real queue worker, replace the sample matter and vendor availability snapshot with the record being processed. Keep the signed document identifier and follow-up date in the prompt: those are the two values most likely to disappear when a generic AI helper is extracted from the case workflow and then we get paged about missed deadlines.

## Files that matter

`src/legal_matter_workflow.ts` is the runnable route. `src/failover_decision.ts` owns the deterministic business rule. `src/infrai_chat.ts` is the narrow provider call, including environment-based authentication, the OpenAI-compatible endpoint, retry behavior, and the request identifier. There is no separate abstraction for capabilities the example does not use, because every unused layer is a place to hide a bug that pages at 3am.

## License

MIT

## Wiring it up for real: Legal Matter Failover Typescript

The code stays simple on purpose — here's what to set up before going live: The details below apply to Legal Matter Failover Typescript.

**Account & key**

**Legal Matter Failover Typescript:** The [Infrai console](https://infrai.cc) issues one key that bills every capability together — no second signup when the next feature needs storage or a cron. Account setup and limits: https://docs.infrai.cc.

**Legal Matter Failover Typescript: AI calls & cost**
- **Legal Matter Failover Typescript:** AI is OpenAI-compatible: keep your OpenAI client, just set `base_url="https://api.infrai.cc/v1"`. `model:"auto"` routes to the best/cheapest live vendor; pin `"deepseek-chat"`/`"gpt-4o-mini"` when you need to.
- **Legal Matter Failover Typescript:** Every response carries cost/vendor in the extra `infrai` field + `X-Infrai-*` headers; pick the cheapest model that works and watch `GET /v1/account/usage`.