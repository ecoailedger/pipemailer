import { AppState } from './state.js';
import { renderEmailList } from './render/emailList.js';
import { renderKanban } from './render/kanban.js';
import { renderRightPanel } from './render/rightPanel.js';
import { formatCurrency } from './utils/formatters.js';
import { initPopups } from './ui/popups.js';

const $ = window.jQuery;
const rightPaneResizeStorageKey = 'pipemailer.rightPaneWidth.v1';
const rightPaneMediaQuery = window.matchMedia('(max-width: 992px)');
const rightPaneUiState = { isNarrow: rightPaneMediaQuery.matches, detailsExpanded: false, dragging: false, pointerId: null };

function notify(msg, type) { $('#toast').dxToast({ message: msg, type: type || 'success', displayTime: 1800, width: 320 }).dxToast('instance').show(); }

function renderShell() {
  $('#app').html(`<div class="app-shell"><div class="topbar"><div class="logo">Pipe<span>Mailer</span></div><div id="searchBox"></div><div class="top-actions"><div id="composeBtn"></div><div id="themeBtn"></div><div id="notifBtn"></div></div></div><div class="content"><aside class="panel"><div class="section-title">Navigation</div><div id="folders"></div><div class="section-title">Pipeline Stages</div><div id="pipelineStages"></div><div class="view-toggle"><div id="emailViewBtn"></div><div id="pipelineViewBtn"></div></div><div class="section-title">Smart Actions</div><div class="action-grid"><div id="markReadBtn"></div><div id="newDealBtn"></div></div><div class="insights-card"><div class="font-semibold">Today</div><div class="insight-row"><span>Unread emails</span><strong id="unreadCount">0</strong></div><div class="insight-row"><span>Open pipeline</span><strong id="openDealCount">0</strong></div></div><div id="stageChart"></div></aside><main class="panel"><div id="emailListContainer"><div id="emailList"></div></div><div id="kanbanView"></div></main><div id="rightPaneResizeHandle" aria-hidden="true"></div><section class="panel right-panel"><div class="right-header"><strong id="detailTitle">No item selected</strong><div class="d-flex gap-2 items-center"><div id="toggleDetailsBtn"></div><div id="linkBtn"></div><div id="quickActionsMenu"></div></div></div><div id="detailTabs"></div></section></div></div><div id="composePopup"></div><div id="notePopup"></div><div id="dealPopup"></div><div id="linkPopup"></div><div id="searchPopup"></div><div id="toast"></div><div id="sendLoadPanel"></div>`);
}

function renderStageChart() {
  const dataSource = AppState.pipelineStages.map((stage) => ({ stage, count: AppState.deals.filter((d) => d.stage === stage).length }));
  $('#stageChart').dxPieChart({ dataSource, type: 'doughnut', palette: 'Soft', series: [{ argumentField: 'stage', valueField: 'count', label: { visible: true, format: 'fixedPoint' } }], legend: { horizontalAlignment: 'center', verticalAlignment: 'bottom' }, size: { height: 178 } });
}

function refreshInsights() {
  $('#unreadCount').text(AppState.emails.filter((e) => !e.isRead).length);
  $('#openDealCount').text(AppState.deals.filter((d) => d.stage !== 'Won' && d.stage !== 'Lost').length);
  renderStageChart();
}

export function renderApp() {
  renderEmailList(AppState, (id) => { AppState.selectEmail(id); renderApp(); });
  if (AppState.currentView === 'pipeline') {
    $('#emailListContainer').hide(); $('#kanbanView').show();
    renderKanban(AppState, { onSelectDeal: (id) => { AppState.selectDeal(id); renderApp(); }, onMoveDeal: (id, stage) => AppState.moveDealToStage(id, stage), notify, refreshInsights });
  } else {
    $('#emailListContainer').show(); $('#kanbanView').hide();
  }
  renderRightPanel(AppState, {
    onSelectDeal: (id) => { AppState.selectDeal(id); renderApp(); },
    bindRightPanelInteractions: () => {
      if ($('#addNoteBtn').length) $('#addNoteBtn').dxButton({ text: 'Add note', onClick: () => $('#notePopup').dxPopup('instance').show() });
      if ($('#linkBtn').length) $('#linkBtn').dxButton({ text: 'Link Email', stylingMode: 'text', onClick: () => $('#linkPopup').dxPopup('instance').show() });
    }
  });
  refreshInsights();
}

