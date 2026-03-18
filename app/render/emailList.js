import { formatDate } from '../utils/formatters.js';

function renderEmailItemTemplate(e, deals) {
  const deal = e.dealId ? deals.find((d) => d.id === e.dealId) : null;
  const unreadDot = e.isRead ? '' : '<span class="unread-dot"></span>';
  const starred = e.isStarred ? '★ ' : '';
  const badge = deal ? `<div class="badge">${deal.title}</div>` : '';
  return `<div class="email-item"><div class="email-top"><div class="email-from">${unreadDot}${e.from}</div><div class="email-date">${starred}${formatDate(e.date)}</div></div><div class="email-subject">${e.subject}</div><div class="email-snippet">${e.snippet}</div>${badge}</div>`;
}

export function renderEmailList(state, onSelectEmail) {
  const $ = window.jQuery;
  const list = state.emails.filter((e) => e.folder === state.selectedFolder);
  $('#emailList').dxList({
    dataSource: list,
    focusStateEnabled: true,
    height: '100%',
    noDataText: 'No emails in this folder',
    itemTemplate: (item) => renderEmailItemTemplate(item, state.deals),
    onItemClick: (ev) => onSelectEmail(ev.itemData.id)
  });
}
