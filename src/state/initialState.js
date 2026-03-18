export const initialEmails = [
  { id: 'em-1001', from: 'Ava @ Northwind', subject: 'Q2 pipeline review', snippet: 'Can we sync on open opportunities this week?', receivedAt: '2026-03-17 09:42', unread: true },
  { id: 'em-1002', from: 'Leo @ Contoso', subject: 'Contract redlines', snippet: 'Legal suggested two terms to revisit before signature.', receivedAt: '2026-03-16 14:08', unread: false },
  { id: 'em-1003', from: 'Maya @ Fabrikam', subject: 'Budget confirmation', snippet: 'Team approved budget range for implementation kickoff.', receivedAt: '2026-03-15 11:26', unread: true }
];

export const initialDeals = [
  { id: 'deal-1', name: 'Northwind Expansion', stage: 'Qualified', value: 78000 },
  { id: 'deal-2', name: 'Contoso Renewal', stage: 'Proposal', value: 56000 },
  { id: 'deal-3', name: 'Fabrikam Onboarding', stage: 'Negotiation', value: 124000 }
];

export const initialState = {
  activeView: 'email',
  selectedEmailId: initialEmails[0]?.id ?? null,
  emails: initialEmails,
  deals: initialDeals,
  popups: {
    compose: false,
    deal: false,
    link: false
  }
};