function toggleTheme() {
  AppState.themeMode = AppState.themeMode === 'light' ? 'dark' : 'light';
  const vars = AppState.themeMode === 'dark' ? { '--bg-base': '#0d1117', '--bg-surface': '#161b22', '--bg-elevated': '#21262d', '--bg-hover': '#30363d', '--accent': '#00d4aa', '--accent-dim': '#00d4aa33', '--text-primary': '#e6edf3', '--text-secondary': '#8b949e', '--text-muted': '#484f58', '--border': '#30363d', '--border-subtle': '#21262d' } : { '--bg-base': '#f6f8fb', '--bg-surface': '#ffffff', '--bg-elevated': '#f8fafc', '--bg-hover': '#eef2f7', '--accent': '#0f766e', '--accent-dim': '#0f766e1f', '--text-primary': '#0f172a', '--text-secondary': '#475569', '--text-muted': '#94a3b8', '--border': '#dbe3ee', '--border-subtle': '#e7edf5' };
  Object.keys(vars).forEach((k) => document.documentElement.style.setProperty(k, vars[k]));
  notify(`Switched to ${AppState.themeMode} mode`);
}

function initUiChrome() {
  $('#composeBtn').dxButton({ text: 'Add Email', type: 'success', onClick: () => $('#composePopup').dxPopup('instance').show() });
  $('#themeBtn').dxButton({ text: 'Theme', icon: 'contrast', stylingMode: 'outlined', onClick: toggleTheme });
  $('#notifBtn').dxButton({ icon: 'bell', hint: 'Notifications' });
  $('#emailViewBtn').dxButton({ text: 'Email View', stylingMode: 'outlined', onClick: () => { AppState.currentView = 'email'; renderApp(); } });
  $('#pipelineViewBtn').dxButton({ text: 'Pipeline View', stylingMode: 'outlined', onClick: () => { AppState.currentView = 'pipeline'; renderApp(); } });
  $('#folders').dxList({ dataSource: [{ name: 'Inbox', id: 'inbox' }, { name: 'Sent', id: 'sent' }, { name: 'Drafts', id: 'drafts' }, { name: 'Archive', id: 'archive' }], height: 176, itemTemplate: (i) => `<div>${i.name} <span class="count-muted">(${AppState.emails.filter((e) => e.folder === i.id).length})</span></div>`, onItemClick: (e) => { AppState.selectedFolder = e.itemData.id; renderApp(); } });
  $('#pipelineStages').dxList({ dataSource: AppState.pipelineStages, height: 200, itemTemplate: (s) => `<div>${s} <span class="count-muted">(${AppState.deals.filter((d) => d.stage === s).length})</span></div>`, onItemClick: () => { AppState.currentView = 'pipeline'; renderApp(); } });
  $('#markReadBtn').dxButton({ text: 'Mark inbox read', stylingMode: 'outlined', onClick: () => { AppState.emails.forEach((e) => { if (e.folder === 'inbox') e.isRead = true; }); renderApp(); notify('Inbox marked as read'); } });
  $('#newDealBtn').dxButton({ text: 'Quick add deal', stylingMode: 'outlined', onClick: () => $('#dealPopup').dxPopup('instance').show() });
  $('#toggleDetailsBtn').dxButton({ text: 'Expand details', icon: 'chevrondoubleright', stylingMode: 'outlined' });
  $('#searchBox').dxTextBox({ placeholder: 'Search emails and deals...', mode: 'search' });
  $('#quickActionsMenu').dxDropDownButton({ text: 'More', icon: 'overflow', stylingMode: 'text', displayExpr: 'text', keyExpr: 'id', items: [{ id: 'openCompose', text: 'Compose new email' }, { id: 'focusPipeline', text: 'Open pipeline view' }], onItemClick: (e) => { if (e.item.id === 'openCompose') $('#composePopup').dxPopup('instance').show(); if (e.item.id === 'focusPipeline') { AppState.currentView = 'pipeline'; renderApp(); } } });
}

