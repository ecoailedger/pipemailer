import { formatCurrency, formatDate, normalizeDateValue } from '../utils/formatters.js';

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
    onContentReady: () => deps.bindRightPanelInteractions()
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
