import { useMemo, useReducer } from 'react';
import { initialState } from './initialState';

const PRIORITY_ORDER = ['low', 'medium', 'high', 'urgent'];

function getEscalatedPriority(priority = 'medium') {
  const currentIndex = PRIORITY_ORDER.indexOf(priority);
  if (currentIndex === -1 || currentIndex === PRIORITY_ORDER.length - 1) return 'urgent';
  return PRIORITY_ORDER[currentIndex + 1];
}

function reducer(state, action) {
  const withAssignment = (email, assigneeId) => {
    const assignedAt = assigneeId ? new Date().toISOString() : null;
    return {
      ...email,
      assigneeId: assigneeId ?? null,
      assignedAt,
      assignmentHistory: assigneeId
        ? [...(email.assignmentHistory ?? []), { assigneeId, assignedAt }]
        : email.assignmentHistory ?? []
    };
  };

  switch (action.type) {
    case 'setView':
      return { ...state, view: action.payload };
    case 'setSearchQuery':
      return { ...state, searchQuery: action.payload };
    case 'toggleTheme':
      return { ...state, themeMode: state.themeMode === 'light' ? 'dark' : 'light' };
    case 'setFolder':
      return { ...state, selectedFolder: action.payload };
    case 'setQueue':
      return { ...state, selectedQueue: action.payload };
    case 'setStage':
      return { ...state, selectedStage: action.payload, view: 'pipeline' };
    case 'selectEmail': {
      const email = state.emails.find((item) => item.id === action.payload) ?? null;
      return {
        ...state,
        selectedEmailId: action.payload,
        selectedDealId: email?.dealId ?? state.selectedDealId,
        view: 'email'
      };
    }
    case 'selectDeal':
      return { ...state, selectedDealId: action.payload, view: 'pipeline' };
    case 'setPopupOpen':
      return {
        ...state,
        popups: {
          ...state.popups,
          [action.payload.name]: action.payload.open
        }
      };
    case 'saveCompose': {
      if (!action.payload.body?.trim()) return state;
      const nextId = Math.max(...state.emails.map((email) => email.id), 0) + 1;
      const now = new Date().toISOString();
      return {
        ...state,
        emails: [
          {
            id: nextId,
            folder: 'sent',
            from: 'You',
            to: action.payload.to || 'Unknown recipient',
            cc: '',
            subject: action.payload.subject || '(No subject)',
            snippet: action.payload.body.slice(0, 90),
            date: now,
            isRead: true,
            isStarred: false,
            dealId: state.selectedDealId,
            body: action.payload.body,
            thread: [{ from: 'You', at: now, body: action.payload.body }],
            assigneeId: state.currentUserId,
            assignedAt: now,
            assignmentHistory: [{ assigneeId: state.currentUserId, assignedAt: now }],
            firstResponseDueAt: null,
            resolutionDueAt: null,
            priority: 'medium',
            slaStatus: 'onTrack',
            slaEscalations: []
          },
          ...state.emails
        ],
        selectedFolder: 'sent',
        selectedEmailId: nextId,
        popups: { ...state.popups, compose: false }
      };
    }
    case 'saveDeal': {
      if (!action.payload.title?.trim() || !action.payload.contact?.trim()) return state;
      const nextId = Math.max(...state.deals.map((deal) => deal.id), 0) + 1;
      const deal = {
        id: nextId,
        title: action.payload.title.trim(),
        contact: action.payload.contact.trim(),
        value: Number(action.payload.value) || 0,
        stage: action.payload.stage || state.pipelineStages[0],
        probability: 25,
        days: 1,
        notes: ['Created from React popup']
      };
      return {
        ...state,
        deals: [deal, ...state.deals],
        selectedDealId: nextId,
        popups: { ...state.popups, deal: false },
        view: 'pipeline'
      };
    }
    case 'saveLink': {
      const { emailId, dealId } = action.payload;
      if (!emailId || !dealId) return state;
      return {
        ...state,
        emails: state.emails.map((email) => (email.id === emailId ? { ...email, dealId } : email)),
        selectedEmailId: emailId,
        selectedDealId: dealId,
        popups: { ...state.popups, link: false }
      };
    }
    case 'replyToEmail': {
      const { emailId, to, cc, subject, body, dealId } = action.payload;
      if (!emailId || !body?.trim()) return state;

      const sourceEmail = state.emails.find((email) => email.id === emailId);
      if (!sourceEmail) return state;

      const nextId = Math.max(...state.emails.map((email) => email.id), 0) + 1;
      const now = new Date().toISOString();
      const resolvedDealId = dealId ?? sourceEmail.dealId ?? null;
      const cleanBody = body.trim();
      const outboundMessage = { from: 'You', at: now, body: cleanBody };

      return {
        ...state,
        emails: [
          {
            id: nextId,
            folder: 'sent',
            from: 'You',
            to: to || sourceEmail.from || 'Unknown recipient',
            cc: cc || '',
            subject: subject || sourceEmail.subject || '(No subject)',
            snippet: cleanBody.slice(0, 90),
            date: now,
            isRead: true,
            isStarred: false,
            dealId: resolvedDealId,
            body: cleanBody,
            thread: [outboundMessage],
            assigneeId: sourceEmail.assigneeId ?? state.currentUserId,
            assignedAt: sourceEmail.assignedAt ?? now,
            assignmentHistory: sourceEmail.assignmentHistory ?? [],
            firstResponseDueAt: null,
            resolutionDueAt: sourceEmail.resolutionDueAt ?? null,
            priority: sourceEmail.priority ?? 'medium',
            slaStatus: sourceEmail.slaStatus ?? 'onTrack',
            slaEscalations: sourceEmail.slaEscalations ?? []
          },
          ...state.emails.map((email) =>
            email.id === emailId
              ? {
                  ...email,
                  dealId: resolvedDealId,
                  thread: [...(email.thread ?? []), outboundMessage]
                }
              : email
          )
        ],
        replyDrafts: Object.fromEntries(
          Object.entries(state.replyDrafts).filter(([draftEmailId]) => Number(draftEmailId) !== emailId)
        )
      };
    }
    case 'linkEmailToDeal': {
      const { emailId, dealId } = action.payload;
      if (!emailId || !dealId) return state;

      const nextState = {
        ...state,
        emails: state.emails.map((email) => (email.id === emailId ? { ...email, dealId } : email))
      };

      if (state.selectedEmailId === emailId) {
        nextState.selectedDealId = dealId;
      }

      return nextState;
    }
    case 'setReplyDraft': {
      const { emailId, to = '', cc = '', subject = '', body = '', dealId = null } = action.payload ?? {};
      if (!emailId) return state;
      return {
        ...state,
        replyDrafts: {
          ...state.replyDrafts,
          [emailId]: { emailId, to, cc, subject, body, dealId }
        }
      };
    }
    case 'clearReplyDraft': {
      const { emailId } = action.payload ?? {};
      if (!emailId || !state.replyDrafts[emailId]) return state;
      return {
        ...state,
        replyDrafts: Object.fromEntries(
          Object.entries(state.replyDrafts).filter(([draftEmailId]) => Number(draftEmailId) !== emailId)
        )
      };
    }
    case 'setLoading':
      return { ...state, showLoading: action.payload };
    case 'assignEmail': {
      const { emailId, assigneeId } = action.payload;
      return {
        ...state,
        emails: state.emails.map((email) => (email.id === emailId ? withAssignment(email, assigneeId) : email))
      };
    }
    case 'bulkAssignEmails': {
      const { emailIds, assigneeId } = action.payload;
      const emailSet = new Set(emailIds ?? []);
      if (!emailSet.size) return state;
      return {
        ...state,
        emails: state.emails.map((email) => (emailSet.has(email.id) ? withAssignment(email, assigneeId) : email))
      };
    }
    case 'updateEmailPriority': {
      const { emailId, priority } = action.payload ?? {};
      if (!emailId || !PRIORITY_ORDER.includes(priority)) return state;

      return {
        ...state,
        emails: state.emails.map((email) => (email.id === emailId ? { ...email, priority } : email))
      };
    }
    case 'escalateSlaBreach': {
      const { emailId, reason = 'SLA breach escalated' } = action.payload ?? {};
      if (!emailId) return state;
      const escalatedAt = new Date().toISOString();

      return {
        ...state,
        emails: state.emails.map((email) =>
          email.id === emailId
            ? {
                ...email,
                slaStatus: 'breached',
                priority: getEscalatedPriority(email.priority),
                slaEscalations: [...(email.slaEscalations ?? []), { reason, escalatedAt }]
              }
            : email
        )
      };
    }
    case 'bulkEscalateSlaBreaches': {
      const { emailIds = [], reason = 'Bulk SLA breach escalation' } = action.payload ?? {};
      const emailSet = new Set(emailIds);
      if (!emailSet.size) return state;
      const escalatedAt = new Date().toISOString();

      return {
        ...state,
        emails: state.emails.map((email) =>
          emailSet.has(email.id)
            ? {
                ...email,
                slaStatus: 'breached',
                priority: getEscalatedPriority(email.priority),
                slaEscalations: [...(email.slaEscalations ?? []), { reason, escalatedAt }]
              }
            : email
        )
      };
    }
    case 'showToast':
      return { ...state, toast: { visible: true, message: action.payload } };
    case 'hideToast':
      return { ...state, toast: { ...state.toast, visible: false } };
    default:
      return state;
  }
}

