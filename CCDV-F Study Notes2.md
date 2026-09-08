# Claude Certified Developer: Foundations (CCDV-F) — Interactive Study Notes

> **How to use these notes:** Each topic follows the same 7-part template — read the *Core Concept* first, drill the *Key Facts*, then test yourself with the *Scenario Challenge* and *Flashcard*. **Bold** = a term that can appear verbatim on the exam. `inline code` = an API parameter, value, or endpoint. ⚠️ = trap, 💡 = pro tip, 🔁 = repeat-until pattern.
>
> **Exam snapshot:** 53 scenario-based questions · 120 minutes · pass at **720 / 1000** · $125 · valid 12 months. Heaviest domains: **Applications & Integration (33%)** and **Model Selection (17%)** — where token cost, caching, and error handling live. This exam tests **judgment**, not recall: the "obvious" answer is often the trap.

---

## 1. Prompt Caching

### Core Concept Summary
**Prompt caching** lets you mark a prefix of your prompt as reusable so Claude doesn't re-process it on every call. You pay a small premium once to **write** the cache, then pay a fraction of the input price on every **read** for the duration of the cache's lifetime. It shines when a large, *stable* chunk of context (system prompt, tool definitions, a long document, few-shot examples) is sent repeatedly. The cache key is a **cumulative hash of everything up to and including the `cache_control` block** — change one byte anywhere in the prefix and you get a fresh (paid) write, not a read.

### Key Facts & Mechanics
- Enable it two ways: **automatic caching** (one top-level `cache_control` field — the breakpoint auto-moves to the last cacheable block as a conversation grows) or **explicit cache breakpoints** (`cache_control` placed on individual content blocks).
- The `cache_control` type is always `{"type": "ephemeral"}`. Add `"ttl": "1h"` for the 1-hour tier.
- **Two TTL tiers:** `5m` (default) and `1h`.
- **Cost mechanics** (multipliers on base input price):
  - `5m` cache **write** = **1.25×** base input
  - `1h` cache **write** = **2.0×** base input
  - Cache **read / refresh** = **0.1×** base input (0.025× on Fable/Mythos 5.1)
- **Cache reads and refreshes are FREE to refresh the clock** — every hit resets the TTL at no extra cost.
- **TTL is measured from the START of the request that writes or reads the entry**, not the end of the response. Response generation time counts against the window. `[VERIFY: exact model-tier minimums shift over time — recount before relying on them]`
- **Up to 4 cache breakpoints** per request. **Lookback window = 20 blocks** — the system walks back at most 20 positions to find a prior write.
- **Minimum cacheable length** (or the block is silently *not* cached, no error): commonly **1,024 tokens** (Sonnet/Haiku-class), **512 tokens** (Opus 5 / Fable / Mythos), up to **4,096** for some Opus/Haiku tiers.
- **Prefix order is fixed:** `tools` → `system` → `messages`. Caching always references this whole ordered prefix.
- **What IS cacheable:** tool definitions, system prompt, message history, images/documents, text blocks — anything before the breakpoint that stays byte-identical.
- **What is NOT effectively cacheable:** content *after* the breakpoint; anything that changes per request (timestamps, the incoming user message, per-request IDs); prompts below the minimum token threshold.
- Verify a cache hit via `response.usage`: `cache_creation_input_tokens` (write) and `cache_read_input_tokens` (read). If both are `0`, nothing was cached.

### Annotated Code Example
```python
# Explicit breakpoint: cache the STABLE system context, not the volatile suffix.
response = client.messages.create(
    model="claude-sonnet-5",
    max_tokens=1024,
    system=[
        {
            "type": "text",
            "text": LARGE_STATIC_INSTRUCTIONS,        # e.g. a 50k-token policy doc
            "cache_control": {"type": "ephemeral", "ttl": "1h"},  # <-- breakpoint on the LAST stable block
        }
    ],
    messages=[
        {"role": "user", "content": user_question}    # volatile — must come AFTER the breakpoint
    ],
)
usage = response.usage
# cache_creation_input_tokens > 0 on the first call (write);
# cache_read_input_tokens > 0 on subsequent calls within TTL (read @ 0.1x).
```

### Mental Model / Analogy
Think of the cache like a **library photocopier that pre-scans a fat reference binder**. The first person pays to scan it (the **write**, 1.25–2×). Everyone who reuses that scan pays pennies (the **read**, 0.1×). But the scan is keyed to the *exact* binder — slip one new page *into the middle* and the copier has to re-scan the whole thing from that point. So you put all the pages that never change **first**, and the page you scribble on today **last**.

### Common Exam Traps
- ⚠️ **TRAP: TTL resets on read but is measured from write-time in the classic gotcha.** The clock *does* refresh for free on each hit — but the exam's favorite version is: "A cached prompt was **written at 12:00** and **read at 12:04** with a 5-minute TTL. When does it expire?" The refresh extends it, but if you're asked about the *original* window, it's anchored to the **write/last-access start time**, not the read's response end. Read the question's wording precisely.
- ⚠️ **TRAP: Putting `cache_control` on the block that changes every request** (a timestamp or the user message). You then pay a **write on every call and never get a read** — strictly *more* expensive than no caching. The fix is always "move the breakpoint to the last *stable* block."
- ⚠️ **TRAP: Assuming a short prompt gets cached.** Below the model's token minimum, `cache_control` is silently ignored — no error, no savings.

