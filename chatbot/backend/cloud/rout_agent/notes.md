# ADK Agent Deployment Notes

### Project: DolfinAI — `rout_agent`

### Platform: Gemini Enterprise Agent Platform (formerly Vertex AI) — Agent Engine

---

## Working Versions (do not change these without testing)

```
google-adk>=1.0.0,<2.0.0          # pinned — aiplatform requires <2.0.0
google-cloud-aiplatform[adk,agent-engines]>=1.112
google-genai>=1.75.0
python>=3.11,<3.14
```

> ⚠️ Do NOT install the standalone `vertexai` package. It is legacy and pins
> `google-cloud-aiplatform==1.71.1` which breaks everything.

> ⚠️ Do NOT upgrade `google-adk` to 2.x until `google-cloud-aiplatform` explicitly
> supports it.

---

## Project Structure (strict — ADK enforces this)

```
backend/cloud/
└── rout_agent/
    ├── __init__.py        ← must contain exactly: from . import agent
    ├── agent.py           ← must define: root_agent = Agent(...)
    ├── .env               ← environment variables
    └── requirements.txt   ← pip deps for the cloud deployment environment
```

**Rules that cannot be broken:**

- Agent variable must be named `root_agent` — not `agent`, not `financial_agent`, not anything else
- `__init__.py` must use a relative import: `from . import agent`
- `requirements.txt` must exist inside the agent folder
- All `adk` and `gcloud` commands must be run from `backend/cloud/`, not from inside `rout_agent/`

---

## Environment Variables (`.env`)

```dotenv
GOOGLE_GENAI_USE_VERTEXAI=TRUE
GOOGLE_CLOUD_PROJECT=dolfin-ai-qexs
GOOGLE_CLOUD_LOCATION=us-central1
```

> ⚠️ Use `TRUE` not `1` — some SDK versions are strict about this.

---

## GCP Project Setup

**Project ID:** `dolfin-ai-qexs`
**Region:** `us-central1`
**Staging bucket:** `gs://dolfin-ai-adk-staging`
**Billing account:** linked and activated (full account, not free trial)

### APIs that must be enabled

```bash
gcloud services enable \
  aiplatform.googleapis.com \
  storage.googleapis.com \
  cloudresourcemanager.googleapis.com
```

### IAM roles required

```bash
gcloud projects add-iam-policy-binding dolfin-ai-qexs \
  --member="user:dickson.ankamah8@gmail.com" \
  --role="roles/aiplatform.user"

gcloud projects add-iam-policy-binding dolfin-ai-qexs \
  --member="user:dickson.ankamah8@gmail.com" \
  --role="roles/storage.objectAdmin"
```

---

## Authentication (run once per machine / session)

```bash
# For gcloud CLI
gcloud auth login

# For Python SDK (Application Default Credentials) — required separately
gcloud auth application-default login

# Confirm correct project is set
gcloud config set project dolfin-ai-qexs
gcloud config get-value project
```

> ⚠️ Both auth commands are required. `gcloud auth login` alone is not enough —
> Python code needs ADC (`application-default login`) to call Vertex AI.

---

## Commands

### Test locally

```bash
# From backend/cloud/
uv run adk run rout_agent/
```

### Deploy to Agent Engine

```bash
# From backend/cloud/
uv run adk deploy agent_engine \
  --project=dolfin-ai-qexs \
  --region=us-central1 \
  --display_name="dolfinai-rout-agent" \
  --staging_bucket=gs://dolfin-ai-adk-staging \
  rout_agent
```

> Deployment takes 5–8 minutes. A blinking cursor is normal — do not cancel.

### On Windows (single line)

```bash
uv run adk deploy agent_engine --project=dolfin-ai-qexs --region=us-central1 --display_name="dolfinai-rout-agent" --staging_bucket=gs://dolfin-ai-adk-staging rout_agent
```

---

## Deployed Agent

After successful deployment you'll see:

```
AgentEngine created. Resource name:
projects/972588770023/locations/us-central1/reasoningEngines/XXXXXXXXXXXXXXXXX
```

**Save the resource name here:**

```
projects/972588770023/locations/us-central1/reasoningEngines/
________________________________________________________________
                                                               ^
                                                    paste ID here
```

### Query the deployed agent

```python
import asyncio
import vertexai

client = vertexai.Client(
    project="dolfin-ai-qexs",
    location="us-central1",
)

remote_agent = client.agent_engines.get(
    name="projects/972588770023/locations/us-central1/reasoningEngines/RESOURCE_ID"
)

async def query():
    async for event in remote_agent.async_stream_query(
        user_id="test-user-1",
        message="What is the market forecast for AAPL?",
    ):
        print(event)

asyncio.run(query())
```

### View in console

```
https://console.cloud.google.com/vertex-ai/agents?project=dolfin-ai-qexs
```

---

## Troubleshooting

| Error                                | Cause                                                      | Fix                                                              |
| ------------------------------------ | ---------------------------------------------------------- | ---------------------------------------------------------------- |
| `root_agent not found`               | Variable named wrong                                       | Rename to `root_agent` in `agent.py`                             |
| `name 'Agent' is not defined`        | Missing import                                             | Add `from google.adk.agents import Agent` at top of `agent.py`   |
| `404 NOT_FOUND` on model             | Free trial restriction or billing not active               | Activate full account at console.cloud.google.com/billing        |
| `vertexai has no attribute 'Client'` | `google-cloud-aiplatform` too old                          | Run `uv add "google-cloud-aiplatform[agent_engines,adk]>=1.112"` |
| `No solution found` in uv            | Version conflict — usually `google-adk>=2.x` vs aiplatform | Pin `google-adk>=1.0.0,<2.0.0` in `pyproject.toml`               |
| `vertexai` conflict                  | Legacy standalone `vertexai` package installed             | Run `uv remove vertexai`                                         |
| `ADC credentials error`              | Only ran `gcloud auth login`                               | Also run `gcloud auth application-default login`                 |
| uv resolves for Python 3.14          | No upper Python bound in `pyproject.toml`                  | Set `requires-python = ">=3.11,<3.14"`                           |

---

## Key Lessons

1. **Read tracebacks bottom-up** — the actual error is always the last 2–3 lines
2. **Test locally with `adk run` before every deploy** — catches 90% of issues instantly
3. **Never install the standalone `vertexai` package** — use `google-cloud-aiplatform` only
4. **Both auth commands are always required** — CLI auth ≠ ADC auth
5. **Free trial blocks Vertex AI model endpoints** — activate full account (credits carry over)
6. **ADK naming conventions are strict** — `root_agent` and `from . import agent` are not optional
7. **Pin dependency versions early** — loose constraints cause conflicts later

---

## Platform Naming Reference

Google has rebranded multiple times. These all refer to the same thing:

| Old name                | New name                                        |
| ----------------------- | ----------------------------------------------- |
| Vertex AI               | Gemini Enterprise Agent Platform                |
| Vertex AI Agent Builder | Agent Platform                                  |
| Vertex AI Agent Engine  | Agent Engine (under Agent Runtime)              |
| `reasoning_engines`     | Still used internally in SDK and resource names |

> The Python SDK still uses `vertexai.*` imports and `reasoningEngines` in resource names.
> Don't let the new console branding confuse you — the code is the same.
