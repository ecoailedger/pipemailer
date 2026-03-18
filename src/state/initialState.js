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

export const initialState = {
  view: 'email',
  selectedEmailId: initialEmails[0]?.id ?? null,
  selectedDealId: initialEmails[0]?.dealId ?? null,
  selectedFolder: 'inbox',
  selectedStage: null,
  searchQuery: '',
  themeMode: 'light',
  showLoading: false,
  toast: {
    visible: false,
    message: ''
  },
  emails: initialEmails,
  deals: initialDeals,
  pipelineStages,
  popups: {
    compose: false,
    deal: false,
    link: false
  }
};