### Scenario Challenge
> **What would happen if** you enable a 1-hour cache on a 40k-token system prompt, then discover your app appends a per-request `Current time: {timestamp}` line to the *system* prompt right before the breakpoint?

<details><summary>Reveal answer</summary>

The timestamp changes the cumulative hash on **every** request, so every call is a **cache miss → fresh 2× write** and you *never* read. You'd pay 2× base input every single time — worse than not caching. **Fix:** move the volatile timestamp *after* the breakpoint (into the messages), keeping the static 40k prefix byte-identical so it reads at 0.1×.
</details>

### Quick-Recall Flashcard
```
Q: On the default 5-minute tier, what does a cache WRITE cost and what does a READ cost?
A: Write = 1.25x base input tokens; Read/refresh = 0.1x base input tokens.
   Bonus: 1-hour tier writes cost 2.0x. Reads are always 0.1x. Max 4 breakpoints, 20-block lookback.
```

---

## 2. Token Counting & Cost Control

### Core Concept Summary
The **count-tokens endpoint** (`client.messages.count_tokens(...)`, HTTP `POST /v1/messages/count_tokens`) tells you exactly how many **input tokens** a request *would* consume **before you send it** — for free and without generating anything. It accepts the *same* structured payload as `messages.create` (system, tools, images, PDFs, thinking), so the count reflects your real request shape. Use it to budget spend, enforce context-window limits, and make model-routing decisions pre-flight. A **token** is roughly ¾ of a word; different model families tokenize differently, so a count is only valid for the model you passed.

### Key Facts & Mechanics
- Endpoint: `client.messages.count_tokens(model=..., system=..., messages=..., tools=...)`. **Response shape:** `{ "input_tokens": <int> }` — that's it (input only; it can't know output length in advance).
- **Free**, but rate-limited **separately** from message creation (Start 5,000 RPM / Build 10,000 / Scale 20,000). Using one does **not** draw down the other's limit.
- **It does NOT apply caching logic** — you may include `cache_control` blocks, but the count is the raw, uncached total. Caching only happens at real `messages.create` time.
- **Newer tokenizer alert:** Claude 4.7+ / Fable / Mythos produce **~30% more tokens** for the same text than older models. **Recount against the target model** — never reuse an old count when migrating.
- Counts may include a few **system-added tokens** you are *not billed* for; billing reflects only your content.
- **Cost estimation formula** (per request):
  ```
  cost = (input_tokens / 1e6) * input_price
       + (expected_output_tokens / 1e6) * output_price
  # With caching:
  cost = (uncached_input/1e6)*base
       + (cache_write/1e6)*(1.25 or 2.0)*base
       + (cache_read/1e6)*0.1*base
       + (output/1e6)*output_price
  ```
- **Truncation strategy:** when a prompt exceeds the budget/context window, cut from the **middle or the oldest turns**, not the instructions. Keep the **system prompt + most recent user turn** (they carry intent); drop or summarize stale middle history. Cutting the *end* would delete the actual question.

### Annotated Code Example
```python
# Pre-flight budgeting: count BEFORE you spend a generation.
count = client.messages.count_tokens(
    model="claude-sonnet-5",          # count is model-specific — match your target model!
    system=SYSTEM_PROMPT,
    tools=TOOLS,                      # tools count too (first sampling call)
    messages=history + [new_turn],
)
budget = 180_000                      # leave headroom below the context window
if count.input_tokens > budget:
    history = summarize_or_drop_oldest(history)   # trim the MIDDLE/oldest, keep system + latest turn
# Estimate $ before sending:
est_cost = count.input_tokens/1e6 * 2.00 + 1024/1e6 * 10.00  # Sonnet 5 in/out prices
```

### Mental Model / Analogy
Counting tokens is **weighing your luggage at home before the airport**. The scale (endpoint) is free and instant; it saves you from the expensive surprise at the gate (a rejected over-limit request or a runaway bill). But it only weighs the **bag you're checking in** (input) — it can't weigh the souvenirs you'll buy on the trip (output). And a kilogram on one airline's scale reads differently on another's (**different tokenizers**).

### Common Exam Traps
- ⚠️ **TRAP: "count_tokens returns total cost / output tokens."** It returns **only `input_tokens`**. It cannot predict output length and does not price the request.
- ⚠️ **TRAP: Reusing a token count across models.** 4.7+/Fable/Mythos count ~30% higher. A prompt that "fit" on an older model may overflow the newer one's budget.
- ⚠️ **TRAP: Thinking count_tokens reflects your cache savings.** It ignores caching entirely — the number is the *uncached* total.

### Scenario Challenge
> **What would happen if** you budget a migration by taking the `input_tokens` you measured on Claude Opus 4.5 and assume the same count on Claude Fable 5?

<details><summary>Reveal answer</summary>

You'd **under-budget by roughly 30%**. Fable uses the newer tokenizer (introduced with Opus 4.7) that emits ~30% more tokens for identical text. Prompts could unexpectedly exceed your cost budget or the context window. **Fix:** recount the *same* request with `model="claude-fable-5"` and compare the two `input_tokens` values before migrating.
</details>