function initPopupsAndActions() {
  initPopups(AppState, {
    saveCapturedEmail: () => {
      const sender = $('#senderField').dxTextBox('instance').option('value') || 'Unknown sender';
      const subject = $('#subField').dxTextBox('instance').option('value') || '(No subject)';
      const body = $('#rawBodyField').dxTextArea('instance').option('value') || '';
      const mode = $('#emailModeField').dxRadioGroup('instance').option('value');
      const dealId = $('#linkDeal').dxSelectBox('instance').option('value') || null;
      if (!body.trim()) { notify('Please add email content before saving', 'warning'); return; }
      AppState.emails.unshift({ id: Date.now(), folder: 'inbox', from: sender, to: 'sales@pipemailer.local', cc: '', subject, snippet: body.slice(0, 90), date: new Date().toISOString(), isRead: false, isStarred: false, dealId, body, thread: [{ from: sender, at: new Date().toISOString(), body }], mode });
      sessionStorage.removeItem(AppState.addEmailDraftKey);
      $('#composePopup').dxPopup('instance').hide();
      renderApp();
      notify(mode === 'note' ? 'Internal note saved' : 'Email captured');
    },
    saveDealNote: () => {
      const note = $('#noteArea').dxTextArea('instance').option('value');
      if (AppState.selectedDealId && note) { AppState.addDealNote(AppState.selectedDealId, note); $('#notePopup').dxPopup('instance').hide(); renderApp(); notify('Note saved'); }
    },
    renderDealPopup: (c) => {
      c.append('<div id="dealForm"></div><div id="saveDeal" class="mt-3"></div>');
      const formData = { title: '', contact: '', value: 15000, stage: 'Leads', probability: 25, tags: [] };
      $('#dealForm').dxForm({ formData, labelMode: 'floating', items: [{ dataField: 'title', editorType: 'dxTextBox', isRequired: true }, { dataField: 'contact', editorType: 'dxTextBox', isRequired: true }, { dataField: 'value', editorType: 'dxNumberBox' }, { dataField: 'stage', editorType: 'dxSelectBox', editorOptions: { dataSource: AppState.pipelineStages } }] });
      $('#saveDeal').dxButton({ text: 'Save deal', type: 'success', onClick: () => { const data = $('#dealForm').dxForm('instance').option('formData'); if (!data.title || !data.contact) return; AppState.deals.unshift({ id: Date.now(), title: data.title, contact: data.contact, value: Number(data.value) || 10000, stage: data.stage || 'Leads', probability: Number(data.probability) || 20, days: 1, notes: ['Deal created from quick action'] }); $('#dealPopup').dxPopup('instance').hide(); renderApp(); notify('New deal added'); } });
    },
    renderLinkPopup: (c) => {
      c.append('<div id="linkSourceSelector"></div><div id="linkTargetSelector" class="mt-3"></div><div id="confirmLinkBtn" class="mt-5"></div>');
      const isEmailContext = AppState.rightPanelMode === 'email';
      $('#linkSourceSelector').dxSelectBox({ dataSource: isEmailContext ? AppState.emails : AppState.deals, displayExpr: isEmailContext ? (item) => `${item.subject} · ${item.from}` : 'title', valueExpr: 'id', value: isEmailContext ? AppState.selectedEmailId : AppState.selectedDealId, searchEnabled: true, labelMode: 'static' });
      $('#linkTargetSelector').dxSelectBox({ dataSource: isEmailContext ? AppState.deals : AppState.emails, displayExpr: isEmailContext ? 'title' : (item) => `${item.subject} · ${item.from}`, valueExpr: 'id', searchEnabled: true, labelMode: 'static' });
      $('#confirmLinkBtn').dxButton({ text: 'Confirm Link', type: 'success', onClick: () => { const sourceId = $('#linkSourceSelector').dxSelectBox('instance').option('value'); const targetId = $('#linkTargetSelector').dxSelectBox('instance').option('value'); if (!sourceId || !targetId) return; const emailId = isEmailContext ? sourceId : targetId; const dealId = isEmailContext ? targetId : sourceId; AppState.linkEmailToDeal(emailId, dealId); $('#linkPopup').dxPopup('instance').hide(); renderApp(); notify('Email linked to deal'); } });
    }
  });
}

function init() {
  renderShell();
  initUiChrome();
  initPopupsAndActions();
  renderApp();
}

$(init);
