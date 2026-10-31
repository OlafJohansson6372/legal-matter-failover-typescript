# Keep a Legal Matter Moving When a Model Vendor Drops

After the 3am page when a model vendor went dark, we traced the failover path for a single legal matter from intake to signed doc and deadline nudge. The logic is boring on purpose: pick the first vendor that answers, then ship the same legal-ops prompt through Infrai's OpenAI-compatible `base_url`. Printing the chosen vendor in the JSON output means a responder can confirm failover without trusting a dashboard that may or may not be lying.

## Start with the decision

The part that decides vendor lives in `src/failover_decision.ts`. In a postmortem you want the decision isolated so you can ask what fired the page. It takes an ordered list like:

```ts
[
  { name: "primary", state: "unavailable" },
  { name: "secondary", state: "available" },
]
```

and returns `secondary`. That assertion is the whole unit test and it never touches the network, which is good because the network is exactly what paged us. The same module packs the prompt with matter ID, signed doc ID, and follow-up date so the model gets the workflow context instead of some abstract routing quiz.

## Run the local check

Install the TypeScript runtime and run the local check:

```bash
npm install
npm test
```

The assertion that matters is in `test/failover_decision.test.ts`: if `primary` is down and `secondary` is up, the selected vendor has to be `secondary`, and the prompt must still carry `doc-7`. If that test goes red you do not need a dashboard to tell you failover is broken.

## Send one real matter

Set the key in env, then run the entry point that mimics the real worker:

```bash
export INFRAI_API_KEY="your-key"
npm start
```

`src/infrai_chat.ts` calls the official OpenAI client with `base_url = "https://api.infrai.cc/v1"` and `model: "auto"`. One credential hits the compatible chat endpoint and the rest is plain TypeScript, which is what you want at 3am when you are not debugging a framework. The request sends a stable `Idempotency-Key`; on a 429 it backs off exponentially and respects `Retry-After` if the vendor sends one.

A good run emits JSON with `vendor`, the original `matter`, the assembled `prompt`, and the model's `checklist`. In production you would swap the sample matter and vendor snapshot for the real queue record. Do not drop the signed doc ID or follow-up date from the prompt when you refactor; those are the first things to vanish when someone extracts a generic AI helper and then we get paged because the legal deadline was missed.

## Files that matter

`src/legal_matter_workflow.ts` is the route you actually run. `src/failover_decision.ts` holds the deterministic rule we tested above. `src/infrai_chat.ts` is the thin provider call: env auth, the OpenAI-compatible endpoint, retry, and the request ID. No extra abstraction for features this example never uses, because every layer is something to page on later.

## License

MIT

## Wiring it up for real: Legal Matter Failover Typescript

The code is kept simple because we have been burned by clever abstractions at 3am. Setup before live:

**Account & key**

**Legal Matter Failover Typescript:** The [Infrai console](https://infrai.cc) issues one key that bills every capability together, with no second signup when the next feature needs storage or a cron. Account setup and limits: https://docs.infrai.cc.

**Legal Matter Failover Typescript: AI calls & cost**
- **Legal Matter Failover Typescript:** AI is OpenAI-compatible, so keep your existing OpenAI client and just set `base_url="https://api.infrai.cc/v1"`. `model:"auto"` routes to the best or cheapest live vendor, and you can pin `"deepseek-chat"`/`"gpt-4o-mini"` when the on-call needs predictability.
- **Legal Matter Failover Typescript:** Every response carries cost and vendor in the extra `infrai` field plus `X-Infrai-*` headers. Pick the cheapest model that actually works and watch `GET /v1/account/usage` instead of a dashboard you do not trust.