### Quick-Recall Flashcard
```
Q: What exactly does the count_tokens endpoint return, and does it factor in prompt caching?
A: It returns only { "input_tokens": N } — input count for the given model. It does NOT apply caching
   logic and cannot predict output tokens. It's free and rate-limited separately from message creation.
```

---

## 3. Vision / Multimodal Inputs

### Core Concept Summary
Claude accepts **images** as `image` content blocks inside a user message, using one of three `source` types: **base64**, **URL**, or a **`file_id`** from the Files API. Images are billed as **visual tokens** based on their pixel dimensions, so resolution directly drives cost. **Documents** (PDFs) go in as `document` blocks and are handled page-by-page. Placing images **before** text generally improves results. In multi-turn/agentic flows, prefer the **Files API** so you don't resend heavy base64 bytes on every turn.

### Key Facts & Mechanics
- **Image block structure:**
  ```json
  {"type": "image", "source": {"type": "base64", "media_type": "image/jpeg", "data": "<b64>"}}
  {"type": "image", "source": {"type": "url", "url": "https://..."}}
  {"type": "image", "source": {"type": "file", "file_id": "file_..."}}
  ```
- **Supported media types:** `image/jpeg`, `image/png`, `image/gif`, `image/webp`. **Animations unsupported — only the first frame is read.**
- **Size / count limits:**
  - Max **10 MB** per image (base64) on the direct API; **5 MB** on Bedrock/Google Cloud.
  - Max dimensions **8000×8000 px**.
  - **100 images/request** for 200k-context models; **600/request** for others; **20/message** on claude.ai.
  - ⚠️ If a request has **>20 images**, a stricter per-image dimension cap kicks in — resize so neither side exceeds **2000 px** (or keep ≤20 image/doc blocks).
- **Token cost of images:** Claude views images in **28×28-pixel patches** (**visual tokens**). Cost = **⌈width/28⌉ × ⌈height/28⌉** visual tokens. (An older approximation you may see: `width × height / 750`.)
  - **Resolution tiers:** High-res (Claude 4.7+) max long edge **2576 px** / **4784** visual tokens; Standard (all others) max long edge **1568 px** / **1568** visual tokens. Larger images are **downscaled** before processing.
- **Document (PDF) handling:** `document` blocks with `media_type: "application/pdf"`; token counting supports PDFs with the same limits as the Messages API. Text files are passed as text/document blocks.
- 💡 **Files API** (`file_id`) is the win for repeated or multi-turn image use: upload once, reference many times, keep payloads small and under the 32 MB request cap.

### Annotated Code Example
```python
# Prefer image-BEFORE-text; use Files API in agent loops to avoid re-sending bytes.
file = client.files.upload(file=("chart.png", open("chart.png","rb"), "image/png"))
msg = client.messages.create(
    model="claude-opus-5",
    max_tokens=1024,
    messages=[{
        "role": "user",
        "content": [
            {"type": "image", "source": {"type": "file", "file_id": file.id}},  # image first
            {"type": "text", "text": "What trend does this chart show?"},        # text second
        ],
    }],
)
# Cost of a 1568x1568 image ≈ ceil(1568/28) * ceil(1568/28) = 56 * 56 = 3136 visual tokens (pre-downscale).
```

### Mental Model / Analogy
An image is billed like **floor tiles in a room**: Claude lays down **28×28 tiles** (`patches`) and counts how many it takes to cover the whole floor. A bigger room (higher resolution) = more tiles = more tokens. And if the room is bigger than the building allows (over the long-edge limit), the model **shrinks the blueprint** (downscales) before tiling — so a giant 8000px image doesn't cost proportionally more once it's downscaled to the tier cap.

### Common Exam Traps
- ⚠️ **TRAP: "Higher resolution is always better."** Beyond the tier's long-edge limit the image is **downscaled anyway** — you gain nothing and pre-downscale you'd have paid for tokens you didn't need. Right-size images to the tier.
- ⚠️ **TRAP: Base64 in a long agent loop.** Base64 bytes are **resent on every turn**, ballooning payload size and latency; the exam-correct move is the **Files API** (`file_id`).
- ⚠️ **TRAP: Confusing per-image size (10 MB) with per-request size (32 MB).** You can hit the **32 MB request cap** long before the 600-image count with several large base64 images.

### Scenario Challenge
> **What would happen if** you build an agent that inspects 15 screenshots across a 10-turn conversation, embedding each as base64 in the user turns?

<details><summary>Reveal answer</summary>

Because each request resends the **entire conversation history**, all accumulated base64 image bytes are re-transmitted every turn — request size and latency grow turn over turn, and you risk the **32 MB per-request limit** and higher costs. **Fix:** upload each screenshot once via the **Files API** and reference by `file_id`; payloads stay small regardless of history length.
</details>

### Quick-Recall Flashcard
```
Q: How is an image's token cost calculated, and what's the patch size?
A: Claude tiles the image into 28x28-pixel patches (visual tokens):
   cost = ceil(width/28) * ceil(height/28). Images over the tier's long-edge limit are downscaled first.
```

---

