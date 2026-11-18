// Which of the optional use-case tabs the portal shows.
//
// Two tabs are demo-only: AI Governance and LLM Gateway both render plausible
// figures generated from the use-case slug rather than anything a broker
// reports. That is fine for a demo and wrong for an audience who will read them
// as real, so they are switchable.
//
// The generator writes the defaults below from ENABLE_GOVERNANCE_TAB and
// ENABLE_LLM_GATEWAY_TAB in the input prompt. The env vars override them at
// runtime, which is what makes a tab removable after handover without an edit:
// set NEXT_PUBLIC_ENABLE_GOVERNANCE_TAB=false and restart.
//
// A disabled tab keeps its component file. The tabs are conditionally rendered,
// not deleted, so nothing breaks if a flag is flipped back — and the two files
// together are a small part of the route's payload.

// Blank and unset both mean "use the baked default", so an empty line in .env
// behaves the same as a missing one. Anything else is read as a boolean, with
// the usual falsey spellings accepted because people type them.
function flag(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined || value.trim() === "") return fallback;
  return !/^(false|0|no|off)$/i.test(value.trim());
}

export const PORTAL_TABS = {
  governance: flag(process.env.NEXT_PUBLIC_ENABLE_GOVERNANCE_TAB, true),
  llmGateway: flag(process.env.NEXT_PUBLIC_ENABLE_LLM_GATEWAY_TAB, true),
};
