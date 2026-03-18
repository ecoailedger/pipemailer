import { formatCurrency, formatDate, normalizeDateValue } from '../utils/formatters.js';

function escapeHtml(v) {
  return String(v ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function buildThreadMessages(email) {
  if (Array.isArray(email.thread) && email.thread.length) return email.thread;
  return [{ from: email.from || 'Unknown sender', at: email.date || new Date().toISOString(), body: email.body || '' }];
}

function normalizeSubject(subject) {
  return String(subject || '')
    .toLowerCase()
    .replace(/^(re|fw|fwd):\s*/g, '')
    .trim();
}

function buildThreadKey(email) {
  const byDeal = email.dealId ? `deal:${email.dealId}` : null;
  const byParticipants = [email.from, email.to].filter(Boolean).sort().join('|');
  const bySubject = normalizeSubject(email.subject || '(no subject)');
  return byDeal || `${byParticipants}::${bySubject}`;
}

function appendReplyToRelatedThread(state, sourceEmail, outboundMessage) {
  const sourceThread = Array.isArray(sourceEmail.thread) ? sourceEmail.thread : buildThreadMessages(sourceEmail);
  const nextThread = sourceThread.concat([outboundMessage]);
  const sourceKey = buildThreadKey(sourceEmail);

  state.emails.forEach((item) => {
    if (item.id === sourceEmail.id || buildThreadKey(item) === sourceKey) {
      item.thread = nextThread.slice();
      item.isRead = true;
    }
  });

  sourceEmail.thread = nextThread.slice();
  sourceEmail.isRead = true;
  return nextThread;
}

function ensureWidgetReinit($el, widgetName) {
  if (!$el.length) return;
  const instance = $el[widgetName]('instance');
  if (instance) instance.dispose();
}

function initializeThreadTab(state, deps) {
  const $ = window.jQuery;
  if (state.rightPanelMode !== 'email' || !state.selectedEmailId) return;
  if (!$('#threadMessages').length) return;

  const email = state.emails.find((e) => e.id === state.selectedEmailId);
  if (!email) return;

  if (!Array.isArray(email.thread) || !email.thread.length) email.thread = buildThreadMessages(email);
  const threadMessages = email.thread;
  const renderApp = typeof deps.rerender === 'function' ? deps.rerender : () => {};
  const notify = typeof deps.notify === 'function' ? deps.notify : (msg, type) => window.DevExpress?.ui?.notify?.(msg, type || 'success', 1800);

  const messageCards = threadMessages.map((msg) => `<div class="thread-message"><div class="timeline-head"><strong>${escapeHtml(msg.from || 'Unknown')}</strong><span>${formatDate(msg.at || email.date)}</span></div><div>${escapeHtml(msg.body || '')}</div></div>`).join('');
  $('#threadMessages').html(messageCards || '<div class="empty-state">No messages in this thread.</div>');

  const defaultSubject = email.subject && email.subject.toLowerCase().startsWith('re:') ? email.subject : `Re: ${email.subject || '(No subject)'}`;
  const prefillComposer = ({ includeAll = false } = {}) => {
    const to = includeAll ? [email.to, email.from].filter(Boolean).join(', ') : (email.from || '');
    const cc = includeAll ? (email.cc || '') : '';
    $('#replyToField').dxTextBox('instance')?.option('value', to);
    $('#replyCcField').dxTextBox('instance')?.option('value', cc);
    $('#replySubjectField').dxTextBox('instance')?.option('value', defaultSubject);
    $('#replyArea').dxTextArea('instance')?.option('value', '');
  };

  ['#replyBtn', '#replyAllBtn', '#archiveBtn', '#sendReply'].forEach((selector) => ensureWidgetReinit($(selector), 'dxButton'));
  ['#replyToField', '#replyCcField', '#replySubjectField'].forEach((selector) => ensureWidgetReinit($(selector), 'dxTextBox'));
  ensureWidgetReinit($('#messageDetailsAccordion'), 'dxAccordion');
  ensureWidgetReinit($('#emailDealSelector'), 'dxSelectBox');
  ensureWidgetReinit($('#emailStageSelector'), 'dxSelectBox');
  ensureWidgetReinit($('#replyArea'), 'dxTextArea');

  const metadataRows = [
    ['From', email.from || 'Unknown sender'],
    ['To', email.to || '—'],
    ['Cc', email.cc || '—'],
    ['Date', formatDate(email.date)],
    ['Linked deal', email.dealId ? (state.deals.find((d) => d.id === email.dealId)?.title || `Deal #${email.dealId}`) : 'Not linked']
  ];
  const metaHtml = `<div class="thread-meta">${metadataRows.map(([label, value]) => `<div class="thread-meta-row"><strong>${escapeHtml(label)}</strong><span>${escapeHtml(value)}</span></div>`).join('')}</div>`;
  const fullBody = (email.body || threadMessages[threadMessages.length - 1]?.body || '').trim();
  $('#messageDetailsAccordion').dxAccordion({
    dataSource: [
      { title: 'Email details', content: metaHtml },
      { title: 'Full message body', content: `<div class="email-body-full">${escapeHtml(fullBody || '(No message body)')}</div>` }
    ],
    multiple: true,
    collapsible: true,
    itemTitleTemplate: (item) => item.title,
    itemTemplate: (item) => `<div>${item.content}</div>`
  });

  $('#emailDealSelector').dxSelectBox({
    dataSource: state.deals,
    displayExpr: 'title',
    valueExpr: 'id',
    value: email.dealId || null,
    showClearButton: true,
    searchEnabled: true,
    label: 'Linked Pipedrive deal',
    labelMode: 'floating',
    placeholder: 'Attach this thread to a deal',
    onValueChanged: (ev) => {
      email.dealId = ev.value || null;
      const stageSelector = $('#emailStageSelector').dxSelectBox('instance');
      const linkedDeal = ev.value ? state.deals.find((d) => d.id === ev.value) : null;
      stageSelector?.option({
        disabled: !linkedDeal,
        value: linkedDeal ? linkedDeal.stage : null
      });
    }
  });
  $('#emailStageSelector').dxSelectBox({
    dataSource: state.pipelineStages,
    value: (email.dealId && state.deals.find((d) => d.id === email.dealId)?.stage) || null,
    label: 'Deal stage',
    labelMode: 'floating',
    placeholder: 'Pick a stage',
    disabled: !email.dealId,
    onValueChanged: (ev) => {
      if (ev.value) state.updateEmailDealStage(email.id, ev.value);
    }
  });

  $('#replyToField').dxTextBox({ label: 'To', labelMode: 'floating', value: email.from || '' });
  $('#replyCcField').dxTextBox({ label: 'Cc', labelMode: 'floating', value: '' });
  $('#replySubjectField').dxTextBox({ label: 'Subject', labelMode: 'floating', value: defaultSubject });
  $('#replyArea').dxTextArea({ label: 'Reply', labelMode: 'floating', minHeight: 110, value: '' });

  $('#replyBtn').dxButton({
    text: 'Reply',
    icon: 'undo',
    onClick: () => {
      state.composerMode = 'reply';
      prefillComposer({ includeAll: false });
    }
  });
  $('#replyAllBtn').dxButton({
    text: 'Reply all',
    icon: 'group',
    stylingMode: 'outlined',
    onClick: () => {
      state.composerMode = 'reply-all';
      prefillComposer({ includeAll: true });
    }
  });
  $('#archiveBtn').dxButton({
    text: 'Archive',
    icon: 'box',
    stylingMode: 'outlined',
    onClick: () => {
      state.archiveEmail(email.id);
      renderApp();
      notify('Email archived');
    }
  });
  $('#sendReply').dxButton({
    text: 'Send reply',
    type: 'success',
    onClick: () => {
      const to = ($('#replyToField').dxTextBox('instance')?.option('value') || '').trim();
      const cc = ($('#replyCcField').dxTextBox('instance')?.option('value') || '').trim();
      const subject = ($('#replySubjectField').dxTextBox('instance')?.option('value') || defaultSubject).trim();
      const body = ($('#replyArea').dxTextArea('instance')?.option('value') || '').trim();
      if (!body) { notify('Reply body cannot be empty', 'warning'); return; }
      const now = new Date().toISOString();
      const outbound = { from: 'You', at: now, body };
      const nextThread = appendReplyToRelatedThread(state, email, outbound);
      const selectedDealId = $('#emailDealSelector').dxSelectBox('instance')?.option('value') || email.dealId || null;
      email.dealId = selectedDealId;
      state.emails.unshift({
        id: Date.now(),
        folder: 'sent',
        from: 'You',
        to,
        cc,
        subject: subject || defaultSubject,
        snippet: body.slice(0, 90),
        date: now,
        isRead: true,
        isStarred: false,
        dealId: selectedDealId,
        body,
        thread: nextThread.slice()
      });
      if (selectedDealId) {
        const deal = state.deals.find((d) => d.id === selectedDealId);
        if (deal) {
          deal.notes.unshift(`📧 ${formatDate(now)} · Reply sent: ${subject || defaultSubject} — ${body}`);
        }
      }
      renderApp();
      notify(selectedDealId ? 'Reply sent and logged to thread + linked deal' : 'Reply sent and logged to thread');
    }
  });
}

function getStageSummary(state) {
  return state.pipelineStages.map((stage) => {
    const deals = state.deals.filter((d) => d.stage === stage);
    const value = deals.reduce((sum, d) => sum + d.value, 0);
    return { stage, count: deals.length, value };
  });
}

function getDealHealthRows(state) {
  return state.deals.map((d) => ({ id: d.id, title: d.title, stage: d.stage, value: d.value, probability: d.probability, velocity: `${d.days} days`, notes: d.notes }));
}

function getDealTimelineEvents(state, dealId) {
  const deal = state.deals.find((d) => d.id === dealId);
  if (!deal) return [];
  const emailEvents = state.emails.filter((e) => e.dealId === dealId).map((e) => ({ type: e.folder === 'sent' ? 'sent' : 'received', title: e.subject, body: e.snippet || e.body || '', at: e.date, actor: e.from }));
  const noteEvents = (deal.notes || []).map((n, idx) => ({ type: 'internal note', title: 'Deal note', body: n, at: new Date(Date.now() - idx * 21600000).toISOString(), actor: 'Sales team' }));
  const stageEvent = { type: 'status change', title: `Deal in ${deal.stage}`, body: `Current stage is ${deal.stage}.`, at: new Date().toISOString(), actor: 'System' };
  return emailEvents.concat(noteEvents).concat([stageEvent]).sort((a, b) => (normalizeDateValue(b.at)?.getTime() || 0) - (normalizeDateValue(a.at)?.getTime() || 0));
}

function renderTimelineHtml(state) {
  const deal = state.deals.find((d) => d.id === state.selectedDealId);
  if (!deal) return '<div class="empty-state">No deal selected.</div>';
  const events = getDealTimelineEvents(state, deal.id);
  const filtered = state.timelineFilter === 'all' ? events : events.filter((ev) => ev.type === state.timelineFilter);
  const filters = ['all', 'sent', 'received', 'internal note', 'status change'];
  const filterButtons = `<div class="timeline-filter-row">${filters.map((f) => `<div id="flt-${f.replace(/\s/g, '-')}"></div>`).join('')}</div>`;
  if (!filtered.length) return `${filterButtons}<div class="empty-state">No ${state.timelineFilter} events yet.</div>`;
  const rows = filtered.map((ev) => `<div class="timeline-item"><div class="timeline-head"><strong>${ev.type}</strong><span>${formatDate(ev.at)}</span></div><div><strong>${ev.title}</strong></div><div>${ev.body}</div><div class="composer-hint">${ev.actor}</div></div>`).join('');
  return filterButtons + rows;
}

function threadTabTemplate() {
  return '<div class="thread-wrap"><div class="panel-section-label">Actions</div><div class="thread-actions-row"><div class="thread-actions-primary"><div id="replyBtn"></div><div id="replyAllBtn"></div><div id="archiveBtn"></div></div><div id="threadOverflowBtn"></div></div><div id="messageDetailsAccordion"></div><div class="panel-section-label">Conversation</div><div id="threadScroll" class="thread-scroll"><div id="threadMessages"></div></div><div id="emailDealSelector" class="mt-5"></div><div id="emailStageSelector" class="mt-3"></div><div class="reply-composer"><div class="panel-section-label">Composer</div><div id="replyToField"></div><div id="replyCcField" class="mt-2"></div><div id="replySubjectField" class="mt-2"></div><div id="replyArea" class="mt-2"></div><div id="sendReply" class="mt-3"></div></div></div>';
}

export function renderRightPanel(state, deps) {
  const $ = window.jQuery;
  const tabs = [{ title: 'Thread' }, { title: 'Deal' }, { title: 'Activity' }, { title: 'Insights' }];
  $('#detailTabs').dxTabPanel({
    dataSource: tabs, animationEnabled: false, swipeEnabled: false,
    itemTitleTemplate: (i) => i.title,
    itemTemplate: (item) => {
      if (state.rightPanelMode === 'email') {
        const em = state.emails.find((e) => e.id === state.selectedEmailId);
        if (!em) return '<div class="empty-state">Select an email to view details.</div>';
        const deal = state.deals.find((d) => d.id === em.dealId);
        if (item.title === 'Thread') return threadTabTemplate();
        if (item.title === 'Deal') return deal ? `<div class="card-body"><h3>${deal.title}</h3><p>${deal.contact}</p><p class="deal-value">${formatCurrency(deal.value)}</p><p><strong>Stage:</strong> ${deal.stage}</p></div>` : '<div class="empty-state">No linked deal. Use the Thread tab to align this email to a deal.</div>';
        if (item.title === 'Activity') return deal ? `<div class="card-body">${deal.notes.map((n) => `<div class="thread-message">${n}</div>`).join('')}</div>` : '<div class="empty-state">No activity.</div>';
        return '<div class="card-body"><div id="dealHealthGrid"></div><div id="dealActivityAccordion" class="mt-4"></div></div>';
      }
      const dl = state.deals.find((d) => d.id === state.selectedDealId);
      if (!dl) return '<div class="empty-state">Select a deal from Kanban.</div>';
      if (item.title === 'Thread') return `<div class="card-body">Deal: ${dl.title}<br/>Stage: ${dl.stage}</div>`;
      if (item.title === 'Deal') return `<div class="card-body"><h3>${dl.title}</h3><p>${dl.contact}</p><p class="deal-value">${formatCurrency(dl.value)}</p><div id="addNoteBtn"></div></div>`;
      if (item.title === 'Activity') return `<div class="card-body" id="dealTimelineWrap">${renderTimelineHtml(state)}</div>`;
      return '<div class="card-body"><div id="dealHealthGrid"></div><div id="dealActivityAccordion" class="mt-4"></div></div>';
    },
    onSelectionChanged: () => {
      deps.bindRightPanelInteractions();
      initializeThreadTab(state, deps);
    },
    onContentReady: () => {
      deps.bindRightPanelInteractions();
      initializeThreadTab(state, deps);
    }
  });

  const title = state.rightPanelMode === 'email' ? (state.emails.find((e) => e.id === state.selectedEmailId) || {}).subject : (state.deals.find((d) => d.id === state.selectedDealId) || {}).title;
  $('#detailTitle').text(title || 'No item selected');

  if ($('#dealHealthGrid').length) {
    $('#dealHealthGrid').dxDataGrid({
      dataSource: getDealHealthRows(state), keyExpr: 'id', showBorders: true, rowAlternationEnabled: true, paging: { pageSize: 5 },
      searchPanel: { visible: true, width: 220, placeholder: 'Search deals...' },
      columns: [{ dataField: 'title', caption: 'Deal' }, { dataField: 'stage', width: 100 }, { dataField: 'value', caption: 'Value', dataType: 'number', format: { type: 'currency', currency: 'GBP', precision: 0 } }, { dataField: 'probability', caption: 'Win %', width: 90 }, { dataField: 'velocity', caption: 'Velocity', width: 100 }],
      onRowClick: (ev) => deps.onSelectDeal(ev.data.id)
    });
  }
  if ($('#dealActivityAccordion').length) {
    const summary = getStageSummary(state).map((s) => ({ title: `${s.stage} (${s.count})`, text: `Pipeline value: ${formatCurrency(s.value)}` }));
    $('#dealActivityAccordion').dxAccordion({ dataSource: summary, multiple: true, collapsible: true, itemTitleTemplate: (item) => item.title, itemTemplate: (item) => `<div class="p-2">${item.text}</div>` });
  }
}