## 4. Error Handling & Retries

### Core Concept Summary
Production Claude apps must survive transient failures. The two you'll be tested on are **`429 rate_limit_error`** (your org crossed a limit — RPM, **input tokens/min (ITPM)**, **output tokens/min (OTPM)**, or a spend cap) and **`529 overloaded_error`** (Anthropic's infrastructure is temporarily saturated — everyone, not just you). The correct response to both transient errors is **retry with exponential backoff + jitter**, honoring the **`retry-after`** header when present. To retry *safely* without duplicate side effects, use **idempotency**.

### Key Facts & Mechanics
- **`429 rate_limit_error`** — *your* account/org hit a limit: **RPM**, **ITPM**, **OTPM**, monthly spend cap, or Claude Code workspace spend limit.
  - In long agent loops a 429 is **almost always ITPM**, not RPM. **Cache the system prompt** and gate on `anthropic-ratelimit-input-tokens-remaining`.
  - ⚠️ A **tier spend-cap 429 has NO `retry-after` header** and keeps failing until access resumes — backoff won't fix it.
- **`529 overloaded_error`** — Anthropic-side capacity strain affecting all users; not your fault, not your limits. Usually resolves in **seconds to minutes**. Check the status page; retry with backoff.
- **Other codes:** `400 invalid_request_error`, `401 authentication_error`, `403 permission_error`, `404 not_found_error`, `413 request_too_large` (>32 MB standard endpoints), `500 api_error`, `504 timeout_error`.
- **SDKs auto-retry** transient failures (connection errors, 429, 5xx) with exponential backoff **twice by default**, honoring `retry-after`. Configure via a **max-retries** option.
- **Error shape:** JSON with a top-level `error` object (`type` + `message`) and a `request_id` — log the `request_id` for support.
- **Exponential backoff with jitter:** wait `min(cap, base * 2**attempt)` then add random jitter to avoid a **thundering herd**.
- **Idempotency:** send an idempotency key / dedupe on a client-generated request ID so a retried request isn't processed twice. Reads are naturally idempotent; guard state-changing side effects (e.g., a tool that charges a card).

### Annotated Code Example
```python
import random, time

def call_with_backoff(fn, max_retries=5, base=1.0, cap=60.0):
    for attempt in range(max_retries):
        try:
            return fn()
        except anthropic.RateLimitError as e:          # HTTP 429
            retry_after = getattr(e, "retry_after", None)
            wait = float(retry_after) if retry_after else min(cap, base * 2**attempt)
            time.sleep(wait + random.uniform(0, wait * 0.25))   # 🔁 backoff + JITTER
        except anthropic.InternalServerError:          # 500/529-class transient
            time.sleep(min(cap, base * 2**attempt) + random.random())
        # Do NOT retry 400/401/403 — those are permanent; fix the request/key/permission.
    raise RuntimeError("Exhausted retries")
```

### Mental Model / Analogy
**429 is your own metered driveway; 529 is a citywide power outage.** A `429` means *you* parked too many cars in your driveway — wait, thin out traffic, and check the `retry-after` sign. A `529` means the whole grid is down — nothing you did, and it'll come back on its own; just keep politely knocking (with backoff). **Jitter** is everyone agreeing not to all knock at the exact same second, so you don't crash the door together when power returns.

### 429 vs 529 — the comparison the exam loves
| | **429 `rate_limit_error`** | **529 `overloaded_error`** |
|---|---|---|
| **Whose fault** | Your org crossed a limit | Anthropic infra saturated (all users) |
| **Typical cause** | RPM / **ITPM** / OTPM / spend cap | Temporary capacity strain |
| **`retry-after` header** | Usually present (⚠️ *absent* for spend-cap 429s) | Not guaranteed — use backoff |
| **Right fix** | Slow down, cache, gate on remaining-tokens headers | Retry with backoff + jitter; check status page |
| **Persists after backoff?** | Yes, if it's a **spend cap** (needs access to resume) | No — usually clears in seconds–minutes |

### Common Exam Traps
- ⚠️ **TRAP: "429 means slow down; 529 means slow down too — same handling."** Different causes. A **spend-cap 429** has *no* `retry-after` and won't clear with backoff; a 529 is server-side and *will* clear. Backoff helps 529, not a spend cap.
- ⚠️ **TRAP: Retrying a `400`/`401`/`403`.** These are **permanent** (bad request, bad key, no permission). Retrying wastes calls — fix the input/credentials instead.
- ⚠️ **TRAP: Backoff without jitter.** Synchronized retries create a **thundering herd** that re-triggers overload. Jitter is not optional in the exam-correct answer.

### Scenario Challenge
> **What would happen if** your agent loop starts returning `429` with **no `retry-after` header**, and your backoff keeps escalating but every retry still 429s?

<details><summary>Reveal answer</summary>

This is the signature of a **tier spend-cap 429**, *not* a transient rate limit. Backoff will never clear it because it's not a "too fast" problem — it's "access is paused until the cap resets or is raised." **Fix:** recognize the missing `retry-after`, stop retrying, and resolve the spend cap (raise the limit / wait for reset). Distinguish it from ITPM 429s, which *do* carry `retry-after` and *do* clear with backoff + caching.
</details>

