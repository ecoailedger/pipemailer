import { formatCurrency, formatRelativeFromNow, normalizeDateValue } from '../utils/formatters.js';

function getDealEmailStats(state, dealId) {
  const emails = state.emails.filter((e) => e.dealId === dealId);
  if (!emails.length) return { count: 0, lastLabel: 'No email yet', direction: 'none', stale: true };
  const sorted = emails.slice().sort((a, b) => (normalizeDateValue(b.date)?.getTime() || 0) - (normalizeDateValue(a.date)?.getTime() || 0));
  const latest = sorted[0];
  const latestDate = normalizeDateValue(latest.date);
  const stale = latestDate ? ((Date.now() - latestDate.getTime()) / (1000 * 60 * 60 * 24) > 14) : false;
  return { count: emails.length, relative: formatRelativeFromNow(latest.date), direction: latest.folder === 'sent' ? 'sent' : 'received', stale };
}

function dealCardTemplate(deal, stats) {
  const staleChip = stats.stale ? '<div class="activity-chip warn-chip">No touch 14d+</div>' : '';
  return `<div class="deal-card" data-id="${deal.id}"><div>${deal.title}</div><div class="info-row">${deal.contact}</div><div class="deal-value">${formatCurrency(deal.value)}</div><div class="activity-chip">Last email: ${stats.relative || '—'}</div><div class="activity-chip">${stats.direction === 'sent' ? 'Sent' : 'Received'}</div><div class="activity-chip">${stats.count} emails</div>${staleChip}</div>`;
}

export function renderKanban(state, { onSelectDeal, onMoveDeal, notify, refreshInsights }) {
  const $ = window.jQuery;
  $('#kanbanView .kanban-body').each(function dispose() {
    const inst = $(this).data('dxSortable');
    if (inst?.dispose) inst.dispose();
  });

  const $k = $('#kanbanView').empty();
  const row = $('<div class="kanban-row"></div>').appendTo($k);
  state.pipelineStages.forEach((stage) => {
    const col = $(`<div class="kanban-col"><div class="kanban-head">${stage}</div><div class="kanban-body"></div></div>`);
    row.append(col);
    const deals = state.deals.filter((d) => d.stage === stage);
    const body = col.find('.kanban-body');
    if (!deals.length) body.append('<div class="empty-state">No deals</div>');

    deals.forEach((d) => body.append(dealCardTemplate(d, getDealEmailStats(state, d.id))));

    body.dxSortable({
      group: 'deals', data: { stage }, filter: '.deal-card', itemOrientation: 'vertical', moveItemOnDrop: true,
      onDragStart: () => $('#kanbanView .kanban-body .empty-state').remove(),
      onAdd: (e) => {
        const dealId = Number($(e.itemElement).data('id'));
        const fromStage = e.fromData?.stage;
        const toStage = e.toData?.stage;
        if (dealId && toStage && fromStage !== toStage) {
          onMoveDeal(dealId, toStage);
          notify(`Deal moved to ${toStage}`);
          refreshInsights();
        }
        renderKanban(state, { onSelectDeal, onMoveDeal, notify, refreshInsights });
      }
    });
  });

  $('.deal-card').on('click', function onDealClick() { onSelectDeal(Number($(this).data('id'))); });
}
