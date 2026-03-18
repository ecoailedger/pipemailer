const DAY_MS = 24 * 60 * 60 * 1000;
const BASE_TIME_ISO = '2026-03-18T12:00:00.000Z';
const FOLDERS = ['inbox', 'sent', 'drafts', 'archive'];
const STAGES = ['Leads', 'Qualified', 'Demo Scheduled', 'Proposal', 'Negotiation', 'Security Review', 'Won', 'Lost'];
const FIRST_NAMES = [
  'Maya', 'Liam', 'Sara', 'Noah', 'Ava', 'Ethan', 'Olivia', 'Mason', 'Emma', 'James',
  'Priya', 'Daniel', 'Sophia', 'Lucas', 'Amelia', 'Henry', 'Isla', 'Benjamin', 'Aria', 'Owen'
];
const LAST_NAMES = [
  'Patel', 'Chen', 'Gomez', 'Williams', 'Johnson', 'Brooks', 'Reed', 'Clark', 'Davis', 'Hall',
  'Nair', 'Moore', 'King', 'Lopez', 'Wright', 'Young', 'Turner', 'Scott', 'Diaz', 'Bennett'
];
const COMPANY_PARTS = [
  'Acme', 'Nimbus', 'Orbit', 'Vertex', 'Helios', 'BlueHarbor', 'Northwind', 'Stonegate', 'Crestview', 'Redwood',
  'Quasar', 'Summit', 'Pioneer', 'Bridgepoint', 'Meridian', 'Everline', 'Clearwave', 'Axion', 'Skyline', 'Nova'
];
const EMAIL_SUBJECTS = [
  'Rollout timeline update',
  'Contract redlines attached',
  'Security questionnaire follow-up',
  'Procurement checklist review',
  'Pricing options for next quarter',
  'Kickoff notes and action items',
  'Updated implementation plan',
  'NDA clause clarification',
  'Reference customer request',
  'Renewal alignment for leadership'
];
const ASSIGNEES = [
  { id: 'u-alex', name: 'Alex Morgan' },
  { id: 'u-jordan', name: 'Jordan Lee' },
  { id: 'u-riley', name: 'Riley Chen' },
  { id: 'u-taylor', name: 'Taylor Brooks' }
];

function toSeedNumber(seed) {
  if (typeof seed === 'number') return seed >>> 0;
  const str = String(seed ?? 'pipemailer');
  let hash = 2166136261;
  for (let i = 0; i < str.length; i += 1) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function createRng(seed) {
  let t = toSeedNumber(seed) || 0x6d2b79f5;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), t | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function pick(rng, items) {
  return items[Math.floor(rng() * items.length)];
}

function formatDateTime(value) {
  return value.toISOString().slice(0, 16).replace('T', ' ');
}

function buildPerson(index) {
  const first = FIRST_NAMES[index % FIRST_NAMES.length];
  const last = LAST_NAMES[Math.floor(index / FIRST_NAMES.length) % LAST_NAMES.length];
  return `${first} ${last}`;
}

function buildCompany(index) {
  const part = COMPANY_PARTS[index % COMPANY_PARTS.length];
  const suffix = ['Ltd', 'Inc', 'AG', 'Co', 'Labs'][Math.floor(index / COMPANY_PARTS.length) % 5];
  return `${part} ${suffix}`;
}

function createThread(email, rng, sentAt) {
  const threadSize = 1 + Math.floor(rng() * 3);
  const thread = [];
  for (let i = 0; i < threadSize; i += 1) {
    const isYou = i % 2 === 1;
    const at = new Date(sentAt.getTime() - (threadSize - 1 - i) * 45 * 60 * 1000);
    thread.push({
      from: isYou ? 'You' : email.from,
      at: formatDateTime(at),
      body: isYou
        ? `Thanks ${email.from.split(' ')[0]}, sharing the requested update shortly.`
        : `${email.subject}. Can we align this week?`
    });
  }
  return thread;
}

function maybeAssign(rng, sentAt) {
  if (rng() < 0.35) {
    return { assigneeId: null, assignedAt: null, assignmentHistory: [] };
  }

  const assignee = pick(rng, ASSIGNEES);
  const assignedAt = new Date(sentAt.getTime() + Math.floor(rng() * 6) * 60 * 60 * 1000).toISOString();
  return {
    assigneeId: assignee.id,
    assignedAt,
    assignmentHistory: [{ assigneeId: assignee.id, assignedAt }]
  };
}

export function buildMockDeals(count, seed) {
  const rng = createRng(`deals-${seed}`);
  const baseTime = new Date(BASE_TIME_ISO);

  return Array.from({ length: count }, (_, index) => {
    const id = index + 1;
    const person = buildPerson(index);
    const company = buildCompany(index);
    const stage = STAGES[index % STAGES.length];
    const value = 12000 + Math.floor(rng() * 160000);
    const probabilityMap = {
      Leads: 15,
      Qualified: 35,
      'Demo Scheduled': 50,
      Proposal: 65,
      Negotiation: 80,
      'Security Review': 72,
      Won: 100,
      Lost: 0
    };

    return {
      id,
      title: `${company} ${pick(rng, ['Expansion', 'Renewal', 'Migration', 'Pilot', 'Program'])}`,
      contact: `${person} · ${company}`,
      value,
      stage,
      probability: probabilityMap[stage],
      days: 1 + Math.floor((baseTime.getTime() - (baseTime.getTime() - (index % 21) * DAY_MS)) / DAY_MS),
      notes: [
        `Auto-generated mock deal ${id}`,
        `Last touchpoint ${index % 14} days ago`
      ]
    };
  });
}

export function buildMockEmails(count, seed) {
  const rng = createRng(`emails-${seed}`);
  const baseTime = new Date(BASE_TIME_ISO);
  const dealPoolSize = 80;

  return Array.from({ length: count }, (_, index) => {
    const id = 1000 + index;
    const folder = FOLDERS[index % FOLDERS.length];
    const person = buildPerson(index + 3);
    const sentAt = new Date(baseTime.getTime() - (index % 28) * DAY_MS - Math.floor(rng() * 20) * 60 * 60 * 1000);
    const subject = pick(rng, EMAIL_SUBJECTS);
    const linkedDealId = index % 7 === 0 ? null : ((index * 11) % dealPoolSize) + 1;
    const isSentOrDraft = folder === 'sent' || folder === 'drafts';

    const email = {
      id,
      folder,
      from: isSentOrDraft ? 'You' : person,
      to: isSentOrDraft ? person : 'sales@pipemailer.local',
      cc: index % 5 === 0 ? 'ops@pipemailer.local' : '',
      subject: folder === 'drafts' ? `Draft: ${subject}` : subject,
      snippet: `Generated fixture ${index + 1}: ${subject.toLowerCase()}.`,
      date: formatDateTime(sentAt),
      isRead: isSentOrDraft ? true : index % 3 !== 0,
      isStarred: index % 9 === 0,
      dealId: linkedDealId,
      body: `This is deterministic mock email #${id} for ${subject.toLowerCase()}.`,
      thread: createThread({ from: isSentOrDraft ? person : 'You', subject }, rng, sentAt),
      ...maybeAssign(rng, sentAt)
    };

    if (!isSentOrDraft) {
      email.thread = createThread(email, rng, sentAt);
    }

    return email;
  });
}

export { STAGES as MOCK_PIPELINE_STAGES };