### Quick-Recall Flashcard
```
Q: What HTTP status is a rate limit, what is server overload, and what's the core difference?
A: 429 = rate_limit_error (YOUR org hit a limit/spend cap; check retry-after).
   529 = overloaded_error (Anthropic's infra saturated for ALL users; retry with backoff+jitter).
   Bonus: a spend-cap 429 has NO retry-after and won't clear via backoff.
```

---

## 5. Basic Agent Loop in Code

### Core Concept Summary
An **agent loop** is the cycle: call the model → if it requests a tool (`stop_reason: "tool_use"`) → **execute** that tool in your code → **feed the result back** as a `tool_result` in a new user turn → repeat until the model finishes (`stop_reason: "end_turn"`). The `stop_reason` field is your control signal for whether to continue, stop, retry, or handle specially. A robust loop always has a **loop guard** (max iterations) so a misbehaving model can't spin forever.

### Key Facts & Mechanics
- **`stop_reason` values you must know:**
  - `end_turn` — Claude finished naturally → **stop / return to user**.
  - `tool_use` — Claude wants a tool → **run it, return `tool_result`, loop**.
  - `max_tokens` — hit the `max_tokens` cap → response is **truncated**; raise the cap or continue.
  - `stop_sequence` — hit one of your `stop_sequences` → read `stop_sequence` to see which.
  - `pause_turn` — a long-running server tool paused → **resend the response** to continue.
  - `refusal` — Claude declined for safety → **do not retry blindly**; `stop_details` names the policy category.
  - `model_context_window_exceeded` — prompt+output overflowed the window → trim context.
- The tool-use turn contains **`tool_use` content blocks** with an `id`, `name`, and `input`. You reply with matching **`tool_result` blocks** referencing each `tool_use_id`.
- **Parallel vs sequential tool calls:** one assistant turn can emit **multiple `tool_use` blocks at once** (parallel) — you must return **all** corresponding `tool_result` blocks in the *next single user turn*. Sequential tools happen across multiple loop iterations.
- 💡 Append the **assistant's tool_use turn** to history *before* adding your `tool_result` — the API requires the `tool_use`/`tool_result` pairing to be intact.
- 🔁 **Loop guard:** cap iterations (e.g., `MAX_STEPS = 10`) to prevent infinite tool loops and runaway cost.

### Annotated Code Example
```python
messages = [{"role": "user", "content": user_query}]
MAX_STEPS = 10                                   # 🔁 loop guard: never spin forever

for _ in range(MAX_STEPS):
    resp = client.messages.create(               # Step 1: call the model
        model="claude-sonnet-5", max_tokens=1024,
        tools=TOOLS, messages=messages,
    )
    if resp.stop_reason == "end_turn":           # Step 2: natural finish -> done
        break
    if resp.stop_reason == "max_tokens":
        # response was TRUNCATED — raise max_tokens or continue; don't treat as complete
        break
    if resp.stop_reason == "tool_use":
        messages.append({"role": "assistant", "content": resp.content})  # keep tool_use turn intact
        tool_results = []
        for block in resp.content:               # Step 3: handle ALL tool calls (may be parallel)
            if block.type == "tool_use":
                out = execute_tool(block.name, block.input)   # run your function
                tool_results.append({
                    "type": "tool_result",
                    "tool_use_id": block.id,     # must match the tool_use id
                    "content": str(out),
                })
        messages.append({"role": "user", "content": tool_results})  # Step 4: feed results, loop
else:
    raise RuntimeError("Hit max steps without end_turn")   # guard tripped
```

### Mental Model / Analogy
The agent loop is a **chef (Claude) with a runner (your code)**. The chef shouts an order — "I need diced onions" (`tool_use`). The runner fetches and drops them on the pass (`tool_result`). The chef keeps cooking, maybe shouts two orders at once (**parallel tool calls** — the runner brings *both* back together). When the plate's done, the chef calls "service!" (`end_turn`). The **loop guard** is the kitchen rule that after 10 shouts with no finished plate, the manager steps in so the chef doesn't order onions forever.

### Common Exam Traps
- ⚠️ **TRAP: Treating `max_tokens` as a successful finish.** `stop_reason: "max_tokens"` means the output was **cut off** — the answer is incomplete. Only `end_turn` (and sometimes `stop_sequence`) is a clean finish.
- ⚠️ **TRAP: Returning only one `tool_result` when the model made parallel calls.** You must return **every** `tool_result` (matched by `tool_use_id`) in the **next single user turn**, or the request errors.
- ⚠️ **TRAP: No loop guard.** A model that keeps requesting tools with no `end_turn` will spin infinitely and burn cost — the exam expects a **max-iterations** cap.

### Scenario Challenge
> **What would happen if** the model returns a turn with **two `tool_use` blocks** (parallel calls) and your loop executes both but only appends **one** `tool_result` before calling the API again?

<details><summary>Reveal answer</summary>

The next request is **malformed**: every `tool_use` block must be answered by a matching `tool_result` (by `tool_use_id`) in the following user turn. The API returns a **`400 invalid_request_error`**. **Fix:** collect *all* tool outputs into a single user message containing one `tool_result` per `tool_use_id`, then continue the loop.
</details>