export function useAppStore() {
  const [state, dispatch] = useReducer(reducer, initialState);

  const actions = useMemo(
    () => ({
      setView: (view) => {
        const allowedViews = ['email', 'pipeline', 'dashboard'];
        if (!allowedViews.includes(view)) return;
        dispatch({ type: 'setView', payload: view });
      },
      setSearchQuery: (query) => dispatch({ type: 'setSearchQuery', payload: query }),
      toggleTheme: () => dispatch({ type: 'toggleTheme' }),
      setSelectedFolder: (folder) => dispatch({ type: 'setFolder', payload: folder }),
      setSelectedQueue: (queue) => dispatch({ type: 'setQueue', payload: queue }),
      setSelectedStage: (stage) => dispatch({ type: 'setStage', payload: stage }),
      selectEmail: (emailId) => dispatch({ type: 'selectEmail', payload: emailId }),
      selectDeal: (dealId) => dispatch({ type: 'selectDeal', payload: dealId }),
      setPopupOpen: (name, open) => dispatch({ type: 'setPopupOpen', payload: { name, open } }),
      saveCompose: (payload) => dispatch({ type: 'saveCompose', payload }),
      saveDeal: (payload) => dispatch({ type: 'saveDeal', payload }),
      saveLink: (payload) => dispatch({ type: 'saveLink', payload }),
      replyToEmail: (payload) => dispatch({ type: 'replyToEmail', payload }),
      linkEmailToDeal: (payload) => dispatch({ type: 'linkEmailToDeal', payload }),
      setReplyDraft: (payload) => dispatch({ type: 'setReplyDraft', payload }),
      clearReplyDraft: (payload) => dispatch({ type: 'clearReplyDraft', payload }),
      setLoading: (loading) => dispatch({ type: 'setLoading', payload: loading }),
      assignEmail: (payload) => dispatch({ type: 'assignEmail', payload }),
      reassignEmail: (payload) => dispatch({ type: 'assignEmail', payload }),
      bulkAssignEmails: (payload) => dispatch({ type: 'bulkAssignEmails', payload }),
      updateEmailPriority: (payload) => dispatch({ type: 'updateEmailPriority', payload }),
      escalateSlaBreach: (payload) => dispatch({ type: 'escalateSlaBreach', payload }),
      bulkEscalateSlaBreaches: (payload) => dispatch({ type: 'bulkEscalateSlaBreaches', payload }),
      showToast: (message) => dispatch({ type: 'showToast', payload: message }),
      hideToast: () => dispatch({ type: 'hideToast' })
    }),
    []
  );

  return { state, actions };
}
