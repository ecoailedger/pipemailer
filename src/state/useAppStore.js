import { useEffect, useMemo, useReducer } from 'react';
import { initialState } from './initialState';

const PRIORITY_ORDER = ['low', 'medium', 'high', 'urgent'];
const APP_STORE_STORAGE_KEY = 'pipemailer:app-store:v2';
const RETURN_CLOSING_STAGES = new Set(['Closed']);

function normalizeReturnOutcome(value) {
  const normalized = String(value ?? '').trim().toLowerCase();
  if (['refund', 'replacement'].includes(normalized)) return normalized;
  return '';
}

function validateReturnStageTransition(deal, nextStage) {
  if (deal?.entityType !== 'return' || !RETURN_CLOSING_STAGES.has(nextStage)) return true;
  const returnCase = deal.returnCase ?? {};
  const disposition = String(returnCase.disposition ?? '').trim();
  const returnOutcome = normalizeReturnOutcome(returnCase.returnOutcome);
  const refundAmount = Number(returnCase.refundAmount);

  if (!disposition || !returnOutcome) return false;
  if (returnOutcome === 'refund' && (!Number.isFinite(refundAmount) || refundAmount < 0)) return false;
  return true;
}

function getPersistableSnapshot(state) {
  return {
    emails: state.emails,
    deals: state.deals,
    returnCases: state.returnCases
  };
}

function loadInitialState() {
  if (typeof window === 'undefined') return initialState;

  try {
    const rawSnapshot = window.localStorage.getItem(APP_STORE_STORAGE_KEY);
    if (!rawSnapshot) return initialState;
    const parsedSnapshot = JSON.parse(rawSnapshot);

    const persistedDeals = Array.isArray(parsedSnapshot?.deals) ? parsedSnapshot.deals : initialState.deals;
    const validPipelineStages = new Set(initialState.pipelineStages ?? []);
    const fallbackStage = initialState.pipelineStages?.[0] ?? null;
    const hasStages = validPipelineStages.size > 0;
    const stageValidation = persistedDeals.reduce(
      (summary, deal) => {
        if (!deal || typeof deal !== 'object') return summary;
        if (validPipelineStages.has(deal.stage)) {
          summary.valid += 1;
        } else {
          summary.invalid += 1;
        }
        return summary;
      },
      { valid: 0, invalid: 0 }
    );

    const shouldUseInitialDeals =
      hasStages &&
      stageValidation.invalid > 0 &&
      stageValidation.valid === 0 &&
      Array.isArray(initialState.deals) &&
      initialState.deals.length > 0;

    const normalizedDeals = shouldUseInitialDeals
      ? initialState.deals
      : persistedDeals.map((deal) => {
          if (!fallbackStage) return deal;
          if (!deal || typeof deal !== 'object') return deal;
          if (validPipelineStages.has(deal.stage)) return deal;
          return {
            ...deal,
            stage: fallbackStage
          };
        });

    return {
      ...initialState,
      emails: Array.isArray(parsedSnapshot?.emails) ? parsedSnapshot.emails : initialState.emails,
      deals: normalizedDeals,
      returnCases: Array.isArray(parsedSnapshot?.returnCases) ? parsedSnapshot.returnCases : initialState.returnCases
    };
  } catch (_error) {
    return initialState;
  }
}

function persistState(state) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(APP_STORE_STORAGE_KEY, JSON.stringify(getPersistableSnapshot(state)));
}

function clearPersistedState() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(APP_STORE_STORAGE_KEY);
}

function getEscalatedPriority(priority = 'medium') {
  const currentIndex = PRIORITY_ORDER.indexOf(priority);
  if (currentIndex === -1 || currentIndex === PRIORITY_ORDER.length - 1) return 'urgent';
  return PRIORITY_ORDER[currentIndex + 1];
}


function createMacroTemplate(template, fallbackIndex = 0) {
  const timestamp = new Date().toISOString();
  const slug = (template.title ?? `macro-${fallbackIndex + 1}`)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || `macro-${fallbackIndex + 1}`;

  return {
    id: template.id || `${slug}-${Date.now()}`,
    title: String(template.title ?? '').trim(),
    category: String(template.category ?? '').trim(),
    body: String(template.body ?? '').trim(),
    isArchived: Boolean(template.isArchived),
    createdAt: template.createdAt || timestamp,
    updatedAt: timestamp
  };
}