### Quick-Recall Flashcard
```
Q: Which stop_reason means "run a tool and continue," and which means "truncated, not really done"?
A: tool_use = execute the tool(s), return tool_result(s), loop. max_tokens = output was TRUNCATED
   (incomplete). end_turn = clean finish. Always cap iterations with a loop guard.
```

---

## 6. Model Migration

### Core Concept Summary
**Model migration** is moving a production workload from one Claude version to another (e.g., Sonnet 4.5 → Sonnet 5). Prompts that were tuned for the old model don't automatically behave identically on the new one — **tokenization, defaults, formatting behavior, and refusal boundaries can shift**. The safe path is a **compatibility checklist → behavioral testing → canary/shadow rollout → monitored ramp → fast rollback**, with **model versions pinned** for reproducibility. Never flip 100% of traffic to a new model in one step.

### Key Facts & Mechanics
- **Prompt compatibility checklist across versions:**
  - **Recount tokens** on the target model (4.7+/Fable/Mythos ≈ **+30%** tokens) — re-check context-window fit and cost.
  - **Prefill:** Claude **4.6+** and Mythos Preview **do not support** assistant-message prefill → a prefilled last assistant turn returns `400`. Replace with **structured outputs** / `output_config.format` / system-prompt instructions.
  - **Thinking blocks** must be passed back **unmodified** with tool use, or you get a `400`.
  - Re-verify **caching minimums** (they differ by tier) and **stop_sequences** behavior.
- **Behavioral differences to test for:** output formatting/verbosity, tool-selection tendencies, refusal thresholds, latency, adherence to structured-output schemas, and cost per request.
- **Canary / shadow deployment:**
  - **Shadow:** send a *copy* of live traffic to the new model **without serving its output** — compare offline. Zero user risk.
  - **Canary:** route a **small % of real traffic** (e.g., 1% → 5% → 25% → 100%) to the new model, watching quality/error/cost metrics before widening.
- **Rollback triggers:** spikes in error rate (esp. `400`s from prefill/thinking incompatibility), quality regressions on your eval set, latency or cost blowouts, or increased refusals → **revert to the pinned old version immediately**.
- **Versioning best practices:** **pin** explicit model IDs (e.g., `claude-sonnet-4-5`) in production for **reproducibility**; only **float** to an alias in dev/experimentation. Keep an **eval suite** you can re-run on any candidate model.

### Annotated Code Example
```python
# Canary migration with a pinned version + fast rollback.
import random
OLD = "claude-sonnet-4-5"      # pinned for reproducibility
NEW = "claude-sonnet-5"
CANARY_PCT = 0.05              # start at 5%, widen only if metrics hold

def choose_model():
    return NEW if random.random() < CANARY_PCT else OLD

model = choose_model()
try:
    resp = client.messages.create(model=model, max_tokens=1024, messages=msgs)
    log_metrics(model, resp)                 # track quality, latency, cost, refusals
except anthropic.BadRequestError as e:       # 400: e.g. prefill/thinking incompatibility on NEW
    if model == NEW:
        resp = client.messages.create(model=OLD, max_tokens=1024, messages=msgs)  # rollback trigger
```

### Mental Model / Analogy
Migrating models is **swapping the engine in a car that's still driving customers around**. You don't yank the old engine and hope — you first **bench-test the new one** (compatibility checklist), run it on a **dyno while the real engine still drives** (shadow), then put it in **one loaner car out of twenty** (canary) and watch the dashboard. If a warning light flashes (rollback trigger), you drop the **old, VIN-stamped engine** (pinned version) back in instantly.

### Common Exam Traps
- ⚠️ **TRAP: "New model = drop-in replacement, no testing needed."** Tokenization (+30%), **prefill removal (4.6+)**, thinking-block rules, and behavioral shifts can break prompts. Always run the compatibility checklist + evals.
- ⚠️ **TRAP: Floating model aliases in production.** Great for dev, bad for prod — an alias silently changing under you **destroys reproducibility**. **Pin** explicit versions in prod.
- ⚠️ **TRAP: Big-bang 100% cutover.** The exam-correct rollout is **shadow → canary → gradual ramp** with monitoring, not flipping all traffic at once.

