import { formatCurrency, formatRelativeFromNow, normalizeDateValue } from '../utils/formatters.js';

let activeMoveContext = null;
let isKanbanClickBound = false;

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

function isValidTargetStage(stageSet, stage) {
  return Boolean(stage && stageSet.has(stage));
}

function shouldRejectMove(moveContext) {
  return moveContext.fromStage === moveContext.toStage && moveContext.originalIndex === moveContext.targetIndex;
}

function warnMove(notify, message) {
  notify(message, 'warning');
}

function bindKanbanSelection($, onSelectDeal) {
  const $kanban = $('#kanbanView');
  $kanban.data('onSelectDeal', onSelectDeal);

  if (isKanbanClickBound) return;

  $kanban.off('click.kanbanSelect').on('click.kanbanSelect', '.deal-card', function onDealClick() {
    const dealId = Number($(this).data('id'));
    const selectDeal = $kanban.data('onSelectDeal');
    if (!dealId || typeof selectDeal !== 'function') return;
    selectDeal(dealId);
  });

  isKanbanClickBound = true;
}

export function renderKanban(state, { onSelectDeal, onMoveDeal, notify, refreshInsights }) {
  const $ = window.jQuery;
  const stageSet = new Set(state.pipelineStages);

  bindKanbanSelection($, onSelectDeal);

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
      group: 'deals',
      data: { stage },
      filter: '.deal-card',
      itemOrientation: 'vertical',
      moveItemOnDrop: true,
      onDragStart: (e) => {
        const dealId = Number($(e.itemElement).data('id'));
        const fromStage = e.fromData?.stage;
        const originalIndex = Number.isInteger(e.fromIndex) ? e.fromIndex : -1;

        if (!dealId) {
          warnMove(notify, 'Could not identify the selected deal for drag operation.');
          e.cancel = true;
          activeMoveContext = null;
          return;
        }

        if (!isValidTargetStage(stageSet, fromStage)) {
          warnMove(notify, 'Unable to drag from an unknown stage.');
          e.cancel = true;
          activeMoveContext = null;
          return;
        }

        $('#kanbanView .kanban-body .empty-state').remove();
        activeMoveContext = {
          dealId,
          fromStage,
          toStage: fromStage,
          originalIndex,
          targetIndex: originalIndex,
          isValidDrop: false,
          warned: false
        };
      },
      onDragChange: (e) => {
        if (!activeMoveContext) return;

        const toStage = e.toData?.stage;
        const targetIndex = Number.isInteger(e.toIndex) ? e.toIndex : activeMoveContext.targetIndex;
        activeMoveContext.toStage = toStage;
        activeMoveContext.targetIndex = targetIndex;

        if (!isValidTargetStage(stageSet, toStage)) {
          e.cancel = true;
          if (!activeMoveContext.warned) {
            warnMove(notify, 'Cannot move deal to an unknown pipeline stage.');
            activeMoveContext.warned = true;
          }
          return;
        }

        if (shouldRejectMove(activeMoveContext)) {
          e.cancel = true;
        }
      },
      onRemove: () => {
        if (!activeMoveContext) return;
        activeMoveContext.removed = true;
      },
      onAdd: (e) => {
        if (!activeMoveContext) {
          e.cancel = true;
          warnMove(notify, 'Move context was lost before drop. Please try again.');
          return;
        }

        const toStage = e.toData?.stage;
        const targetIndex = Number.isInteger(e.toIndex) ? e.toIndex : activeMoveContext.targetIndex;
        activeMoveContext.toStage = toStage;
        activeMoveContext.targetIndex = targetIndex;

        if (!isValidTargetStage(stageSet, toStage)) {
          e.cancel = true;
          warnMove(notify, 'Cannot drop deal into an unknown pipeline stage.');
          return;
        }

        if (shouldRejectMove(activeMoveContext)) {
          e.cancel = true;
          return;
        }

        activeMoveContext.isValidDrop = true;
      },
      onDragEnd: () => {
        const moveContext = activeMoveContext;
        activeMoveContext = null;

        if (!moveContext) return;

        if (!moveContext.isValidDrop) {
          return;
        }

        const dealExists = state.deals.some((d) => d.id === moveContext.dealId);
        if (!dealExists) {
          warnMove(notify, 'Moved deal no longer exists. Refresh and try again.');
          return;
        }

        if (!isValidTargetStage(stageSet, moveContext.toStage)) {
          warnMove(notify, 'Cannot complete move: destination stage is invalid.');
          return;
        }

        onMoveDeal(moveContext.dealId, moveContext.toStage);
        notify(`Deal moved to ${moveContext.toStage}`);
        refreshInsights();
        renderKanban(state, { onSelectDeal, onMoveDeal, notify, refreshInsights });
      }
    });
  });
}
