# AWS Bedrock Agent Setup Guide

Follow these steps to create a Bedrock Agent wired to this HVAC Copilot app.
All steps use the AWS Console. Estimated time: ~20 minutes.

---

## Prerequisites

- AWS account with access to Amazon Bedrock in your target region (`us-east-1` recommended)
- Model access enabled: go to **Amazon Bedrock → Model access** and enable
  **Anthropic Claude Sonnet 3.5** (or 3.7)

---

## Step 1 — Create an IAM User and Policy

1. Go to **IAM → Users → Create user**
   - Username: `hvac-copilot-agent`
   - Access type: **Programmatic access**

2. Attach the following inline policy (replace `REGION` and `ACCOUNT_ID`):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeAgent",
        "bedrock:GetAgent",
        "bedrock:ListAgents"
      ],
      "Resource": "arn:aws:bedrock:REGION:ACCOUNT_ID:agent/*"
    }
  ]
}
```

3. After creating the user, go to **Security credentials → Create access key**
   - Select **Application running outside AWS**
   - Copy the **Access Key ID** and **Secret Access Key** into `.env.local`

---

## Step 2 — Create the Bedrock Agent

1. Go to **Amazon Bedrock → Agents → Create agent**

2. Fill in:
   - **Agent name**: `hvac-copilot`
   - **Description**: HVAC supply copilot for AirFlow contractors
   - **Agent resource role**: Create and use a new service role (auto-created)
   - **Model**: Anthropic Claude Sonnet 3.5 v2 (or Claude 3.7 Sonnet)

3. Paste the following as the **Agent instructions**:

```
You are the HVAC Copilot for AirFlow, a B2B supply-chain assistant for HVAC contractors.

You help contractors with:
- Searching live inventory across 670+ distribution centers
- Retrieving contractor-specific pricing with volume discounts
- Placing bulk equipment orders (requires approval for orders over $2,500)
- Viewing past order history and invoices
- Processing returns and refunds (requires approval)

The user's corporate org and loyalty tier are passed in session attributes
(org, tier). Address them by name when possible and apply their tier pricing.

When the user asks to place an order or process a return that will exceed $2,500,
call the appropriate tool and note that backchannel approval will be required.

Always be concise and action-oriented. Confirm actions before executing writes.
```

4. Click **Next** (skip Knowledge bases for now).

---

## Step 3 — Add an Action Group (Return Control)

Return Control lets the agent signal *which tool* it wants to call without
needing a Lambda function — your Next.js app receives the tool call and executes
it directly. This is the architecture this app uses.

1. Under **Action groups → Add**, fill in:
   - **Name**: `hvac-tools`
   - **Description**: Core HVAC supply-chain operations
   - **Action group type**: **Return control** ← important

2. Define the following **function schemas** (add each as a separate function):

### `search_inventory`
- **Description**: Search AirFlow's product catalog for HVAC/R equipment and supplies, including real-time stock levels across all distribution centers.
- **Parameters**:
  - `query` (string, required) — product name, SKU, or category to search for
  - `location` (string, optional) — regional hub or zip code to prioritize nearby stock

### `update_pricing`
- **Description**: Retrieve dynamic, contractor-specific pricing for any AirFlow product, factoring in volume discounts and loyalty tiers.
- **Parameters**:
  - `product_id` (string, required) — SKU or product identifier
  - `quantity` (integer, optional) — units for volume discount calculation

### `process_order`
- **Description**: Initiate and process a bulk purchase order for HVAC equipment. Requires step-up approval for orders over $2,500.
- **Parameters**:
  - `items` (string, required) — JSON array of `{ sku, quantity, unit_price }`
  - `shipping_address` (string, optional) — delivery address or job site

### `view_order_history`
- **Description**: Access a contractor's past purchase orders, shipment status, and invoices.
- **Parameters**:
  - `limit` (integer, optional) — number of recent orders to return (default 10)
  - `status_filter` (string, optional) — filter by status: pending, shipped, delivered

### `handle_return`
- **Description**: Facilitate a product return and initiate the refund process. Requires step-up approval.
- **Parameters**:
  - `order_id` (string, required) — original order ID to return against
  - `items` (string, required) — JSON array of `{ sku, quantity, reason }`

3. Click **Save and exit**.

---

## Step 4 — Prepare the Agent

1. Click **Prepare** (top-right). Wait for status to show **Prepared**.
2. You can test the agent in the **Test** panel on the right — try "Find 3-ton condensers".

---

## Step 5 — Create an Alias

1. Go to the **Aliases** tab → **Create alias**
   - **Alias name**: `production` (or `v1`)
   - **Associate a version**: Create a new version and associate it

2. Copy the **Alias ID** (format: `XXXXXXXXXX`) — this is `AWS_BEDROCK_AGENT_ALIAS_ID`.
3. Copy the **Agent ID** from Agent overview — this is `AWS_BEDROCK_AGENT_ID`.

> ⚠️ Do **not** use `TSTALIASID` as the alias. That is the test alias and
> does not support session attributes required for identity forwarding.

---

## Step 6 — Populate `.env.local`

```bash
cp .env.local.example .env.local
```

Edit `.env.local` with the values collected above, then verify connectivity:

```bash
pnpm dev
# In another terminal or browser:
curl http://localhost:3000/api/bedrock/health
# Expected: {"status":"ok","region":"us-east-1","agentId":"XXXXXXXXXX"}
```

---

## Optional — Add Bedrock Guardrails

1. Go to **Amazon Bedrock → Guardrails → Create guardrail**
2. Configure content filters, denied topics, or PII redaction as needed
3. Copy the **Guardrail ID** and set in `.env.local`:
   ```
   AWS_BEDROCK_GUARDRAIL_ID=<id>
   AWS_BEDROCK_GUARDRAIL_VERSION=DRAFT
   ```
   The chat route will automatically attach the guardrail to every agent invocation.

---

## Troubleshooting

| Error | Likely cause | Fix |
|-------|-------------|-----|
| `ResourceNotFoundException` | Wrong Agent ID or Alias ID | Double-check both IDs in the console |
| `AccessDeniedException` | IAM policy missing `bedrock:InvokeAgent` | Re-attach the policy from Step 1 |
| `ThrottlingException` | Too many requests | Bedrock has per-account rate limits; retry with backoff |
| Agent replies but no tool calls | Action group not saved/prepared | Re-prepare the agent after any action group change |
| `TSTALIASID` in alias | Using the test alias | Create a real alias (Step 5) |