### Scenario Challenge
> **What would happen if** you migrate a prompt that **prefills the assistant's reply** ("Sure! Here's the JSON: {") from Sonnet 4.5 to a Claude 4.6+ model, with a big-bang cutover?

<details><summary>Reveal answer</summary>

Every request **fails with `400 invalid_request_error`** — "This model does not support assistant message prefill." A big-bang cutover turns that into a **full outage**. **Fix:** catch it in the compatibility checklist first; replace prefill with **structured outputs / `output_config.format` / system-prompt guidance**, validate on a canary, and keep the pinned old version ready for rollback.
</details>

### Quick-Recall Flashcard
```
Q: What's the safe rollout order for a model migration, and why pin versions?
A: Shadow (mirror traffic, don't serve) -> canary (small % real traffic) -> gradual ramp -> 100%,
   with fast rollback to a PINNED version. Pinning = reproducibility; floating aliases break it in prod.
```

---

## 7. Exam Strategy & Meta-Tips

### Time Management (120 min / 53 questions)
- Budget **~2.3 minutes per question**. At the 15-, 30-, 45-question marks, check the clock — if you're slower than ~2.3 min/q, speed up.
- **Two-pass triage:** answer everything you know cold on pass 1; **flag and return** to the hard/long scenarios on pass 2. Never let one 5-line scenario eat 8 minutes early.
- **Multiple-response** ("select all that apply") questions take longer — don't rush them; ⚠️ the trap is **under-selecting** (stopping at one correct option).

### High-Probability Question Themes per Topic
- **Prompt Caching (Applications):** breakpoint placement on stable-vs-volatile content; 1.25× vs 2.0× write, 0.1× read; the "timestamp before breakpoint" mistake.
- **Token Counting (Applications/Models):** what `count_tokens` returns (input only); +30% newer tokenizer; recount before migrating.
- **Vision (Applications):** base64 vs Files API in agent loops; 28×28 patch cost; downscaling above tier limits.
- **Errors & Retries (Applications):** 429 vs 529; backoff **with jitter**; spend-cap 429 has no `retry-after`; don't retry 4xx-permanent.
- **Agent Loop (Agents):** `stop_reason` handling; `max_tokens` = truncated; parallel tool_result pairing; loop guards; **"does this even need an agent?"**
- **Model Migration (Models):** shadow/canary; pin vs float; prefill removed on 4.6+; rollback triggers.

### "If You're Unsure" Elimination Strategies
- ⚠️ **Distrust absolutes.** Options with **"always / never / only"** are usually wrong on a judgment exam. Qualified answers ("when latency allows…", "if cost matters…") tend to win.
- 💡 **Follow the money.** When two answers look technically fine, the one that **accounts for token cost / caching** is usually correct (the *cost-blind* distractor is a classic trap).
- 💡 **Prefer the simplest sufficient design.** If a deterministic **workflow** meets the need, don't pick the autonomous **agent** (over-engineering is penalized).
- 💡 **Match model to requirement.** Don't reflexively pick **Opus** if **Sonnet/Haiku** meets the latency/cost bar.
- 💡 **Security is layered.** Reject "just tell it in the prompt" as a defense against prompt injection — real answers use guardrails, hooks, least-privilege.
- On multiple-response: **re-read for a second correct option** before locking in.

### Last-24-Hour Review Checklist
- [ ] Caching cost multipliers: **write 1.25× (5m) / 2.0× (1h), read 0.1×**; **4 breakpoints, 20-block lookback**; place on the **last stable block**.
- [ ] `count_tokens` → **`input_tokens` only**, **free**, **ignores caching**, **+30%** on newer tokenizer.
- [ ] Vision: **28×28 patches**, `⌈w/28⌉×⌈h/28⌉`; **Files API** in loops; formats **JPEG/PNG/GIF/WebP**.
- [ ] **429 vs 529** table; **backoff + jitter**; spend-cap 429 = no `retry-after`; don't retry `400/401/403`.
- [ ] `stop_reason`: `end_turn` / `tool_use` / **`max_tokens`=truncated** / `pause_turn` / `refusal`; **loop guard**; parallel `tool_result` pairing.
- [ ] Migration: **shadow → canary → ramp**; **pin versions**; **prefill gone on 4.6+**; rollback triggers.
- [ ] Meta: distrust **always/never/only**; pick the **cost-aware, simplest-sufficient** answer; don't **under-select** on multiple-response.
- [ ] Logistics: sleep, arrive early, ~2.3 min/q pacing, flag-and-return.

---

## 8. Self-Test — 10 Exam-Style Questions

*Answer all ten, then open the key. Each explanation says why the right answer is right **and why each wrong answer is wrong**.*

**Q1.** A cached prompt uses the default 5-minute tier. What are the write and read cost multipliers relative to base input price?
- A) Write 2.0×, read 0.1×
- B) Write 1.25×, read 0.1×
- C) Write 1.25×, read 0.25×
- D) Write 1.0×, read 0.5×

**Q2.** You place `cache_control` on a block that contains a per-request timestamp at the *end* of your prompt. What is the most likely outcome across many requests?
- A) Steady cache reads at 0.1× after the first call
- B) A cache write on every request and no reads — more expensive than not caching
- C) A 400 error because timestamps can't be cached
- D) The timestamp is automatically stripped before hashing

**Q3.** What does the `count_tokens` endpoint return, and does it account for prompt caching?
- A) Total input + output tokens, caching applied
- B) Only `input_tokens`, caching NOT applied
- C) A cost estimate in USD, caching applied
- D) Only `output_tokens`, caching NOT applied

**Q4.** You migrate a prompt from Claude Opus 4.5 to Claude Fable 5 and reuse your old token counts for budgeting. What's the risk?
- A) No risk — counts are model-independent
- B) You'll over-budget by ~30%
- C) You'll under-budget by ~30% because the newer tokenizer emits more tokens
- D) The request will be rejected as incompatible

**Q5.** How is an image's visual-token cost computed on current models?
- A) A flat 1,000 tokens per image
- B) `⌈width/28⌉ × ⌈height/28⌉` (28×28-pixel patches)
- C) `width × height` in pixels
- D) 85 tokens for low detail, 170 for high

