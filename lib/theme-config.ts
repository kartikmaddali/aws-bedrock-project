// Whitelabel portal definitions. Switching the portal swaps the `data-portal`
// attribute on the workspace root, which re-points the brand CSS variables
// defined in globals.css. This demonstrates how an Auth0 Custom Claim can drive
// runtime, multi-tenant UI whitelabeling.

export type PortalId = "watsco" | "apex"

export interface PortalTheme {
  id: PortalId
  /** Brand name shown in the header. */
  brand: string
  /** Short label for the selector. */
  label: string
  /** Two-letter monogram used in the logo tile. */
  monogram: string
  tagline: string
  /** AI agent welcome line, injected at runtime. */
  welcome: string
}

export const PORTALS: Record<PortalId, PortalTheme> = {
  watsco: {
    id: "watsco",
    brand: "AirFlow Supply Hub",
    label: "AirFlow Supply Hub",
    monogram: "WS",
    tagline: "Distribution-grade HVAC/R copilot",
    welcome:
      "Welcome to the AirFlow Supply Hub. I can pull live inventory, contractor pricing, and place bulk orders across 670+ distribution centers.",
  },
  apex: {
    id: "apex",
    brand: "Apex Co-Branded Portal",
    label: "Apex Co-Branded Portal",
    monogram: "AC",
    tagline: "Apex Cooling LLC — powered by AirFlow",
    welcome:
      "Apex Cooling field desk online. Carlos, I have your Platinum contract pricing and your crew's order history ready to go.",
  },
}

export const PORTAL_LIST = Object.values(PORTALS)
