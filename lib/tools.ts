import type { ToolDefinition } from "./types"

// Ported from the original Express `server/src/config.ts`, with value ceilings
// added so the CIBA guardrail can trip on high-value actions.
export const TOOLS: ToolDefinition[] = [
  {
    id: "search_inventory",
    name: "Search Inventory",
    description:
      "Search AirFlow's vast product catalog for HVAC/R equipment and supplies, including real-time stock levels across all 670+ distribution centers.",
    scopes: ["inventory:read"],
    requiresApproval: false,
  },
  {
    id: "update_pricing",
    name: "Get Contractor Pricing",
    description:
      "Retrieve dynamic, contractor-specific pricing for any AirFlow product, factoring in volume discounts and loyalty tiers.",
    scopes: ["pricing:read"],
    requiresApproval: false,
  },
  {
    id: "process_order",
    name: "Place Bulk Order",
    description:
      "Initiate and process a bulk purchase order for HVAC equipment and supplies, including payment processing and order confirmation.",
    scopes: ["orders:write", "payments:charge"],
    requiresApproval: true,
    valueCeiling: 250000,
  },
  {
    id: "view_order_history",
    name: "View Order History",
    description:
      "Access a specific HVAC contractor's past purchase orders, including order details, shipping status, and invoices.",
    scopes: ["orders:read"],
    requiresApproval: false,
  },
  {
    id: "handle_return",
    name: "Process Return",
    description:
      "Facilitate the return of HVAC equipment or parts and initiate the refund process for a contractor.",
    scopes: ["returns:write", "refunds:process"],
    requiresApproval: true,
    valueCeiling: 50000,
  },
]

/** Actions above this USD amount trigger the Auth0 CIBA backchannel approval. */
export const CIBA_THRESHOLD_USD = 2500

export function getTool(toolId: string): ToolDefinition | undefined {
  return TOOLS.find((t) => t.id === toolId)
}
