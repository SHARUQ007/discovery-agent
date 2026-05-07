import type { Transcript } from '../types';

export function buildDiscoveryPrompt(transcripts: Transcript[], questionnaire: string): string {
  const transcriptBlock = transcripts
    .map(
      (transcript, index) => `Transcript ${index + 1}
Title: ${transcript.title}
Topic: ${transcript.topic}
Created: ${transcript.createdAt}
Detected Speakers: ${transcript.detectedSpeakers.join(', ') || 'Not detected'}

${transcript.cleanedContent || transcript.content}`,
    )
    .join('\n\n---\n\n');

  return `You are a senior strategy consultant operating as a Signal Discovery Agent.

Your job is to process SME interviews through the following 4-layer architecture:

Layer 1: Data Extractor
For each transcript:
- Convert raw conversation into structured text
- Detect speakers and roles
- Identify topic
- Extract process references
- Normalize terminology
Output:
- Clean interview summary
- SME role
- Key processes
- Tools/systems
- Discussion segments

Layer 2: Tagging Engine
For each transcript:
Create tags under:
- Role Tags
- Process Tags
- Tool/System Tags
- Pain Point Tags
- Root Cause Tags
- Impact Tags
- Opportunity Tags
- Capability Tags
Output:
- Structured tag table
- Source-backed evidence for each tag

Layer 3: Cross-Interview Pattern Analyzer
Across all interviews:
- Identify repeating bottlenecks
- Identify operational gaps
- Identify process dependencies
- Identify shared root causes
- Identify recurring capability gaps
- Compare similarities and differences across topics
Output:
- Cross-interview pattern map
- Strategic themes
- Industry comparison table

Layer 4: Signal Discovery Agent
Convert findings into consulting deliverables:
- Executive summary
- Opportunity-to-capability map
- Capability heatmap
- Value pool analysis
- Transformation roadmap
- Strategic recommendations
- 30/60/90 day action plan

Structured Questionnaire:
${questionnaire || '[No questionnaire provided]'}

Interview Transcripts:
${transcriptBlock}

Important Instructions:
- Do not merely summarize.
- Think like a senior strategy consultant.
- Identify what matters, what repeats, what causes friction, and what creates value.
- Make the output reusable for POVs, capability assessments, and transformation roadmaps.
- Use clean markdown tables extensively. Do not use HTML.
- Structure the output exactly like a consulting report with these sections:
  1. Executive Summary
  2. Interview Summary Table
  3. Source-Backed Tagging Table
  4. Cross-Interview Pattern Map
  5. Strategic Themes
  6. Opportunity-to-Capability Map
  7. Capability Heatmap
  8. Value Pool Analysis
  9. Transformation Roadmap
  10. Strategic Recommendations
  11. 30/60/90 Day Action Plan
- For Capability Heatmap, return a markdown table with columns: Capability | Current Signal | Heat. Use Heat values High, Medium, or Low.
- For Value Pool Analysis, return a markdown table with columns: Value Pool | Evidence | Business Impact | Priority. Use Priority values High, Medium, or Low.
- For Transformation Roadmap and 30/60/90 Day Action Plan, return markdown tables with clear horizons and actions.
- Keep the tone crisp, strategic, and consulting-ready.

Return the final output in clean markdown.`;
}
