import { useCallback } from 'react'
import type { Message } from './ChatMessages'

export interface ChatSession {
  id: string
  memberKey: string
  memberName: string
  date: string
  preview: string
  summary: string
  favorited?: boolean
  messages: Message[]
}

const STORAGE_KEY = 'haven-chat-history-v4'

/** Infers a short AI-style summary from the conversation content */
export function generateSummary(messages: Message[]): string {
  const text = messages.map(m => m.content).join(' ').toLowerCase()
  const userMsgs = messages.filter(m => m.role === 'user').map(m => m.content.toLowerCase())
  const msgCount = userMsgs.length

  const has = (...terms: string[]) => terms.some(t => text.includes(t))

  if (has('medication', 'prescription', 'drug', 'metformin', 'lisinopril', 'atorvastatin'))
    return msgCount > 1
      ? 'Went over current medications and talked through any concerns'
      : 'Checked what medications this member is on'

  if (has('care gap', 'hba1c', 'hedis', 'eye exam', 'foot exam', 'a1c'))
    return msgCount > 1
      ? 'Looked into open care gaps and dug into the HbA1c test status'
      : 'Pulled up care gaps that still need to be closed'

  if (has('risk level', 'risk score', 'stratification', 'risk factor'))
    return 'Checked the member\'s risk level and what\'s driving it'

  if (has('care plan', 'goal', 'intervention', 'weight monitoring'))
    return msgCount > 1
      ? 'Went through the care plan and checked in on how things are going'
      : 'Looked at the care plan goals and what\'s currently active'

  if (has('eligib', 'service', 'benefit', 'program', 'transportation', 'home health'))
    return 'Looked up what services and programs this member qualifies for'

  if (has('hospitalization', 'admission', 'ed visit', 'emergency', 'discharge'))
    return 'Checked recent hospital visits and ER use'

  if (has('assessment', 'survey', 'screener', 'phq', 'sdoh'))
    return 'Went over recent assessments and member responses'

  if (has('diagnos', 'condition', 'diabetes', 'chf', 'heart failure', 'hypertension'))
    return 'Talked through the member\'s conditions and how they\'re being managed'

  if (has('claim', 'billing', 'cost', 'utilization'))
    return 'Looked at claims and how often the member is using services'

  if (has('appointment', 'visit', 'follow-up', 'schedule', 'pcp'))
    return 'Checked upcoming appointments and next steps for care'

  // Fallback: clean up the first user message into a sentence
  const first = messages.find(m => m.role === 'user')?.content ?? ''
  const cleaned = first.replace(/^(what|tell me|can you|could you|show me)\s+/i, '').replace(/\?$/, '')
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1, 90)
}

