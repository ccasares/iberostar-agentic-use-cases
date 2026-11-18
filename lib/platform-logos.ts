// Maps an agent "platform" string (free text from the agent-network.yaml, which
// includes some typos/variants) to a brand logo under /public/logos. Returns
// null when no confident match is found, so the UI can fall back to a generic
// icon. Rules are ordered: the first match wins, so more specific brands
// (e.g. Gemini) must come before broader ones (e.g. Google).
const LOGO_RULES: { test: RegExp; logo: string; label: string }[] = [
  { test: /agentforce|salesforce/, logo: "salesforce", label: "Agentforce" },
  { test: /gemini/, logo: "gemini", label: "Google Gemini" },
  { test: /vertex/, logo: "google", label: "Google Vertex AI" },
  { test: /google|(\b|^)adk(\b|$)/, logo: "google", label: "Google ADK" },
  { test: /bedrock/, logo: "aws", label: "Amazon Bedrock" },
  { test: /agentcore/, logo: "aws", label: "Amazon AgentCore" },
  { test: /aws|amazon/, logo: "aws", label: "AWS" },
  { test: /copilot/, logo: "microsoft", label: "Microsoft Copilot" },
  { test: /azure|foundry/, logo: "azure", label: "Azure AI Foundry" },
  { test: /micr?o?soft/, logo: "microsoft", label: "Microsoft" },
  { test: /databricks/, logo: "databricks", label: "Databricks" },
  { test: /snowflake/, logo: "snowflake", label: "Snowflake" },
  { test: /servicenow/, logo: "servicenow", label: "ServiceNow" },
  { test: /langchain/, logo: "langchain", label: "LangChain" },
  { test: /langflow/, logo: "langflow", label: "Langflow" },
  { test: /l[la]ma\s*index|llamaindex/, logo: "llamaindex", label: "LlamaIndex" },
  { test: /anthropic|claude/, logo: "anthropic", label: "Anthropic" },
  { test: /openai|gpt/, logo: "openai", label: "OpenAI" },
  { test: /mulesoft/, logo: "mulesoft", label: "MuleSoft" },
  { test: /jira|atlassian/, logo: "jira", label: "Jira" },
];

export interface PlatformBrand {
  logo: string | null;
  label: string;
}

export function platformBrand(platform: string | undefined | null): PlatformBrand {
  const raw = (platform || "").trim();
  if (!raw) return { logo: null, label: "Agent" };
  const normalized = raw.toLowerCase();
  for (const rule of LOGO_RULES) {
    if (rule.test.test(normalized)) {
      return { logo: `/logos/${rule.logo}.png`, label: rule.label };
    }
  }
  // Unknown platform: show the original text, no logo.
  return { logo: null, label: raw };
}

export const MCP_LOGO = "/logos/mcp.png";
export const BROKER_LOGO = "/logos/mulesoft.png";
