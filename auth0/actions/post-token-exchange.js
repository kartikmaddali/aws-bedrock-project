/**
 * Auth0 Action — Enrich OBO Token with AgentCore Delegation Context
 * Trigger: Machine to Machine (credentials-exchange)
 *
 * When AWS Bedrock AgentCore performs an RFC 8693 token exchange, this action
 * enriches the issued access token with the full agent delegation chain so
 * every downstream resource can verify exactly who is acting on whose behalf.
 *
 * HOW TO INSTALL:
 * 1. Auth0 Dashboard → Actions → Library → Create Action
 * 2. Trigger: Machine to Machine
 * 3. Name: "AgentCore OBO Enrichment"
 * 4. Paste this file, click Deploy
 * 5. Auth0 Dashboard → Actions → Flows → Machine to Machine → drag action in
 */

exports.onExecuteCredentialsExchange = async (event, api) => {
  // Only enrich RFC 8693 token exchange requests — skip plain client_credentials.
  const grantType = event.request.body.grant_type;
  if (grantType !== "urn:ietf:params:oauth:grant-type:token-exchange") return;

  // AgentCore context passed by the app server in the exchange request body.
  const actorToken   = event.request.body.actor_token;          // CIMD URL — agent's Auth0 identity
  const agentId      = event.request.body["urn:amazon:bedrock:agent_id"];
  const aliasId      = event.request.body["urn:amazon:bedrock:alias_id"];
  const sessionId    = event.request.body["urn:amazon:bedrock:session_id"];
  const actionGroup  = event.request.body["urn:amazon:bedrock:action_group"];

  if (!actorToken && !agentId) return; // Not an AgentCore exchange — skip.

  // Build the enriched `act` claim representing the full delegation chain:
  //   sub   = the user delegating authority (from subject_token)
  //   act   = the agent acting on behalf of the user + full AgentCore context
  const actClaim = {
    sub: actorToken || event.client.client_id,
    ...(agentId     && { "urn:amazon:bedrock:agent_id":     agentId     }),
    ...(aliasId     && { "urn:amazon:bedrock:alias_id":     aliasId     }),
    ...(sessionId   && { "urn:amazon:bedrock:session_id":   sessionId   }),
    ...(actionGroup && { "urn:amazon:bedrock:action_group": actionGroup }),
    "urn:amazon:bedrock:delegated": true,
    issued_at: new Date().toISOString(),
  };

  // Write the enriched act claim and a delegation flag into the access token.
  api.accessToken.setCustomClaim("act", actClaim);
  api.accessToken.setCustomClaim("urn:amazon:bedrock:delegated", true);
};
