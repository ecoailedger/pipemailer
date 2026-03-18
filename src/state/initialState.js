import { buildMockDeals, buildMockEmails, MOCK_PIPELINE_STAGES } from './mockDataFactory';

const DEV_SEED = import.meta.env.VITE_MOCK_SEED ?? 'pipemailer-v1';
const LARGE_DATASET = import.meta.env.VITE_LARGE_DATASET
  ? import.meta.env.VITE_LARGE_DATASET === 'true'
  : true;

const dealCount = LARGE_DATASET ? 80 : 12;
const emailCount = LARGE_DATASET ? 250 : 24;

export const initialDeals = buildMockDeals(dealCount, DEV_SEED);
export const initialEmails = buildMockEmails(emailCount, DEV_SEED);

export const pipelineStages = MOCK_PIPELINE_STAGES;

export const macroCategories = [
  { id: 'returns', label: 'Returns' },
  { id: 'shipping', label: 'Shipping' },
  { id: 'billing', label: 'Billing' }
];

export const initialMacroTemplates = [
  {
    id: 'macro-rma-followup',
    title: 'RMA Follow-up',
    category: 'returns',
    body: 'Hi {{customer_name}},\n\nYour return request is active. RMA {{rma_number}} is linked to order {{order_number}}.\n\nPlease reply if you need anything else.\n\nBest,\nSupport Team',
    isArchived: false,
    createdAt: '2026-01-10T09:00:00.000Z',
    updatedAt: '2026-01-10T09:00:00.000Z'
  },
  {
    id: 'macro-order-check',
    title: 'Order Verification',
    category: 'shipping',
    body: 'Hi {{customer_name}},\n\nWe are reviewing order {{order_number}} and will send a tracking update shortly.\n\nThanks for your patience.',
    isArchived: false,
    createdAt: '2026-01-11T10:30:00.000Z',
    updatedAt: '2026-01-11T10:30:00.000Z'
  },
  {
    id: 'macro-billing-escalation',
    title: 'Billing Escalation',
    category: 'billing',
    body: 'Hi {{customer_name}},\n\nI escalated your billing case connected to order {{order_number}}. We will follow up within one business day.',
    isArchived: false,
    createdAt: '2026-01-14T12:15:00.000Z',
    updatedAt: '2026-01-14T12:15:00.000Z'
  }
];

/**
 * @typedef {'email' | 'pipeline' | 'dashboard'} AppView
 */

export const initialState = {
  /** @type {AppView} */
  view: 'email',
  selectedEmailId: initialEmails[0]?.id ?? null,
  selectedDealId: initialEmails[0]?.dealId ?? null,
  selectedFolder: 'inbox',
  selectedQueue: 'all',
  selectedStage: null,
  searchQuery: '',
  themeMode: 'light',
  showLoading: false,
  toast: {
    visible: false,
    message: ''
  },
  emails: initialEmails,
  assignees: [
    { id: 'u-alex', name: 'Alex Morgan' },
    { id: 'u-jordan', name: 'Jordan Lee' },
    { id: 'u-riley', name: 'Riley Chen' },
    { id: 'u-taylor', name: 'Taylor Brooks' }
  ],
  currentUserId: 'u-alex',
  teamAssigneeIds: ['u-alex', 'u-jordan', 'u-riley', 'u-taylor'],
  deals: initialDeals,
  returnCases: [],
  pipelineStages,
  macroCategories,
  macroTemplates: initialMacroTemplates,
  macroUsageLog: [],
  replyDrafts: {},
  popups: {
    compose: false,
    deal: false,
    link: false
  }
};