function reducer(state, action) {
  const buildTimelineEvent = (event) => ({
    id: event.id || `evt-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    type: event.type || 'public-message',
    visibility: event.visibility || 'public',
    actorId: event.actorId ?? null,
    actorName: event.actorName || 'System',
    timestamp: event.timestamp || new Date().toISOString(),
    body: event.body || '',
    status: event.status || 'logged',
    locked: event.locked ?? false,
    metadata: event.metadata ?? {}
  });

  const buildPublicEventsFromThread = (email) =>
    (email.thread ?? []).map((message, index) =>
      buildTimelineEvent({
        id: `thread-${email.id}-${index}`,
        type: 'public-message',
        visibility: 'public',
        actorName: message.from,
        timestamp: message.at,
        body: message.body,
        status: 'sent',
        locked: true
      })
    );

  const getEmailTimeline = (email) => email.activityTimeline ?? buildPublicEventsFromThread(email);

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
            activityTimeline: [
              buildTimelineEvent({
                type: 'public-message',
                visibility: 'public',
                actorId: state.currentUserId,
                actorName: 'You',
                timestamp: now,
                body: action.payload.body,
                status: 'sent',
                locked: true
              })
            ],
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
      const entityType = action.payload.entityType === 'return' ? 'return' : 'deal';
      const nextId = Math.max(...state.deals.map((deal) => deal.id), 0) + 1;

      if (entityType === 'deal') {
        if (!action.payload.title?.trim() || !action.payload.contact?.trim()) return state;

        const deal = {
          id: nextId,
          title: action.payload.title.trim(),
          contact: action.payload.contact.trim(),
          value: Number(action.payload.value) || 0,
          stage: action.payload.stage || state.pipelineStages[0],
          probability: 25,
          days: 1,
          notes: ['Created from React popup'],
          entityType: 'deal'
        };

        return {
          ...state,
          deals: [deal, ...state.deals],
          selectedDealId: nextId,
          popups: { ...state.popups, deal: false },
          view: 'pipeline'
        };
      }

      const requiredFields = [
        'rmaNumber',
        'orderNumber',
        'sku',
        'returnReason',
        'condition',
        'disposition'
      ];
      if (requiredFields.some((field) => !String(action.payload[field] ?? '').trim())) return state;

      const quantity = Number(action.payload.quantity);
      const refundAmount = Number(action.payload.refundAmount);
      if (!Number.isFinite(quantity) || quantity <= 0 || !Number.isFinite(refundAmount) || refundAmount < 0) {
        return state;
      }
      const returnOutcome = normalizeReturnOutcome(action.payload.returnOutcome) || (refundAmount > 0 ? 'refund' : 'replacement');

      const nextReturnId = Math.max(...state.returnCases.map((item) => item.id), 0) + 1;
      const emailId = action.payload.emailId ?? state.selectedEmailId ?? null;
      const returnCase = {
        id: nextReturnId,
        emailId,
        dealId: nextId,
        rmaNumber: action.payload.rmaNumber.trim(),
        orderNumber: action.payload.orderNumber.trim(),
        sku: action.payload.sku.trim(),
        quantity,
        returnReason: action.payload.returnReason.trim(),
        condition: action.payload.condition.trim(),
        disposition: action.payload.disposition.trim(),
        goodsReceivedDate: String(action.payload.goodsReceivedDate ?? '').trim(),
        inspectionOutcome: String(action.payload.inspectionOutcome ?? '').trim(),
        refundMethod: String(action.payload.refundMethod ?? '').trim(),
        creditNoteId: String(action.payload.creditNoteId ?? '').trim(),
        refundPostedAt: String(action.payload.refundPostedAt ?? '').trim(),
        refundAmount,
        returnOutcome
      };

      const deal = {
        id: nextId,
        title: `RMA ${returnCase.rmaNumber}`,
        contact: `Order ${returnCase.orderNumber} · SKU ${returnCase.sku}`,
        value: refundAmount,
        stage: action.payload.stage || state.pipelineStages[0],
        probability: 60,
        days: 1,
        notes: ['Created return case from popup'],
        entityType: 'return',
        returnCase
      };

      return {
        ...state,
        deals: [deal, ...state.deals],
        returnCases: [returnCase, ...state.returnCases],
        emails: emailId
          ? state.emails.map((email) => (email.id === emailId ? { ...email, dealId: nextId, returnCaseId: nextReturnId } : email))
          : state.emails,
        selectedDealId: nextId,
        popups: { ...state.popups, deal: false },
        view: 'pipeline'
      };
    }
    case 'updateDealStage': {
      const { dealId, stage } = action.payload ?? {};
      if (!dealId || !String(stage ?? '').trim()) return state;
      const nextStage = String(stage).trim();
      const targetDeal = state.deals.find((deal) => deal.id === dealId);
      if (!targetDeal || !validateReturnStageTransition(targetDeal, nextStage)) return state;

      return {
        ...state,
        deals: state.deals.map((deal) => (deal.id === dealId ? { ...deal, stage: nextStage } : deal))
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
            activityTimeline: [
              buildTimelineEvent({
                type: 'public-message',
                visibility: 'public',
                actorId: state.currentUserId,
                actorName: 'You',
                timestamp: now,
                body: cleanBody,
                status: 'sent',
                locked: true
              })
            ],
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
                  thread: [...(email.thread ?? []), outboundMessage],
                  activityTimeline: [
                    ...getEmailTimeline(email),
                    buildTimelineEvent({
                      type: 'public-message',
                      visibility: 'public',
                      actorId: state.currentUserId,
                      actorName: 'You',
                      timestamp: now,
                      body: cleanBody,
                      status: 'sent',
                      locked: true
                    })
                  ]
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

    case 'createMacroTemplate': {
      const nextTemplate = createMacroTemplate(action.payload, state.macroTemplates.length);
      if (!nextTemplate.title || !nextTemplate.category || !nextTemplate.body) return state;
      return {
        ...state,
        macroTemplates: [nextTemplate, ...state.macroTemplates]
      };
    }
    case 'updateMacroTemplate': {
      const { id, title, category, body } = action.payload ?? {};
      if (!id) return state;
      return {
        ...state,
        macroTemplates: state.macroTemplates.map((template) =>
          template.id === id
            ? {
                ...template,
                title: String(title ?? template.title).trim(),
                category: String(category ?? template.category).trim(),
                body: String(body ?? template.body).trim(),
                updatedAt: new Date().toISOString()
              }
            : template
        )
      };
    }
    case 'archiveMacroTemplate': {
      const { id, isArchived = true } = action.payload ?? {};
      if (!id) return state;
      return {
        ...state,
        macroTemplates: state.macroTemplates.map((template) =>
          template.id === id
            ? {
                ...template,
                isArchived,
                updatedAt: new Date().toISOString()
              }
            : template
        )
      };
    }
    case 'trackMacroUsage': {
      const { templateId, emailId = null, userId = state.currentUserId, insertedAt = new Date().toISOString() } = action.payload ?? {};
      if (!templateId) return state;
      const usageEvent = { templateId, emailId, userId, insertedAt };
      return {
        ...state,
        macroUsageLog: [usageEvent, ...state.macroUsageLog]
      };
    }
    case 'addInternalNote': {
      const { emailId, note = '', actorId = state.currentUserId, actorName = 'Internal user' } = action.payload ?? {};
      if (!emailId || !String(note).trim()) return state;
      const timestamp = new Date().toISOString();

      return {
        ...state,
        emails: state.emails.map((email) =>
          email.id === emailId
            ? {
                ...email,
                activityTimeline: [
                  ...getEmailTimeline(email),
                  buildTimelineEvent({
                    type: 'internal-note',
                    visibility: 'internal',
                    actorId,
                    actorName,
                    timestamp,
                    body: String(note).trim(),
                    status: 'recorded',
                    locked: true
                  })
                ]
              }
            : email
        )
      };
    }
    case 'requestApproval': {
      const { emailId, summary = '', actorId = state.currentUserId, actorName = 'Internal user' } = action.payload ?? {};
      if (!emailId) return state;
      const timestamp = new Date().toISOString();

      return {
        ...state,
        emails: state.emails.map((email) => {
          if (email.id !== emailId) return email;
          return {
            ...email,
            approvalStatus: 'required',
            approvalRequestedAt: timestamp,
            activityTimeline: [
              ...getEmailTimeline(email),
              buildTimelineEvent({
                type: 'approval-requested',
                visibility: 'internal',
                actorId,
                actorName,
                timestamp,
                body: String(summary).trim() || 'Approval requested.',
                status: 'required',
                locked: true
              })
            ]
          };
        }),
        deals: state.deals.map((deal) =>
          deal.id === (state.emails.find((email) => email.id === emailId)?.dealId ?? null)
            ? { ...deal, approvalStatus: 'required', approvalRequestedAt: timestamp }
            : deal
        )
      };
    }
    case 'resolveApproval': {
      const { emailId, approved, comment = '', actorId = state.currentUserId, actorName = 'Internal approver' } = action.payload ?? {};
      if (!emailId || typeof approved !== 'boolean') return state;
      const timestamp = new Date().toISOString();
      const nextStatus = approved ? 'approved' : 'rejected';

      return {
        ...state,
        emails: state.emails.map((email) => {
          if (email.id !== emailId) return email;
          return {
            ...email,
            approvalStatus: nextStatus,
            approvalResolvedAt: timestamp,
            activityTimeline: [
              ...getEmailTimeline(email),
              buildTimelineEvent({
                type: approved ? 'approval-approved' : 'approval-rejected',
                visibility: 'internal',
                actorId,
                actorName,
                timestamp,
                body: String(comment).trim() || (approved ? 'Approval granted.' : 'Approval rejected.'),
                status: nextStatus,
                locked: true
              })
            ]
          };
        }),
        deals: state.deals.map((deal) =>
          deal.id === (state.emails.find((email) => email.id === emailId)?.dealId ?? null)
            ? { ...deal, approvalStatus: nextStatus, approvalResolvedAt: timestamp }
            : deal
        )
      };
    }
    case 'editTimelineEvent': {
      const { emailId, eventId, body } = action.payload ?? {};
      if (!emailId || !eventId) return state;
      return {
        ...state,
        emails: state.emails.map((email) => {
          if (email.id !== emailId) return email;
          return {
            ...email,
            activityTimeline: getEmailTimeline(email).map((event) =>
              event.id === eventId && !event.locked
                ? { ...event, body: String(body ?? '').trim() }
                : event
            )
          };
        })
      };
    }
    case 'showToast':
      return { ...state, toast: { visible: true, message: action.payload } };
    case 'hideToast':
      return { ...state, toast: { ...state.toast, visible: false } };
    case 'resetDemoData':
      return { ...initialState };
    default:
      return state;
  }
}

export function useAppStore() {
  const [state, dispatch] = useReducer(reducer, undefined, loadInitialState);

  useEffect(() => {
    persistState(state);
  }, [state.emails, state.deals, state.returnCases]);

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
      updateDealStage: (payload) => dispatch({ type: 'updateDealStage', payload }),
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
      addInternalNote: (payload) => dispatch({ type: 'addInternalNote', payload }),
      requestApproval: (payload) => dispatch({ type: 'requestApproval', payload }),
      approveRequest: (payload) => dispatch({ type: 'resolveApproval', payload: { ...payload, approved: true } }),
      rejectRequest: (payload) => dispatch({ type: 'resolveApproval', payload: { ...payload, approved: false } }),
      editTimelineEvent: (payload) => dispatch({ type: 'editTimelineEvent', payload }),
      createMacroTemplate: (payload) => dispatch({ type: 'createMacroTemplate', payload }),
      updateMacroTemplate: (payload) => dispatch({ type: 'updateMacroTemplate', payload }),
      archiveMacroTemplate: (payload) => dispatch({ type: 'archiveMacroTemplate', payload }),
      trackMacroUsage: (payload) => dispatch({ type: 'trackMacroUsage', payload }),
      resetDemoData: () => {
        clearPersistedState();
        dispatch({ type: 'resetDemoData' });
      },
      showToast: (message) => dispatch({ type: 'showToast', payload: message }),
      hideToast: () => dispatch({ type: 'hideToast' })
    }),
    []
  );

  return { state, actions };
}
