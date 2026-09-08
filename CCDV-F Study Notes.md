# 🎓 Claude Certified Developer: Foundations (CCDV-F) — Complete Study Notes

> **Audience:** Mid-level developer, comfortable with Python and REST APIs, new to the Claude API.
> **Goal:** Deep understanding + exam-day performance, not rote memorization.
> **Built from:** The official CCDV-F Exam Guide blueprint (53 scenario-based questions, 120 min, 720/1000 to pass).

---

## 📑 Table of Contents

- [Master Exam Overview](#master-exam-overview)
- [Topic 1: Messages API Mastery](#-topic-1-messages-api-mastery)
- [Topic 2: Tool Use / Function Calling](#-topic-2-tool-use--function-calling)
- [Topic 3: Structured Output](#-topic-3-structured-output)
- [Topic 4: Streaming](#-topic-4-streaming)
- [Topic 5: Model Selection in Code](#-topic-5-model-selection-in-code)
- [Final Exam Strategy & Rapid Review](#-final-exam-strategy--rapid-review)

---

## Master Exam Overview

The CCDV-F validates that you can **build real applications on the Claude API** and make sound **trade-off judgments** — it is a judgment exam, not a recall exam.

### 📊 Exam Format at a Glance

| Attribute | Value |
|---|---|
| **Exam code** | CCDV-F |
| **Questions** | 53 scenario-based (multiple-choice + multiple-response) |
| **Duration** | 120 minutes (~2.3 min/question) |
| **Passing score** | 720 / 1,000 (≈72%) |
| **Fee** | $125 USD |
| **Validity** | 12 months |
| **Recommended experience** | 1–5 yrs software engineering, 6+ months hands-on with Claude/LLMs, Python and/or TypeScript |

### ⚖️ Official Domain Weights

| # | Exam Domain | Weight | ~Qs |
|---|---|---|---|
| 1 | **Applications & Integration** | **33.1%** | ~18 |
| 2 | Model Selection & Optimization | 16.8% | ~9 |
| 3 | Agents & Workflows | 14.7% | ~8 |
| 4 | Prompt & Context Engineering | 11.0% | ~6 |
| 5 | Tools & MCPs | 10.6% | ~5 |
| 6 | Security & Safety | 8.1% | ~4 |
| 7 | Claude Code | 3.1% | ~2 |
| 8 | Eval, Testing & Debugging | 2.6% | ~1 |

> 🎯 **How this document maps to the exam:** The five topics below (Messages API, Tool Use, Structured Output, Streaming, Model Selection) are the **technical core of Domain 1 (Applications & Integration, 33.1%) plus Domain 2 (Model Selection, 16.8%) and Domain 5 (Tools & MCPs, 10.6%)** — together roughly **60% of the exam**. Master these five and you own the majority of the scored weight. Domains 3, 4, 6–8 are covered by the companion coaching modes (`deep-dive agents`, `deep-dive security`, etc.).

> ⚠️ **The exam's core philosophy:** *"Focus on trade-offs, not recall."* Almost every hard question hides a plausible-but-wrong instinct. Memorizing facts gets you ~60%; recognizing **traps** gets you past 720.

---

## 📡 Topic 1: Messages API Mastery

#### 🧠 Core Concept Box
> The Messages API is a **stateless** endpoint: you send the **entire conversation** every turn as an ordered `messages[]` array, and Claude returns one `assistant` message. There is no server-side memory — *you* own the transcript and replay it each call. `system` is a **top-level parameter**, never a message.

#### 💻 Annotated Code Block

```python
import anthropic

client = anthropic.Anthropic()  # reads ANTHROPIC_API_KEY from env

response = client.messages.create(
    model="claude-sonnet-4-5",           # exact model ID string (see Topic 5)
    max_tokens=1024,                     # REQUIRED — caps OUTPUT tokens; there is no default
    system="You are a concise travel assistant.",  # top-level, NOT a messages[] entry
    messages=[
        {"role": "user",      "content": "Best month to visit Kyoto?"},
        {"role": "assistant", "content": "Late November for autumn foliage."},  # prior turn replayed
        {"role": "user",      "content": "Why then specifically?"}              # roles must ALTERNATE
    ],
    temperature=0.7,                     # optional; see Topic 5 for interaction with top_p
)

# --- Reading the response (annotated) ---
print(response.content[0].text)   # content is a LIST of blocks; [0] is the first block
print(response.stop_reason)       # WHY generation ended: "end_turn", "max_tokens", etc.
print(response.usage.input_tokens, response.usage.output_tokens)  # billing + budgeting
print(response.role)              # always "assistant" on the response object
```

#### Full annotated response shape (JSON)

```json
{
  "id": "msg_01ABC...",
  "type": "message",
  "role": "assistant",
  "model": "claude-sonnet-4-5",
  "content": [
    { "type": "text", "text": "Late November aligns with peak koyo (foliage)..." }
  ],
  "stop_reason": "end_turn",
  "stop_sequence": null,
  "usage": { "input_tokens": 34, "output_tokens": 58 }
}
```

> 💡 `content` is **always an array of blocks**, even for a plain text reply. A response may contain multiple blocks (e.g. a `text` block + one or more `tool_use` blocks — see Topic 2). Never assume `content` is a string.

#### System prompt — placement, behavior, limits

- Passed as the top-level `system` parameter (a string, or a list of text blocks for prompt caching).
- Sets persona, rules, and constraints; it is **not** a turn and does **not** appear in `messages[]`.
- There is **no `{"role": "system"}` message** — attempting one raises a validation error.
- The system prompt counts toward **input tokens** (and can be cached to cut cost — see Topic 5).

#### Role types & ordering rules

| Role | Where it lives | Rules |
|---|---|---|
| `system` | Top-level `system` param | Optional; one per request; never in `messages[]` |
| `user` | `messages[]` | Conversation **must start with `user`** |
| `assistant` | `messages[]` | Claude's turns; you replay prior ones for multi-turn |

- Roles **must alternate** `user → assistant → user → …`. Two consecutive same-role messages are invalid (the SDK/ API will error).
- To **prefill** Claude's answer, end `messages[]` with a partial `assistant` message — Claude continues from it (powerful for structured output; see Topic 3).

#### `stop_reason` reference table

| `stop_reason` | What triggered it | What you should do |
|---|---|---|
| `end_turn` | Claude finished naturally | Normal completion — use the output |
| `max_tokens` | Hit your `max_tokens` cap | Output is **truncated**; raise cap or continue |
| `stop_sequence` | Hit one of your `stop_sequences` | Check `stop_sequence` field for which one |
| `tool_use` | Claude wants to call a tool | Execute tool, return `tool_result`, loop (Topic 2) |
| `pause_turn` | Long-running server tool paused | Continue the turn by sending the response back |
| `refusal` | Model declined for safety | Handle gracefully; do not retry blindly |

#### 🔁 Mental Model / Analogy
> The Messages API is like **mailing a full printed transcript back and forth**. Claude has amnesia between calls — every letter you send must contain the *entire* conversation so far. The `system` prompt is the **standing instructions stapled to the front of every envelope**, not a line in the letter.

#### ❓ Quick Check Questions
1. Where does the system prompt go, and why can't it be a message?
2. Your response comes back with `stop_reason: "max_tokens"`. Is the output complete? What's your fix?
3. Why must you resend the whole conversation on every turn?

<details><summary>✅ Answers</summary>

1. Top-level `system` parameter. It's a standing instruction, not a conversational turn — the API has no `system` role in `messages[]`, so putting it there errors out.
2. **No** — it's truncated. Increase `max_tokens`, or make another call to continue the generation.
3. The API is **stateless** — no server-side memory. The full `messages[]` array *is* the memory; omit earlier turns and Claude loses that context.
</details>

#### ⚠️ Trap Question Alert

```
⚠️ TRAP QUESTION ALERT #1
─────────────────────
MISCONCEPTION: "Pass the system prompt as {"role": "system"} inside messages[]."
REALITY: system is a TOP-LEVEL parameter. There is no system role in messages[].
EXAM VERSION: Code snippet with a system-role message; you must spot the bug.
```

```
⚠️ TRAP QUESTION ALERT #2
─────────────────────
MISCONCEPTION: "The API remembers the conversation, so I only send the newest user message."
REALITY: The API is STATELESS. You must replay the entire messages[] array each turn.
EXAM VERSION: A multi-turn app "forgets" context; identify the root cause (not resending history).
```

#### 🎯 Exam Tips
> - If a code sample includes a `system` role inside `messages[]`, it's **wrong** — that's the single most common Messages-API trap.
> - `max_tokens` limits **output only** and is **required**. A question implying it caps input, or has a default, is a distractor.
> - When asked "why did the app lose context," the answer is almost always **statelessness / not replaying history**, not a model limitation.

#### 🔗 Cross-Topic Connection
> A `tool_use` `stop_reason` is the **hand-off to Topic 2**: the same `messages[]` array grows with `tool_use` (assistant) and `tool_result` (user) blocks. And **prefilling an `assistant` turn** is the bridge to **Topic 3 (Structured Output)**.

#### 🏗️ Scenario Blocks

```
🏗️ SCENARIO 1: The Forgetful Chatbot
─────────────────────────────────────
SITUATION: A support bot answers the first question well but "forgets" everything
           after that — each reply acts like a brand-new conversation.
CHALLENGE: Make the bot maintain multi-turn context.
WRONG APPROACH: Add "remember our conversation" to the system prompt. Fails — the
                model has no server-side memory to remember with.
CORRECT APPROACH: On every call, append the new user message to a persisted
                  messages[] array (including all prior assistant replies) and send
                  the whole thing. The array IS the memory.
EXAM SIGNAL: Tests understanding that the Messages API is stateless and the client
             owns the transcript.
```

```
🏗️ SCENARIO 2: The Truncated Report
─────────────────────────────────────
SITUATION: A tool generates long financial summaries. Occasionally output cuts off
           mid-sentence with no error thrown.
CHALLENGE: Detect and handle incomplete generations reliably.
WRONG APPROACH: Assume any 200 OK response is complete and render it. Silent truncation
                ships broken reports.
CORRECT APPROACH: Inspect stop_reason. If "max_tokens", the output is truncated —
                  raise max_tokens or issue a continuation call, and never treat it
                  as final.
EXAM SIGNAL: Tests stop_reason literacy, especially distinguishing end_turn from
             max_tokens.
```

---

## 🔧 Topic 2: Tool Use / Function Calling

#### 🧠 Core Concept Box
> Tool use lets Claude **request** that *your* code run a function. Claude never executes anything itself — it emits a `tool_use` block (name + JSON args), **you** run the function, then you send the result back as a `tool_result` block. It's a request/response handshake you orchestrate in a loop.

#### 💻 Annotated Code Block

```python
tools = [
    {
        "name": "get_weather",                       # must match tool_use.name exactly
        "description": "Get current weather for a city. Use for any weather question.",
        # ↑ description is CRITICAL — it's how Claude decides WHEN to call this tool
        "input_schema": {                            # JSON Schema — this is the contract
            "type": "object",
            "properties": {
                "city": {"type": "string", "description": "City name, e.g. 'Kyoto'"},
                "unit": {"type": "string", "enum": ["c", "f"], "description": "Temp unit"}
            },
            "required": ["city"]                     # unit is optional; city is mandatory
        }
    }
]

response = client.messages.create(
    model="claude-sonnet-4-5",
    max_tokens=1024,
    tools=tools,
    messages=[{"role": "user", "content": "What's the weather in Kyoto?"}]
)

# Claude responds with stop_reason == "tool_use" and a tool_use block:
#   {"type": "tool_use", "id": "toolu_01X", "name": "get_weather",
#    "input": {"city": "Kyoto"}}
```

#### The full `tool_use` → `tool_result` cycle

```
┌─────────────────────────────────────────────────────────────────┐
│ STEP 1  user asks a question                                      │
│         messages = [ {user: "weather in Kyoto?"} ]                │
├─────────────────────────────────────────────────────────────────┤
│ STEP 2  Claude replies, stop_reason = "tool_use"                  │
│         assistant content = [ {type: tool_use, id: toolu_01X,     │
│                                name: get_weather,                 │
│                                input: {city: "Kyoto"}} ]          │
├─────────────────────────────────────────────────────────────────┤
│ STEP 3  YOU run get_weather("Kyoto") in your own code             │
│         -> "18C, clear"                                           │
├─────────────────────────────────────────────────────────────────┤
│ STEP 4  You append BOTH the assistant tool_use turn AND a new     │
│         user turn containing a tool_result:                       │
│         {role: user, content: [ {type: tool_result,              │
│                                  tool_use_id: toolu_01X,          │
│                                  content: "18C, clear"} ]}        │
├─────────────────────────────────────────────────────────────────┤
│ STEP 5  Call the API again with the grown messages[].            │
│         Claude replies with final text, stop_reason = "end_turn" │
└─────────────────────────────────────────────────────────────────┘
```

```python
# STEP 4-5 in code — note tool_use_id MUST match the id from the tool_use block
messages.append({"role": "assistant", "content": response.content})  # replay tool_use
messages.append({
    "role": "user",
    "content": [{
        "type": "tool_result",
        "tool_use_id": "toolu_01X",     # ← links result to the request; mismatch = error
        "content": "18C, clear"          # string, or list of blocks; can be an error too
    }]
})
final = client.messages.create(model="claude-sonnet-4-5", max_tokens=1024,
                               tools=tools, messages=messages)
```

#### Parallel tool calls

```python
# Claude may return MULTIPLE tool_use blocks in ONE response (e.g. weather for 2 cities).
tool_uses = [b for b in response.content if b.type == "tool_use"]

results = []
for tu in tool_uses:                      # run each (optionally concurrently)
    output = dispatch(tu.name, tu.input)  # your function router
    results.append({
        "type": "tool_result",
        "tool_use_id": tu.id,             # each result tied to its own id
        "content": str(output)
    })

# ALL tool_results go in a SINGLE user message — one block per tool_use:
messages.append({"role": "user", "content": results})
```

> 💡 **Rule:** Return **one `tool_result` per `tool_use`**, all bundled in **one** `user` message, each keyed by its `tool_use_id`. Splitting them across multiple messages, or dropping one, breaks the loop.

#### Forcing a specific tool & disabling tools

```python
# Force Claude to call a specific tool:
tool_choice={"type": "tool", "name": "get_weather"}

# Force SOME tool (any), but Claude picks which:
tool_choice={"type": "any"}

# Default — Claude decides whether to use a tool at all:
tool_choice={"type": "auto"}

# "Disable all tools": simply omit the tools parameter (or pass []). With no tools,
# Claude can't emit tool_use. You can also set tool_choice to none where supported.
```

> ⚠️ When you **force** a tool with `{"type": "tool", ...}` or `{"type": "any"}`, Claude will call a tool on the **first** turn and typically won't produce a plain text answer — plan your loop accordingly.

#### 🔁 Mental Model / Analogy
> Claude is a **brilliant analyst locked in a room with a telephone but no hands**. It can *tell you* "call the weather service with city=Kyoto," but *you* pick up the phone, dial, and read the answer back through the slot (`tool_result`). The `tool_use_id` is the **ticket number** stapling each answer to the right request.

#### ❓ Quick Check Questions
1. Who actually executes the tool — Claude or your code?
2. Claude returns two `tool_use` blocks. How many messages do you send back, and how are results structured?
3. What field links a `tool_result` to the `tool_use` that requested it?

<details><summary>✅ Answers</summary>

1. **Your code.** Claude only emits a request (`tool_use`); it never runs functions itself.
2. **One** user message containing **two** `tool_result` blocks — one per `tool_use`, each keyed by its own `tool_use_id`.
3. `tool_use_id` — it must exactly match the `id` on the corresponding `tool_use` block.
</details>

#### ⚠️ Trap Question Alert

```
⚠️ TRAP QUESTION ALERT #1
─────────────────────
MISCONCEPTION: "Claude executes the tool and returns the function's output directly."
REALITY: Claude only REQUESTS the call. Your application runs the function and returns
         a tool_result. Claude then incorporates it.
EXAM VERSION: A workflow diagram where "Claude runs the API call" — identify the wrong step.
```

```
⚠️ TRAP QUESTION ALERT #2
─────────────────────
MISCONCEPTION: "For 3 parallel tool calls, send 3 separate tool_result messages."
REALITY: All tool_results for one assistant turn go in ONE user message, one block each,
         each tagged with the matching tool_use_id.
EXAM VERSION: 'Select all that apply' about handling parallel calls — under-selection trap.
```

#### 🎯 Exam Tips
> - When the tool description is vague, Claude calls it at the wrong time. If a question is "why is the tool never/always firing," suspect the **description**, not the schema.
> - `tool_use_id` mismatches and missing `required` schema fields are classic bug-spotting items.
> - "Disable tools" ≠ a special flag — it's simply **not providing tools** (or `tool_choice: none`).

#### 🔗 Cross-Topic Connection
> The tool loop is powered by **Topic 1's `stop_reason: "tool_use"`** and grows the same `messages[]` array. Tool use is also the foundation of **Domain 3 (Agents & Workflows)** — an agent is essentially a tool-use loop with memory and a goal. And **MCP servers (Domain 5)** are a standardized way to *supply* tools rather than hand-defining each schema.

#### 🏗️ Scenario Blocks

```
🏗️ SCENARIO 1: The Infinite Tool Loop
─────────────────────────────────────
SITUATION: An assistant with a database tool keeps calling the tool over and over,
           never giving the user a final answer.
CHALLENGE: Terminate the loop correctly after the tool returns.
WRONG APPROACH: Set tool_choice={"type":"tool",...} for every call to "make sure it
                uses the DB." This FORCES a tool call every turn — it can never finish.
CORRECT APPROACH: Use tool_choice="auto". After returning the tool_result, call again;
                  Claude produces a text answer with stop_reason "end_turn". Loop only
                  while stop_reason == "tool_use".
EXAM SIGNAL: Tests tool_choice semantics + loop termination on stop_reason.
```

```
🏗️ SCENARIO 2: The Crashing Tool
─────────────────────────────────────
SITUATION: A currency-conversion tool throws when the external API times out, and the
           whole request 500s.
CHALLENGE: Let Claude recover gracefully from a tool failure.
WRONG APPROACH: Let the exception bubble up and crash the request. Claude never learns
                the call failed and can't adapt.
CORRECT APPROACH: Catch the error and return a tool_result with the error described
                  (set "is_error": true, content = message). Claude can then apologize,
                  retry, or ask the user — the loop stays intact.
EXAM SIGNAL: Tests tool error handling — returning an error tool_result vs an uncaught
             exception.
```

---

## 📐 Topic 3: Structured Output

#### 🧠 Core Concept Box
> Structured output means getting Claude to return data in a **reliable, machine-parseable shape** (usually JSON). The most robust techniques are **prefilling** the `assistant` turn with the opening `{`, giving an explicit **schema/example** in the system prompt, and — most reliable of all — using a **tool with an `input_schema`** so the JSON is validated against a contract.

#### 💻 Annotated Code Block

```python
# TECHNIQUE A — Prefill: force Claude to start its reply mid-JSON.
response = client.messages.create(
    model="claude-sonnet-4-5",
    max_tokens=1024,
    system="You extract structured data. Respond ONLY with valid JSON, no prose.",
    messages=[
        {"role": "user", "content": "Extract name, role, company: 'Nirav, an ML engineer at Acme.'"},
        {"role": "assistant", "content": "{"}   # ← PREFILL: Claude continues from the '{'
    ],
    stop_sequences=["}"]                          # optional: stop right after the object
)
json_text = "{" + response.content[0].text        # you re-attach the prefilled '{'
# ⚠️ If you use stop_sequences=["}"], re-append "}" too before parsing.
```

```python
# TECHNIQUE B — Tool as a schema enforcer (MOST RELIABLE for strict structure).
extract_tool = {
    "name": "record_person",
    "description": "Record the extracted person fields.",
    "input_schema": {
        "type": "object",
        "properties": {
            "name":    {"type": "string"},
            "role":    {"type": "string"},
            "company": {"type": "string"}
        },
        "required": ["name", "role", "company"]
    }
}
resp = client.messages.create(
    model="claude-sonnet-4-5", max_tokens=1024,
    tools=[extract_tool],
    tool_choice={"type": "tool", "name": "record_person"},  # FORCE the schema
    messages=[{"role": "user", "content": "Nirav, an ML engineer at Acme."}]
)
data = next(b.input for b in resp.content if b.type == "tool_use")  # already a dict!
# data == {"name": "Nirav", "role": "ML engineer", "company": "Acme"}
```

> 💡 **Why Technique B wins:** the `input` of a `tool_use` block is **already parsed against your JSON Schema** — no fragile string parsing, no stray markdown fences. This is the exam's favored "reliable structured output" answer.

#### Extraction patterns

| Pattern | What it does | Technique |
|---|---|---|
| **Named entity** | Pull people/orgs/dates from text | Tool schema with typed fields |
| **Classification** | Assign a label from a fixed set | `enum` in schema, or prefill + `stop_sequences` |
| **Transformation** | Reshape data (e.g. prose → table rows) | Tool schema with array of objects |

#### 🔁 Mental Model / Analogy
> Asking for JSON in plain prose is like asking a chef for "something with chicken" — you get *something*, but shape varies. A **tool `input_schema` is a fill-in-the-blank form**: the chef must return exactly the fields you printed on the form, in the right types. Prefilling the `{` is **handing them the form already opened to page one** so they can't wander off into a paragraph.

#### ❓ Quick Check Questions
1. Which structured-output technique gives the strongest schema guarantees, and why?
2. You prefill `assistant` with `{`. What must you remember when parsing the response?
3. How do you constrain a classification output to exactly one of three labels?

<details><summary>✅ Answers</summary>

1. A **tool with `input_schema`** (forced via `tool_choice`). The `tool_use.input` is validated against the schema and delivered as a parsed object.
2. The prefilled `{` is **not** in `response.content` — you must **prepend it yourself** (and re-append `}` if you stopped on it).
3. Put an `enum: ["a","b","c"]` on the field in the schema (or, prompt-only, prefill + a `stop_sequence`).
</details>

#### ⚠️ Trap Question Alert

```
⚠️ TRAP QUESTION ALERT #1
─────────────────────
MISCONCEPTION: "Just say 'return JSON' in the prompt — that's enough for production."
REALITY: Prompt-only JSON is the LEAST reliable method; the model can wrap it in prose or
         markdown fences. Use a tool input_schema (or prefill) for reliability.
EXAM VERSION: 'Most RELIABLE way to guarantee JSON shape' — the tool-schema option wins.
```

```
⚠️ TRAP QUESTION ALERT #2
─────────────────────
MISCONCEPTION: "After prefilling assistant with '{', response.content already includes it."
REALITY: The prefill text is NOT echoed back. You must re-attach '{' before json.loads().
EXAM VERSION: Code parses response and gets a JSONDecodeError — spot the missing prefix.
```

#### 🎯 Exam Tips
> - "Most reliable / production-grade structured output" → **tool `input_schema`**, not prompt wording.
> - Prefilling is a legit, cheaper technique — but remember the **prefix re-attachment** gotcha.
> - Markdown code-fence wrapping (```` ```json ````) is a common failure mode; strip fences or use a tool.

#### 🔗 Cross-Topic Connection
> Structured output rides directly on **Topic 2's tool mechanics** (`input_schema`, `tool_choice`) and **Topic 1's prefill** (partial `assistant` turn). It also underpins **Domain 8 (Eval/Testing)** — deterministic JSON output is what makes automated grading possible.

#### 🏗️ Scenario Blocks

```
🏗️ SCENARIO 1: The Markdown-Wrapped JSON
─────────────────────────────────────
SITUATION: An extraction pipeline intermittently fails to json.loads() Claude's reply.
           Logs show responses wrapped in ```json ... ``` fences.
CHALLENGE: Get clean, parseable JSON every time.
WRONG APPROACH: Add "no markdown please" to the prompt and hope. Still probabilistic.
CORRECT APPROACH: Switch to a forced tool with an input_schema; read tool_use.input as a
                  dict. No parsing, no fences, schema-validated.
EXAM SIGNAL: Tests knowing tool schemas > prompt instructions for reliable structure.
```

```
🏗️ SCENARIO 2: The Wandering Classifier
─────────────────────────────────────
SITUATION: A sentiment classifier should output exactly positive/negative/neutral, but
           sometimes returns "mostly positive" or a sentence.
CHALLENGE: Constrain output to one of three exact labels.
WRONG APPROACH: List the labels in the prompt and trust the model to comply verbatim.
CORRECT APPROACH: Define a tool field with enum:["positive","negative","neutral"] and
                  force the tool — the value is guaranteed to be one of the three.
EXAM SIGNAL: Tests enum-constrained schema fields for classification.
```

---

## ⚡ Topic 4: Streaming

#### 🧠 Core Concept Box
> Streaming sends the response back **incrementally as Server-Sent Events (SSE)** instead of one final blob. You get a sequence of typed events; text arrives in `content_block_delta` chunks that you **accumulate**. It dramatically improves **perceived latency (TTFB)** for interactive UIs but adds client complexity.

#### 💻 Annotated Code Block

```python
# The SDK's stream helper handles SSE parsing for you.
with client.messages.stream(
    model="claude-sonnet-4-5",
    max_tokens=1024,
    messages=[{"role": "user", "content": "Write a haiku about latency."}]
) as stream:
    for text in stream.text_stream:      # yields incremental text deltas
        print(text, end="", flush=True)  # render token-by-token in the UI

    final = stream.get_final_message()   # full assembled Message once done
    print("\n", final.stop_reason, final.usage.output_tokens)
```

```python
# Lower-level: handling raw events yourself (what the SSE stream actually contains).
with client.messages.stream(model="claude-sonnet-4-5", max_tokens=1024,
                            messages=[{"role":"user","content":"Hi"}]) as stream:
    buffer = ""
    for event in stream:
        if event.type == "content_block_delta":
            buffer += event.delta.text   # ← DELTA ACCUMULATION: append each chunk
        elif event.type == "message_stop":
            break
    # buffer now holds the full text
```

#### SSE event sequence (order matters)

```
message_start              ← empty Message shell (role, model, usage stub)
  content_block_start      ← a block begins (e.g. type: text  OR  type: tool_use)
    content_block_delta    ← incremental piece (text_delta, or input_json_delta for tools)
    content_block_delta    ← ...many of these...
  content_block_stop       ← this block finished
  content_block_start      ← (next block, if any — e.g. a second text/tool block)
    ...deltas...
  content_block_stop
message_delta              ← top-level updates: stop_reason, final usage
message_stop               ← stream complete
[ping]                     ← keep-alive events may appear anytime; ignore them
```

> 💡 For **tool use over streaming**, the tool's JSON arguments arrive as `input_json_delta` chunks that you concatenate into a JSON string, then parse at `content_block_stop`. Don't try to parse partial JSON mid-stream.

#### When (and when not) to stream

| Use streaming when… | Avoid streaming when… |
|---|---|
| Interactive chat UI — user watches text appear | Batch/offline jobs (use **batch API** for 50% cost cut) |
| Long outputs where TTFB perception matters | You need the whole result before acting (e.g. strict JSON parse) |
| Reducing "is it frozen?" abandonment | Simple, short, non-interactive calls |

#### 🔁 Mental Model / Analogy
> Non-streaming is a **letter that arrives finished**. Streaming is a **phone call** — words arrive as they're spoken, so it *feels* instant, but you have to **listen and transcribe continuously** (accumulate deltas) and reassemble the full sentence yourself. The `message_stop` event is the other person hanging up.

#### ❓ Quick Check Questions
1. Which event type carries incremental text, and what do you do with each one?
2. Does streaming reduce total latency or perceived latency? Why does that distinction matter?
3. Why shouldn't you parse a streamed tool call's JSON mid-stream?

<details><summary>✅ Answers</summary>

1. `content_block_delta` (with a `text_delta`). You **accumulate/append** each into a buffer.
2. **Perceived** latency / TTFB. Total tokens/time are similar, but showing text immediately keeps users engaged and cuts abandonment.
3. Tool args arrive as partial `input_json_delta` fragments — incomplete JSON. Concatenate all fragments and parse only at `content_block_stop`.
</details>

#### ⚠️ Trap Question Alert

```
⚠️ TRAP QUESTION ALERT #1
─────────────────────
MISCONCEPTION: "Streaming makes the model generate faster / lowers total latency."
REALITY: It improves PERCEIVED latency (time-to-first-token). Total generation time is
         roughly the same; you just see output sooner.
EXAM VERSION: 'Why stream?' with a distractor claiming faster total completion.
```

```
⚠️ TRAP QUESTION ALERT #2
─────────────────────
MISCONCEPTION: "Use streaming for a nightly bulk-processing job to save money/time."
REALITY: Non-interactive bulk work should use the BATCH API (~50% cheaper). Streaming is
         for interactive UX, not throughput or cost.
EXAM VERSION: batch-vs-streaming swap — pick batch for throughput/cost jobs.
```

#### 🎯 Exam Tips
> - "Benefit of streaming" → **TTFB / perceived latency & UX**, never "faster total" or "cheaper."
> - Throughput/cost/offline → **batch**, not streaming. This swap is a favorite distractor.
> - Know the event order: `message_start` → blocks (`start`/`delta`/`stop`) → `message_delta` → `message_stop`.

#### 🔗 Cross-Topic Connection
> Streaming's `message_delta` carries the same **`stop_reason` from Topic 1**, and streamed tool calls use **Topic 2's tool_use** mechanics (assembled from `input_json_delta`). The streaming-vs-batch trade-off is core **Domain 1 & 2 (Applications + Optimization)** judgment.

#### 🏗️ Scenario Blocks

```
🏗️ SCENARIO 1: The "Is It Frozen?" Chat UI
─────────────────────────────────────
SITUATION: A chat app shows a spinner for 8 seconds on long answers; users abandon,
           thinking it hung.
CHALLENGE: Improve responsiveness without a faster model.
WRONG APPROACH: Switch to Opus "for speed" (it's slower) or crank max_tokens down and
                truncate answers.
CORRECT APPROACH: Stream the response; render content_block_delta text as it arrives so
                  the first words appear in <1s. Same total time, far better perceived UX.
EXAM SIGNAL: Tests streaming's role in perceived latency for interactive UIs.
```

```
🏗️ SCENARIO 2: The Overnight Batch Job
─────────────────────────────────────
SITUATION: A pipeline must summarize 200k documents nightly. Cost is the top concern;
           no user is watching.
CHALLENGE: Minimize spend for high-volume, non-interactive work.
WRONG APPROACH: Stream each call to "handle them faster." Streaming gives no cost benefit
                and no user sees the tokens.
CORRECT APPROACH: Use the Message Batches API (~50% discount, async). Streaming is
                  irrelevant when nothing interactive consumes the tokens.
EXAM SIGNAL: batch-vs-streaming trade-off; cost-blind distractor avoidance.
```

---

## 🤖 Topic 5: Model Selection in Code

#### 🧠 Core Concept Box
> Choosing a model is a **cost/latency/capability trade-off**, not a "pick the biggest" decision. **Haiku** = fastest/cheapest for simple, high-volume tasks; **Sonnet** = balanced workhorse for most production work; **Opus** = deepest reasoning for genuinely hard tasks. Match the model to the requirement — over-provisioning is penalized on the exam.

#### 💻 Annotated Code Block

```python
# Exact model ID strings — format: claude-<family>-<version>  (pin for reproducibility)
MODELS = {
    "opus":   "claude-opus-4-5",     # deepest reasoning; highest cost/latency
    "sonnet": "claude-sonnet-4-5",   # balanced default for most production tasks
    "haiku":  "claude-haiku-4-5",    # fastest, cheapest; simple/high-volume tasks
}
# ⚠️ "claude-sonnet-latest" style aliases FLOAT to the newest version — convenient,
#    but NOT reproducible. Pin an exact dated/versioned ID when stability matters.

response = client.messages.create(
    model=MODELS["haiku"],           # a routing/classification task → cheap model
    max_tokens=256,                  # cap OUTPUT length (cost + truncation control)
    temperature=0.0,                 # 0 = deterministic/factual; higher = more creative
    top_p=0.9,                       # nucleus sampling; DON'T tune alongside temperature
    stop_sequences=["\n\nUSER:"],    # hard stop when this string is generated
    messages=[{"role": "user", "content": "Classify: 'refund my order' -> intent?"}]
)
```

#### Key parameters

| Parameter | Controls | Notes / traps |
|---|---|---|
| `max_tokens` | Max **output** tokens | **Required**; caps output only; hitting it → `stop_reason: max_tokens` (truncation) |
| `temperature` | Randomness (0–1) | 0 ≈ deterministic; higher = more varied/creative |
| `top_p` | Nucleus sampling cutoff | **Tune temperature *or* top_p, not both** |
| `stop_sequences` | Custom stop strings | Generation halts when one is produced; check `stop_sequence` field |

#### Parameter interaction effects

- **`temperature` vs `top_p`:** both shape randomness. Adjusting **one** is the norm; tuning both simultaneously makes behavior hard to reason about. For factual/extraction work use `temperature=0`; for creative work raise temperature.
- **`max_tokens` vs cost/latency:** bigger cap = potential for longer, costlier, slower outputs. Set it to the smallest value that fits the task.
- **`stop_sequences` + prefill:** combine to bound structured output (see Topic 3).

#### Choosing the right model (decision framework)

```
Is the task simple/high-volume (classification, routing, extraction, short replies)?
   → Haiku (cheapest, fastest)
Is it standard production work (chat, summarization, tool use, coding help)?
   → Sonnet (balanced default)
Does it need deep multi-step reasoning / hardest problems, latency & cost secondary?
   → Opus
Rule of thumb: start at Sonnet; drop to Haiku if it meets quality at lower cost;
               escalate to Opus only when Sonnet demonstrably falls short.
```

> 💡 **Cost levers beyond model choice:** **prompt caching** (reuse a large static system prompt cheaply) and the **batch API** (~50% off, async) often matter more than which model you pick.

#### 🔁 Mental Model / Analogy
> Models are **vehicles**. Haiku is a **scooter** — nimble, cheap, perfect for quick errands. Sonnet is a **reliable sedan** — handles almost everything daily. Opus is a **freight truck** — immense capability, but slow and expensive; you don't take the truck to buy milk. Picking Opus for a classification task is renting a semi to fetch groceries.

#### ❓ Quick Check Questions
1. A high-volume intent-classification endpoint needs low cost and low latency. Which model?
2. Why shouldn't you tune `temperature` and `top_p` together?
3. What's the difference between pinning a model version and using a "latest" alias?

<details><summary>✅ Answers</summary>

1. **Haiku** — cheapest and fastest, and classification doesn't need Opus-level reasoning.
2. They both control randomness via overlapping mechanisms; adjusting both makes output behavior unpredictable and hard to reason about. Change one.
3. **Pinning** a dated/versioned ID gives **reproducible** behavior (safe for production/stability). A **"latest" alias floats** to the newest model automatically — convenient but can silently change behavior.
</details>

#### ⚠️ Trap Question Alert

```
⚠️ TRAP QUESTION ALERT #1
─────────────────────
MISCONCEPTION: "For best results, always use the most powerful model (Opus)."
REALITY: Match model to requirement. Opus is slower and far costlier; Sonnet or Haiku
         often meet the bar. Over-provisioning is a graded mistake.
EXAM VERSION: Scenario with tight latency/cost budget where the 'Opus' option is the trap.
```

```
⚠️ TRAP QUESTION ALERT #2
─────────────────────
MISCONCEPTION: "Use a 'latest' model alias in production so you always get improvements."
REALITY: Aliases FLOAT — behavior can change without warning, breaking reproducibility.
         Pin an exact version when stability/reproducibility matters.
EXAM VERSION: version-pinning gotcha — reproducible prod pipeline should pin, not float.
```

#### 🎯 Exam Tips
> - See a tight **latency or cost budget**? The **biggest-model** answer is usually the trap. Pick the smallest model that meets the requirement.
> - "Reproducible / stable production" → **pin** the version. "Always get the newest" → alias (float). Know which the scenario wants.
> - `max_tokens` is **required** and caps **output** — any option implying otherwise is wrong.
> - Before "use a bigger model," consider **caching** and **batch** for cost, and **fast mode** for latency.

#### 🔗 Cross-Topic Connection
> `max_tokens` and `stop_reason: max_tokens` tie straight back to **Topic 1**. `stop_sequences` + `temperature=0` are the reliability knobs behind **Topic 3 (Structured Output)**. Model/cost trade-offs are the heart of **Domain 2 (Model Selection & Optimization, 16.8%)** and recur throughout **Agents (Domain 3)** where cheap models handle subtasks.

#### 🏗️ Scenario Blocks

```
🏗️ SCENARIO 1: The Over-Powered Classifier
─────────────────────────────────────
SITUATION: A team routes millions of support tickets by intent using Opus. The bill is
           enormous and p95 latency is too high for the SLA.
CHALLENGE: Cut cost and latency without hurting routing accuracy.
WRONG APPROACH: Keep Opus and "optimize the prompt" for speed. The model choice is the
                cost/latency driver, not the prompt.
CORRECT APPROACH: Move to Haiku (a classification task Haiku handles well), pin the
                  version, and cache the static system prompt. Massive cost/latency win.
EXAM SIGNAL: biggest-model reflex + cost-blind distractor; match model to task.
```

```
🏗️ SCENARIO 2: The Drifting Pipeline
─────────────────────────────────────
SITUATION: A regulated data-extraction pipeline suddenly produces subtly different
           outputs one morning; nothing in the code changed.
CHALLENGE: Guarantee reproducible model behavior over time.
WRONG APPROACH: Blame temperature and set it to 0 only. Helps determinism but doesn't
                explain the drift.
CORRECT APPROACH: Root cause: a floating 'latest' alias rolled to a new model version.
                  Pin an exact versioned model ID so behavior is stable and auditable.
EXAM SIGNAL: version pinning vs floating for reproducibility.
```

---

## 🏁 Final Exam Strategy & Rapid Review

### ⏱️ Time Management (per question type)

- **Budget:** 120 min ÷ 53 Q ≈ **2.3 min/question**. Aim for a **checkpoint every ~15 questions** (~34 min elapsed).
- **Single multiple-choice:** ~1.5–2 min. Read scenario → identify the trade-off being tested → eliminate → answer.
- **Multiple-response ("select all"):** ~2.5–3 min. Evaluate **each option independently** as true/false. **Don't stop at one correct answer** — under-selection is a designed trap.
- **Triage:** if a question exceeds ~3 min, **flag it, pick your best guess, and move on.** Return with leftover time. Never let one item eat three others' budget.

### ✂️ Process of Elimination for Claude API Questions

1. **Kill absolute-language options first** — "always / never / only" are usually wrong on a judgment exam.
2. **Kill the cost-blind option** — an answer that ignores token cost, caching, or batch is often the distractor.
3. **Kill the over-engineered option** — an autonomous agent where a deterministic workflow suffices.
4. **Kill the biggest-model reflex** — Opus when the budget calls for Sonnet/Haiku.
5. **Prefer qualified, trade-off-aware answers** — they mirror Anthropic's documentation tone.

### ✅ "Always / Never" Rules to Memorize

| Rule |
|---|
| **Always** provide `max_tokens` — it's required and caps **output**. |
| **Never** put a `system` role inside `messages[]` — `system` is top-level. |
| **Always** resend the full `messages[]` — the API is **stateless**. |
| **Never** let Claude execute a tool — **your code** runs it and returns a `tool_result`. |
| **Always** match `tool_use_id` on every `tool_result`. |
| **Always** bundle parallel `tool_result`s in **one** user message. |
| **Never** rely on prompt wording alone for strict JSON — use a **tool `input_schema`**. |
| **Always** pin a model version when reproducibility matters; aliases **float**. |
| **Never** use streaming for cost/throughput — that's the **batch** API's job. |
| **Never** rely on prompt instructions alone for security (prompt-injection defense is layered). |

### 🎭 Common Distractor Patterns (how wrong answers are built)

- **The plausible instinct** — reads "right" on gut feeling (use Opus, add "return JSON," force the tool).
- **The absolute** — technically-worded but says always/never/only.
- **The cost-blind** — correct-sounding but ignores spend/caching/batch.
- **The over-engineer** — agent/extra infra where a simple workflow wins.
- **The half-answer** — correct but incomplete on a "select all" item (under-selection).
- **The swap** — streaming↔batch, MCP↔custom tool, pin↔float, fast↔extended-thinking.

### 📋 Last-Minute Cheat Sheet (one-liners)

- **Messages API:** stateless; `system` is top-level; roles alternate; `max_tokens` required; check `stop_reason`.
- **Tool Use:** Claude *requests*, you *execute*; `tool_use_id` links result; parallel results → one user message; `tool_choice` controls forcing; error → `tool_result` with `is_error`.
- **Structured Output:** tool `input_schema` = most reliable; prefill `{` (re-attach it!); `enum` for classification; prompt-only JSON is weakest.
- **Streaming:** SSE events `message_start → content_block_delta → message_stop`; accumulate deltas; improves **perceived** latency (TTFB); **not** for cost/throughput (use batch).
- **Model Selection:** Haiku=cheap/fast, Sonnet=balanced default, Opus=hardest reasoning; pin versions for reproducibility; caching + batch cut cost; tune temperature **or** top_p.

### 📈 High-Probability Exam Topics (ranked by likely frequency)

1. **Messages API mechanics & statelessness** (Domain 1, 33.1%) — near-certain, multiple items.
2. **Model selection trade-offs (Opus/Sonnet/Haiku) + cost/caching/batch** (Domain 2, 16.8%) — very high.
3. **Tool use loop, `tool_choice`, parallel calls, MCP vs custom tools** (Domains 1 & 5) — high.
4. **Streaming vs batch trade-off & SSE handling** (Domain 1) — high.
5. **Structured output reliability (tool schema vs prompt)** (Domains 1 & 8) — moderate–high.
6. **Agents vs deterministic workflows** (Domain 3, 14.7%) — over-engineering traps everywhere.
7. **Prompt/context engineering, security (injection defense, least privilege)** (Domains 4 & 6) — moderate.

---

> **📌 Final mindset:** The CCDV-F rewards **precision and trade-off judgment**, not memorized facts. For every question, ask: *"What's the plausible-but-wrong instinct here, and what qualified, cost-aware, right-sized answer beats it?"* That single habit is worth more than any fact on this sheet.

*Built from the official CCDV-F Exam Guide blueprint. No leaked content — concepts and fresh scenarios only.*
