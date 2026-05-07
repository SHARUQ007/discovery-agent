import type { Transcript } from '../types';
import { cleanTranscript, detectSpeakers } from './textProcessing';

export const defaultQuestionnaire = `- Who are the roles involved in the process?
- What pain points were discussed?
- What are the root causes of these pain points?
- Which tools/systems are currently used?
- What processes are followed today?
- What business impact do these issues create?
- What opportunities for improvement exist?
- What capabilities are missing today?`;

const samples = [
  {
    title: 'Education - Digital Transformation in Higher Education',
    topic: 'Education' as const,
    content: `Transcript 1. SME Interview - Education
Topic
Digital Transformation in Higher Education

Interviewer: Can you walk me through the biggest operational challenges your institution currently faces?
SME - Dean of Academic Operations: One of our biggest issues is fragmentation. Student information exists across multiple systems - admissions, LMS platforms, attendance software, finance systems - and none of them communicate effectively.
Faculty members also rely heavily on manual coordination. Even simple workflows like curriculum updates or accreditation preparation require significant email back-and-forth.

Interviewer: Where do delays usually happen?
SME: Approvals and reporting. For example, when a department proposes curriculum changes, the process goes through academic committees, compliance teams, and external accreditation mapping.
Tracking status becomes difficult because ownership changes frequently.

Interviewer: Are there any recurring student pain points?
SME: Students struggle with visibility. They often don't know:
- graduation eligibility status
- pending documentation
- academic progression risks
- placement readiness
Most of this information exists somewhere internally, but it's not centralized.

Interviewer: How are decisions currently made?
SME: Mostly reactive. Data exists, but it's not synthesized into actionable insights.
We spend more time gathering reports than interpreting them.`
  },
  {
    title: 'Supply Chain - Visibility & Operational Bottlenecks',
    topic: 'Supply Chain' as const,
    content: `Transcript 2. SME Interview - Supply Chain
Topic
Supply Chain Visibility & Operational Bottlenecks

Interviewer: What creates the most operational uncertainty in your supply chain?
SME - Regional Supply Chain Director: Visibility gaps. Inventory data, shipment tracking, supplier communication, and warehouse systems are all partially disconnected.
We often identify disruptions after they've already impacted delivery timelines.

Interviewer: Where do you see the highest inefficiencies?
SME: Cross-functional coordination.
Procurement, logistics, warehouse operations, and demand planning all operate with different assumptions and KPIs.
A delay at one node propagates downstream, but nobody sees the full chain early enough.

Interviewer: How are disruptions currently managed?
SME: Mostly through escalation calls and spreadsheets.
Teams manually consolidate updates from carriers, suppliers, and internal systems.

Interviewer: What about forecasting?
SME: Forecasting accuracy fluctuates heavily during seasonal demand spikes.
There's limited real-time adaptation.`
  },
  {
    title: 'AI - Enterprise Adoption of Agentic AI Systems',
    topic: 'Artificial Intelligence & Agentic AI' as const,
    content: `Transcript 3. SME Interview - Artificial Intelligence & Agentic AI
Topic
Enterprise Adoption of Agentic AI Systems

Interviewer: How are organizations currently approaching Agentic AI adoption?
SME - AI Transformation Lead: Most organizations are still experimenting.
There's excitement around autonomous workflows, but enterprises struggle with orchestration, governance, and trust.

Interviewer: What concerns leadership teams most?
SME: Control and explainability.
Leaders worry about:
- unpredictable agent behavior
- hallucinations
- compliance risks
- lack of auditability
Especially in regulated industries.

Interviewer: Where do you see the strongest use cases?
SME: Internal operations first.
Things like:
- enterprise search
- workflow coordination
- document synthesis
- operational copilots
- discovery acceleration
Agentic systems work best when grounded in organizational context.

Interviewer: What blocks scaling?
SME: Knowledge fragmentation.
Agents are only as effective as the organizational context they can access.
Most enterprise knowledge is unstructured and scattered across conversations, documents, and tribal expertise.`
  },
  {
    title: 'Diabetes Treatment - Long-Term Diabetes Management',
    topic: 'Diabetes Treatment' as const,
    content: `Transcript 4. SME Interview - Diabetes Treatment
Topic
Challenges in Long-Term Diabetes Management

Interviewer: What are the biggest challenges in diabetes care today?
SME - Endocrinologist: Consistency and adherence.
Most patients understand what they should do, but maintaining long-term behavioral change is extremely difficult.

Interviewer: What causes treatment inconsistency?
SME: Diabetes management is continuous.
Patients must constantly balance:
- medication
- nutrition
- physical activity
- stress
- sleep
- glucose monitoring
The burden becomes mentally exhausting.

Interviewer: Where do healthcare systems struggle?
SME: Continuous monitoring and personalization.
Most interventions happen during periodic consultations, but patient behavior fluctuates daily.
We lack real-time behavioral visibility.

Interviewer: What role could AI play?
SME: Personalized intervention and predictive care.
AI could help detect:
- adherence risks
- glucose instability patterns
- behavioral decline
- lifestyle triggers
before complications escalate.`
  },
  {
    title: 'Cancer Research - Operational & Data Challenges',
    topic: 'Cancer Research' as const,
    content: `Transcript 5. SME Interview - Cancer Research
Topic
Operational & Data Challenges in Cancer Research

Interviewer: What slows down cancer research the most operationally?
SME - Oncology Research Scientist: Data fragmentation and research coordination.
Clinical data, genomic data, imaging, and treatment outcomes often exist across disconnected repositories.
Integrating them for meaningful analysis is extremely difficult.

Interviewer: How does that impact research speed?
SME: Researchers spend enormous time preparing datasets instead of conducting analysis.
Even identifying suitable cohorts for studies can take weeks.

Interviewer: What are the biggest collaboration challenges?
SME: Standardization.
Different institutions use different data structures, annotation methods, and reporting standards.
This creates interoperability problems.

Interviewer: Where do you see AI helping most?
SME: Pattern identification and research acceleration.
Especially:
- biomarker discovery
- treatment response prediction
- literature synthesis
- trial matching
- multi-modal analysis
But data quality remains the bottleneck.`
  },
];

export function getSampleTranscripts(): Transcript[] {
  const now = new Date().toISOString();
  return samples.map((sample, index) => {
    const cleanedContent = cleanTranscript(sample.content);
    return {
      id: `sample-${Date.now()}-${index}`,
      title: sample.title,
      topic: sample.topic,
      content: sample.content,
      cleanedContent,
      detectedSpeakers: detectSpeakers(cleanedContent),
      createdAt: now,
    };
  });
}
