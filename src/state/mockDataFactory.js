const DAY_MS = 24 * 60 * 60 * 1000;
const BASE_TIME_ISO = '2026-03-18T12:00:00.000Z';
const FOLDERS = ['inbox', 'sent', 'drafts', 'archive'];
const RETURNS_STAGES = [
  'Awaiting Customer',
  'Awaiting Warehouse',
  'Inspection Complete',
  'Ready to Refund',
  'Ready to Replace',
  'Closed'
];
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

function createActivityTimeline(email, thread, rng, sentAt) {
  const timeline = thread.map((message, index) => ({
    id: `thread-${email.id}-${index}`,
    type: 'public-message',
    visibility: 'public',
    actorId: message.from === 'You' ? 'u-alex' : null,
    actorName: message.from,
    timestamp: message.at,
    body: message.body,
    status: 'sent',
    locked: true,
    metadata: {}
  }));

  if (email.folder !== 'inbox' || rng() < 0.55) return timeline;

  const noteAt = new Date(sentAt.getTime() + 30 * 60 * 1000).toISOString();
  timeline.push({
    id: `internal-${email.id}`,
    type: 'internal-note',
    visibility: 'internal',
    actorId: 'u-jordan',
    actorName: 'Jordan Lee',
    timestamp: noteAt,
    body: 'Flagged for policy review before external response.',
    status: 'recorded',
    locked: true,
    metadata: {}
  });

  if (rng() < 0.5) {
    const requestAt = new Date(sentAt.getTime() + 60 * 60 * 1000).toISOString();
    const isResolved = rng() < 0.45;
    timeline.push({
      id: `approval-request-${email.id}`,
      type: 'approval-requested',
      visibility: 'internal',
      actorId: 'u-jordan',
      actorName: 'Jordan Lee',
      timestamp: requestAt,
      body: 'Requesting manager approval for exception handling.',
      status: isResolved ? 'approved' : 'required',
      locked: true,
      metadata: {}
    });

    if (isResolved) {
      const approved = rng() < 0.7;
      timeline.push({
        id: `approval-resolution-${email.id}`,
        type: approved ? 'approval-approved' : 'approval-rejected',
        visibility: 'internal',
        actorId: 'u-taylor',
        actorName: 'Taylor Brooks',
        timestamp: new Date(sentAt.getTime() + 90 * 60 * 1000).toISOString(),
        body: approved ? 'Approved to proceed with customer response.' : 'Rejected. Need more order details first.',
        status: approved ? 'approved' : 'rejected',
        locked: true,
        metadata: {}
      });
    }
  }

  return timeline;
}


function buildSlaFields(rng, sentAt, isSentOrDraft) {
  const priority = pick(rng, ['low', 'medium', 'high', 'urgent']);

  if (isSentOrDraft) {
    return {
      firstResponseDueAt: null,
      resolutionDueAt: null,
      priority,
      slaStatus: 'onTrack',
      slaEscalations: []
    };
  }

  const firstResponseDueAt = new Date(sentAt.getTime() + pick(rng, [2, 4, 8, 16]) * 60 * 60 * 1000).toISOString();
  const resolutionDueAt = new Date(sentAt.getTime() + pick(rng, [1, 2, 3, 5]) * DAY_MS).toISOString();

  return {
    firstResponseDueAt,
    resolutionDueAt,
    priority,
    slaStatus: 'onTrack',
    slaEscalations: []
  };
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
    const stage = RETURNS_STAGES[index % RETURNS_STAGES.length];
    const refundValue = 25 + Math.floor(rng() * 575);
    const disposition = pick(rng, ['restock', 'recycle', 'quarantine']);
    const outcome = stage === 'Ready to Replace' ? 'replacement' : 'refund';
    const probabilityMap = {
      'Awaiting Customer': 15,
      'Awaiting Warehouse': 35,
      'Inspection Complete': 60,
      'Ready to Refund': 85,
      'Ready to Replace': 82,
      Closed: 100
    };

    const returnCase = {
      id: id,
      emailId: null,
      dealId: id,
      rmaNumber: `RMA-${12000 + id}`,
      orderNumber: `ORD-${83000 + id}`,
      sku: `SKU-${100 + (index % 750)}`,
      quantity: 1 + (index % 3),
      returnReason: pick(rng, ['Damaged in transit', 'Wrong item shipped', 'Arrived late', 'No longer needed']),
      condition: pick(rng, ['new', 'opened', 'damaged']),
      disposition,
      refundAmount: outcome === 'refund' ? refundValue : 0,
      returnOutcome: outcome
    };

    return {
      id,
      title: `RMA ${returnCase.rmaNumber}`,
      contact: `${person} · Order ${returnCase.orderNumber}`,
      value: refundValue,
      stage,
      probability: probabilityMap[stage],
      days: 1 + Math.floor((baseTime.getTime() - (baseTime.getTime() - (index % 21) * DAY_MS)) / DAY_MS),
      notes: [
        `Auto-generated return case ${id}`,
        `Last customer update ${index % 14} days ago`
      ],
      entityType: 'return',
      returnCase
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
      approvalStatus: 'none',
      ...maybeAssign(rng, sentAt),
      ...buildSlaFields(rng, sentAt, isSentOrDraft)
    };

    if (!isSentOrDraft) {
      email.thread = createThread(email, rng, sentAt);
    }
    email.activityTimeline = createActivityTimeline(email, email.thread, rng, sentAt);
    const latestApprovalEvent = [...email.activityTimeline]
      .reverse()
      .find((event) => event.type?.startsWith('approval-'));
    if (latestApprovalEvent) {
      email.approvalStatus = latestApprovalEvent.status || 'required';
    }

    return email;
  });
}

export { RETURNS_STAGES as MOCK_PIPELINE_STAGES };
