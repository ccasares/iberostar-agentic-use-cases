export interface AgentNode {
  name: string;
  label: string;
  platform: string;
  protocol: string;
}

export interface McpNode {
  name: string;
  label: string;
  transport: string;
  // Upstream MuleSoft APIs this MCP server rolls up (mule-he use cases). `apis`
  // is the list named in the README (may be truncated); `apiCount` is the full
  // rolled-up total.
  apis: string[];
  apiCount: number;
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  examples: string[];
  tags: string[];
}

export interface ExampleQuery {
  label: string;
  query: string;
}

export interface AgentNetwork {
  brokerName: string;
  brokerLabel: string;
  brokerDescription: string;
  brokerUrlTemplate: string;
  provider: { organization?: string; url?: string };
  model: string;
  instructions: string[];
  skills: Skill[];
  agents: AgentNode[];
  mcpServers: McpNode[];
}

export interface UseCase {
  slug: string;
  title: string;
  shortDescription: string;
  persona: string;
  businessPain: string;
  orchestration: string;
  exampleQueries: ExampleQuery[];
  description: string;
  purpose: string;
  readme: string;
  network: AgentNetwork | null;
  tags: string[];
}

export interface UseCasesPayload {
  generatedAt: string;
  count: number;
  useCases: UseCase[];
}

export interface UseCaseStats {
  views: number;
  likes: number;
}