**Q6.** In a 10-turn agent that inspects many images, which approach best controls request size and latency?
- A) Base64-encode every image inline each turn
- B) Upload once via the Files API and reference by `file_id`
- C) Send image URLs that expire after one turn
- D) Convert every image to text descriptions client-side

**Q7.** Your app suddenly gets `429` responses with **no `retry-after` header**, and exponential backoff never clears them. What is the most likely cause?
- A) A transient network blip
- B) A `529` mislabeled as `429`
- C) A tier **spend-cap** 429 that won't clear until access resumes
- D) The `retry-after` header was dropped by your proxy and it's really ITPM

**Q8.** Which statement about `429` vs `529` is correct?
- A) Both indicate your organization exceeded a rate limit
- B) `429` is Anthropic-side overload; `529` is your rate limit
- C) `429` is your org's limit/spend; `529` is Anthropic infrastructure overload affecting all users
- D) `529` should never be retried

**Q9.** Your agent loop receives `stop_reason: "max_tokens"`. What does this mean and what should you do?
- A) The model finished cleanly; return the answer
- B) The output was truncated; raise `max_tokens` or continue — don't treat it as complete
- C) The model refused; inspect `stop_details`
- D) A tool was requested; execute it and loop

**Q10.** What is the exam-preferred rollout strategy for migrating a production workload to a new model?
- A) Big-bang: switch 100% of traffic at once to move fast
- B) Float a model alias in production so you always get the newest version
- C) Shadow → canary (small %) → gradual ramp, with rollback to a **pinned** version
- D) Only migrate if the new model is cheaper, otherwise never migrate

---

<details><summary><b>🔒 Answer Key + Explanations (open after answering)</b></summary>

**Q1 — B.** 5-minute writes cost **1.25×**, reads **0.1×**.
- A wrong: 2.0× is the **1-hour** write, not 5-minute. C wrong: 0.25× read applies only to Fable/Mythos 5.1, not the general multiplier. D wrong: fabricated numbers; writes are never at base (1.0×) and reads aren't 0.5×.

**Q2 — B.** The breakpoint hash includes the changing timestamp, so every request misses → a fresh **write each time, zero reads** = strictly worse than no caching.
- A wrong: reads only happen if the hashed prefix is byte-identical; the timestamp breaks that. C wrong: there's no error — caching just silently fails to save. D wrong: nothing is auto-stripped; the hash is literal.

**Q3 — B.** The endpoint returns **only `input_tokens`** and **does not apply caching logic** (caching happens only at real message creation).
- A/C wrong: it can't know output length and returns no dollar figure. D wrong: it's input, not output.

**Q4 — C.** Claude 4.7+/Fable/Mythos use a newer tokenizer that yields **~30% more tokens**, so reusing old counts **under-budgets**.
- A wrong: counts are model-specific. B wrong: direction is reversed (you under-, not over-budget). D wrong: the request isn't rejected — your estimate is just wrong.

**Q5 — B.** Cost = **⌈w/28⌉ × ⌈h/28⌉** visual tokens (28×28 patches).
- A wrong: not a flat rate. C wrong: raw `w×h` is far too large; `/750` is an older *approximation*, not the patch formula. D wrong: that's OpenAI's tiling scheme, not Claude's.

**Q6 — B.** The **Files API** uploads once and references by `file_id`, keeping payloads small as history grows.
- A wrong: base64 is resent every turn, inflating size/latency and risking the 32 MB cap. C wrong: URL expiry breaks later turns and isn't the size fix. D wrong: text descriptions lose visual fidelity and change the task.

**Q7 — C.** No `retry-after` + never clears = a **spend-cap 429**, which resumes only when access is restored, not via backoff.
- A wrong: a blip would clear quickly. B wrong: 529s are labeled 529. D wrong: an ITPM 429 *does* carry `retry-after` and clears with backoff — the opposite of what's described.

**Q8 — C.** `429` = your org's rate limit/spend cap; `529` = Anthropic infrastructure overload affecting everyone.
- A wrong: only 429 is your limit. B wrong: it reverses the two. D wrong: 529 is transient and *should* be retried with backoff.

**Q9 — B.** `max_tokens` means the response was **truncated** — incomplete; raise the cap or continue generation.
- A wrong: that's `end_turn`. C wrong: refusal is `stop_reason: "refusal"`. D wrong: a tool request is `stop_reason: "tool_use"`.

**Q10 — C.** The exam-correct path is **shadow → canary → gradual ramp** with rollback to a **pinned** version.
- A wrong: big-bang risks a full outage (e.g., prefill removed on 4.6+). B wrong: floating aliases in prod destroy reproducibility. D wrong: cost isn't the only migration driver, and "never migrate" ignores quality/capability gains.

**Score guide:** 9–10 = exam-ready on these topics · 7–8 = solid, review misses · ≤6 = re-read the flagged topic sections and re-drill the traps.
</details>

---

*Notes generated for CCDV-F prep. Technical details verified against the official Claude Platform docs (prompt caching, token counting, vision, API errors, stop reasons). Items marked `[VERIFY]` shift over time — recount/re-check against your target model before relying on exact thresholds. This is original study material — not reproduced exam content.*