/** Seed data so history feels populated on first load */
const SEED_SESSIONS: ChatSession[] = [
  {
    id: 'seed-1',
    memberKey: 'jackson-thomas',
    memberName: 'Jackson Thomas',
    date: '2026-04-08T10:12:00.000Z',
    preview: 'Did Jackson make it to his last PCP appointment?',
    summary: 'Checked upcoming appointments and next steps for care',
    messages: [
      { id: 'sx-u1', role: 'user', content: 'Did Jackson make it to his last PCP appointment?' },
      { id: 'sx-a1', role: 'assistant', content: 'Jackson Thomas had a scheduled PCP visit on 04/02/2026 with Dr. Sarah Chen. The visit was marked as completed. A follow-up has been set for 07/01/2026.' },
    ],
  },
  {
    id: 'seed-1b',
    memberKey: 'jackson-thomas',
    memberName: 'Jackson Thomas',
    date: '2026-04-07T14:32:00.000Z',
    preview: 'What medications is Jackson currently on?',
    summary: 'Checked what medications this member is on',
    messages: [
      { id: 's1-u1', role: 'user', content: 'What medications is Jackson currently on?' },
      { id: 's1-a1', role: 'assistant', content: 'Jackson Thomas is currently prescribed:\n\n• Metformin 500mg – twice daily\n• Lisinopril 10mg – once daily\n• Atorvastatin 20mg – once daily at bedtime\n\nLast medication reconciliation: 03/15/2026.' },
    ],
  },
  {
    id: 'seed-2',
    memberKey: 'jackson-thomas',
    memberName: 'Jackson Thomas',
    date: '2026-04-05T09:15:00.000Z',
    preview: 'What are the open care gaps for this member?',
    summary: 'Looked into open care gaps and dug into the HbA1c test status',
    messages: [
      { id: 's2-u1', role: 'user', content: 'What are the open care gaps for this member?' },
      { id: 's2-a1', role: 'assistant', content: 'Jackson Thomas has the following open care gaps:\n\n• HbA1c test overdue (last completed 8 months ago)\n• Annual diabetic eye exam not completed this year\n• Foot exam not documented in the past 12 months' },
      { id: 's2-u2', role: 'user', content: 'Tell me more about the HbA1c gap.' },
      { id: 's2-a2', role: 'assistant', content: "Last HbA1c result was 7.8% on 08/12/2025 (target: <7.0%). HEDIS measure requires a test within 12 months. Gap has been open since February 2026.\n\nRecommended action: schedule a lab order through the member's PCP, Dr. Sarah Chen." },
    ],
  },
  {
    id: 'seed-3',
    memberKey: 'jackson-thomas',
    memberName: 'Jackson Thomas',
    date: '2026-03-28T11:05:00.000Z',
    preview: "What is Jackson's current risk level?",
    summary: "Checked the member's risk level and what's driving it",
    messages: [
      { id: 's3-u1', role: 'user', content: "What is Jackson's current risk level?" },
      { id: 's3-a1', role: 'assistant', content: 'Jackson Thomas is classified as Medium Risk (Level 2) based on stratification completed 03/01/2026.\n\nKey contributing factors:\n• Uncontrolled Type 2 Diabetes (HbA1c 7.8%)\n• 2 ED visits in the past 6 months\n• Low medication adherence score (68%)' },
    ],
  },
  {
    id: 'seed-4',
    memberKey: 'maria-rivera',
    memberName: 'Maria Rivera',
    date: '2026-04-06T16:20:00.000Z',
    preview: "What is Maria's care plan status?",
    summary: 'Went through the care plan and checked in on how things are going',
    messages: [
      { id: 's4-u1', role: 'user', content: "What is Maria's care plan status?" },
      { id: 's4-a1', role: 'assistant', content: "Maria Rivera's care plan was last updated 04/01/2026.\n\n• Goal: Reduce CHF hospitalizations – In Progress\n• Intervention: Daily weight monitoring – Active\n• Intervention: Cardiologist follow-up 04/22/2026 – Pending\n• Goal: Medication adherence >80% – Partially Met (74%)" },
    ],
  },
  {
    id: 'seed-5',
    memberKey: 'maria-rivera',
    memberName: 'Maria Rivera',
    date: '2026-04-03T10:45:00.000Z',
    preview: "What services is Maria eligible for?",
    summary: 'Looked up what services and programs this member qualifies for',
    messages: [
      { id: 's5-u1', role: 'user', content: "What services is Maria eligible for?" },
      { id: 's5-a1', role: 'assistant', content: "Based on Maria Rivera's current eligibility, she qualifies for:\n\n• Disease Management Program – Congestive Heart Failure\n• Telephonic Care Management\n• Transportation Assistance (non-emergency medical)\n• Home Health Aide (up to 20 hrs/week)\n• Cardiac Rehabilitation (pending prior auth)" },
    ],
  },
  {
    id: 'seed-6',
    memberKey: 'jackson-thomas',
    memberName: 'Jackson Thomas',
    date: '2026-03-21T13:44:00.000Z',
    preview: 'Has Jackson had any ER visits recently?',
    summary: 'Checked recent hospital visits and ER use',
    messages: [
      { id: 's6-u1', role: 'user', content: 'Has Jackson had any ER visits recently?' },
      { id: 's6-a1', role: 'assistant', content: 'Jackson Thomas had 2 ED visits in the past 6 months:\n\n• 02/14/2026 – Chief complaint: hyperglycemia. Discharged same day.\n• 11/30/2025 – Chief complaint: chest pain (ruled out cardiac). Admitted overnight, discharged 12/01/2025.' },
    ],
  },
  {
    id: 'seed-7',
    memberKey: 'jackson-thomas',
    memberName: 'Jackson Thomas',
    date: '2026-03-15T09:30:00.000Z',
    preview: 'What assessments have been completed for Jackson?',
    summary: 'Went over recent assessments and member responses',
    messages: [
      { id: 's7-u1', role: 'user', content: 'What assessments have been completed for Jackson?' },
      { id: 's7-a1', role: 'assistant', content: 'The following assessments are on file for Jackson Thomas:\n\n• Health Risk Assessment – Completed 01/10/2026\n• PHQ-9 (Depression Screen) – Score: 6 (mild), completed 01/10/2026\n• Social Determinants of Health (SDOH) – Completed 01/10/2026\n• Diabetes Self-Management Assessment – Completed 11/05/2025' },
    ],
  },
  {
    id: 'seed-8',
    memberKey: 'jackson-thomas',
    memberName: 'Jackson Thomas',
    date: '2026-03-10T15:20:00.000Z',
    preview: "What's Jackson's diagnosis history?",
    summary: "Talked through the member's conditions and how they're being managed",
    messages: [
      { id: 's8-u1', role: 'user', content: "What's Jackson's diagnosis history?" },
      { id: 's8-a1', role: 'assistant', content: "Jackson Thomas's active diagnoses include:\n\n• Type 2 Diabetes Mellitus (E11.9) – Primary, uncontrolled\n• Essential Hypertension (I10)\n• Hyperlipidemia (E78.5)\n• Mild depressive episode (F32.0) – noted on last assessment" },
    ],
  },
  {
    id: 'seed-9',
    memberKey: 'jackson-thomas',
    memberName: 'Jackson Thomas',
    date: '2026-03-03T11:00:00.000Z',
    preview: 'What does his care plan look like right now?',
    summary: 'Looked at the care plan goals and what\'s currently active',
    messages: [
      { id: 's9-u1', role: 'user', content: 'What does his care plan look like right now?' },
      { id: 's9-a1', role: 'assistant', content: "Jackson's care plan was last updated 02/20/2026.\n\nActive goals:\n• Improve HbA1c to below 7.0% by 06/2026\n• Increase medication adherence to >80%\n• Reduce ED visits to 0 in next 6 months\n\nActive interventions:\n• Monthly telephonic care management check-ins\n• Diabetes education referral (pending)\n• PCP coordination for lab orders" },
    ],
  },
  {
    id: 'seed-10',
    memberKey: 'jackson-thomas',
    memberName: 'Jackson Thomas',
    date: '2026-02-24T14:05:00.000Z',
    preview: 'Is Jackson enrolled in any disease management programs?',
    summary: 'Looked up what services and programs this member qualifies for',
    messages: [
      { id: 's10-u1', role: 'user', content: 'Is Jackson enrolled in any disease management programs?' },
      { id: 's10-a1', role: 'assistant', content: 'Jackson Thomas is currently enrolled in:\n\n• Diabetes Disease Management Program – Active since 09/2025\n• Telephonic Care Management – Active\n\nHe was referred to a Diabetes Self-Management Education (DSME) program in January but has not yet enrolled.' },
    ],
  },
  {
    id: 'seed-11',
    memberKey: 'jackson-thomas',
    memberName: 'Jackson Thomas',
    date: '2026-02-18T10:45:00.000Z',
    preview: 'How has his medication adherence been?',
    summary: 'Went over current medications and talked through any concerns',
    messages: [
      { id: 's11-u1', role: 'user', content: 'How has his medication adherence been?' },
      { id: 's11-a1', role: 'assistant', content: "Jackson's medication adherence score is currently 68%, which is below the 80% target.\n\nMetformin PDC: 71%\nLisinopril PDC: 65%\nAtorvastatin PDC: 69%\n\nHis last pharmacy fill was 03/08/2026. He has had 2 gaps in fill history over the past 6 months." },
    ],
  },
  {
    id: 'seed-12',
    memberKey: 'jackson-thomas',
    memberName: 'Jackson Thomas',
    date: '2026-02-10T09:15:00.000Z',
    preview: 'What are his latest claims?',
    summary: 'Looked at claims and how often the member is using services',
    messages: [
      { id: 's12-u1', role: 'user', content: 'What are his latest claims?' },
      { id: 's12-a1', role: 'assistant', content: "Jackson Thomas's most recent claims activity:\n\n• 03/10/2026 – Office visit, PCP (Dr. Sarah Chen) – $180 allowed\n• 02/14/2026 – ED visit, Mercy General – $1,240 allowed\n• 02/08/2026 – Lab (HbA1c, lipid panel) – $95 allowed\n• 01/22/2026 – Pharmacy (Metformin, Lisinopril) – $42 allowed" },
    ],
  },
  {
    id: 'seed-13',
    memberKey: 'jackson-thomas',
    memberName: 'Jackson Thomas',
    date: '2026-01-30T16:00:00.000Z',
    preview: "What's Jackson's preferred language and contact info?",
    summary: 'Pulled up member contact details and language preferences',
    messages: [
      { id: 's13-u1', role: 'user', content: "What's Jackson's preferred language and contact info?" },
      { id: 's13-a1', role: 'assistant', content: "Jackson Thomas's contact details:\n\n• Phone: (907) 555-0142 (mobile, preferred)\n• Preferred language: English\n• Address: 412 Birchwood Ave, Anchorage, AK 99501\n• Preferred contact time: mornings (noted in last outreach)" },
    ],
  },
  {
    id: 'seed-14',
    memberKey: 'jackson-thomas',
    memberName: 'Jackson Thomas',
    date: '2026-01-15T13:20:00.000Z',
    preview: 'Summarize what I should know before calling Jackson today',
    summary: 'Got a quick summary before an outreach call',
    messages: [
      { id: 's14-u1', role: 'user', content: 'Summarize what I should know before calling Jackson today' },
      { id: 's14-a1', role: 'assistant', content: "Here's a quick rundown before your call with Jackson Thomas:\n\n• Medium risk (Level 2) – mainly driven by uncontrolled diabetes and recent ED use\n• HbA1c is 7.8% and overdue for a retest\n• Medication adherence is low at 68% – worth checking in on barriers\n• Had an ED visit 02/14 for hyperglycemia – ask how he's been feeling since\n• Not yet enrolled in DSME despite referral – good item to follow up on\n• Care plan goal: reduce ED visits and improve HbA1c by June" },
    ],
  },
]

