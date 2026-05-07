import type { Transcript } from '../types';
import { buildExtractorPreview, extractProcessReferences } from './textProcessing';

const tagKeywords = {
  pain: ['delay', 'late', 'manual', 'fragmented', 'inconsistent', 'slow', 'miss', 'friction', 'break'],
  rootCause: ['different systems', 'spreadsheets', 'handoff', 'ownership', 'data access', 'unclear', 'email'],
  impact: ['cost', 'service', 'risk', 'experience', 'quality', 'complications', 'inventory', 'freight'],
  opportunity: ['automated', 'shared', 'single', 'standard', 'predictive', 'proactive', 'analytics', 'governance'],
  capability: ['workflow', 'control tower', 'analytics', 'governance', 'risk stratification', 'value tracking'],
};

function findMatches(content: string, keywords: string[]) {
  const lower = content.toLowerCase();
  return keywords.filter((keyword) => lower.includes(keyword));
}

function unique(values: string[]) {
  return Array.from(new Set(values)).filter(Boolean);
}

function topicRows(transcripts: Transcript[]) {
  return transcripts
    .map((transcript) => {
      const preview = buildExtractorPreview(transcript.cleanedContent, transcript.topic);
      const pain = findMatches(transcript.cleanedContent, tagKeywords.pain).slice(0, 3).join(', ') || 'Requires validation';
      const capabilities = findMatches(transcript.cleanedContent, tagKeywords.capability).slice(0, 3).join(', ') || 'Operating model clarity';

      return `| ${transcript.topic} | ${transcript.title} | ${preview.smeRole} | ${pain} | ${capabilities} |`;
    })
    .join('\n');
}

export function runDemoDiscoveryAgent(transcripts: Transcript[], questionnaire: string): string {
  const allContent = transcripts.map((transcript) => transcript.cleanedContent).join('\n\n');
  const topics = unique(transcripts.map((transcript) => transcript.topic));
  const processes = unique(transcripts.flatMap((transcript) => extractProcessReferences(transcript.cleanedContent)));
  const pains = findMatches(allContent, tagKeywords.pain);
  const rootCauses = findMatches(allContent, tagKeywords.rootCause);
  const impacts = findMatches(allContent, tagKeywords.impact);
  const opportunities = findMatches(allContent, tagKeywords.opportunity);
  const capabilities = findMatches(allContent, tagKeywords.capability);

  return `# Signal Discovery Agent Demo Output

## Executive Summary
Across ${transcripts.length} SME interview${transcripts.length === 1 ? '' : 's'}, the strongest signals point to fragmented workflows, manual reconciliation, inconsistent handoffs, and delayed visibility into operational risk. The opportunity is to convert dispersed interview findings into a capability-led transformation agenda focused on workflow clarity, data integration, proactive exception management, and measurable value realization.

## Layer 1: Data Extractor
| Topic | Transcript | Detected SME Role | Process References | Detected Speakers |
| --- | --- | --- | --- | --- |
${transcripts
  .map((transcript) => {
    const preview = buildExtractorPreview(transcript.cleanedContent, transcript.topic);
    return `| ${transcript.topic} | ${transcript.title} | ${preview.smeRole} | ${preview.processReferences.join(', ') || 'None detected'} | ${preview.speakers.join(', ') || 'Not detected'} |`;
  })
  .join('\n')}

## Layer 2: Tagging Engine
| Tag Category | Demo Tags |
| --- | --- |
| Role Tags | ${unique(transcripts.flatMap((transcript) => buildExtractorPreview(transcript.cleanedContent, transcript.topic).smeRole)).join(', ')} |
| Process Tags | ${processes.join(', ') || 'Workflow, handoff, monitoring'} |
| Tool/System Tags | CRM, ERP, EHR, LMS, spreadsheets, email, local systems where referenced |
| Pain Point Tags | ${pains.join(', ') || 'Manual work, delayed visibility, fragmented process'} |
| Root Cause Tags | ${rootCauses.join(', ') || 'Unclear ownership, disconnected data, inconsistent handoffs'} |
| Impact Tags | ${impacts.join(', ') || 'Cost, quality, risk, experience'} |
| Opportunity Tags | ${opportunities.join(', ') || 'Automation, standardization, analytics'} |
| Capability Tags | ${capabilities.join(', ') || 'Workflow orchestration, governance, insight generation'} |

## Layer 3: Cross-Interview Pattern Analyzer
| Topic | Interview | SME Role | Repeating Bottlenecks | Capability Gap |
| --- | --- | --- | --- | --- |
${topicRows(transcripts)}

## Strategic Themes
- Workflow fragmentation is the dominant cross-interview pattern.
- Data and system dispersion create delayed decisions and reactive escalation.
- Process ownership and handoff clarity are recurring operating model gaps.
- The highest-value opportunity is a shared signal layer that detects risk, prioritizes exceptions, and routes action.

## Layer 4: Signal Discovery Agent Deliverables
| Opportunity | Capability Required | Value Pool | Priority |
| --- | --- | --- | --- |
| Proactive exception detection | Integrated workflow analytics | Productivity and risk reduction | High |
| Standardized handoff model | Process governance and role clarity | Cycle time reduction | High |
| Source-backed operating insights | Tagging and evidence repository | Better transformation decisions | Medium |
| Reusable interview intelligence | Knowledge management and taxonomy | Faster consulting delivery | Medium |

## Capability Heatmap
| Capability | Current Signal | Heat |
| --- | --- | --- |
| Workflow orchestration | Repeated handoff and routing issues | High |
| Data integration | Multiple systems and spreadsheet workarounds | High |
| Governance | Ownership and approval friction | Medium |
| Analytics | Need for predictive and proactive visibility | High |
| Value tracking | Benefits need sharper measurement | Medium |

## Transformation Roadmap
| Horizon | Actions |
| --- | --- |
| 30 Days | Validate themes with SMEs, align taxonomy, define process ownership, select two priority bottlenecks. |
| 60 Days | Prototype signal dashboard, standardize handoffs, define capability metrics, establish governance cadence. |
| 90 Days | Scale reusable tagging model, quantify value pools, launch roadmap workstreams, package findings into POV artifacts. |

## Strategic Recommendations
- Treat interview data as reusable transformation intelligence, not one-off notes.
- Build capability priorities from repeated source-backed friction points.
- Use the questionnaire as a consistent evidence model across interviews.
- Focus executive messaging on value pools, operating constraints, and implementation sequencing.

## Questionnaire Applied
${questionnaire}

_Generated locally for demo purposes. No external AI service, API key, browser automation, or hidden website interaction was used._`;
}