function loadHistory(): ChatSession[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw !== null) return JSON.parse(raw)
    // First visit — seed with demo data
    localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_SESSIONS))
    return SEED_SESSIONS
  } catch {
    return SEED_SESSIONS
  }
}

function persistHistory(sessions: ChatSession[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions))
  } catch { /* storage quota exceeded — ignore */ }
}

export function useChatHistory() {
  const getSessionsForMember = useCallback((memberKey: string): ChatSession[] => {
    return loadHistory()
      .filter(s => s.memberKey === memberKey)
      .sort((a, b) => {
        if (a.favorited && !b.favorited) return -1
        if (!a.favorited && b.favorited) return 1
        return new Date(b.date).getTime() - new Date(a.date).getTime()
      })
  }, [])

  const saveSession = useCallback((memberKey: string, memberName: string, messages: Message[]) => {
    if (!messages.some(m => m.role === 'user')) return
    const firstUserMsg = messages.find(m => m.role === 'user')?.content ?? ''
    const session: ChatSession = {
      id: `session-${Date.now()}`,
      memberKey,
      memberName,
      date: new Date().toISOString(),
      preview: firstUserMsg.slice(0, 100),
      summary: generateSummary(messages),
      messages,
    }
    persistHistory([...loadHistory(), session])
  }, [])

  const deleteSession = useCallback((id: string) => {
    persistHistory(loadHistory().filter(s => s.id !== id))
  }, [])

  const toggleFavorite = useCallback((id: string) => {
    persistHistory(loadHistory().map(s => s.id === id ? { ...s, favorited: !s.favorited } : s))
  }, [])

  return { getSessionsForMember, saveSession, deleteSession, toggleFavorite }
}
