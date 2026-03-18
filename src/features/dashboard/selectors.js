import { normalizeDateValue } from '../../utils/formatters';

const AT_RISK_WINDOW_MS = 6 * 60 * 60 * 1000;

function hasAgentReply(email) {
  if (email.from === 'You') return true;
  return (email.thread ?? []).some((message) => message.from === 'You');
}

export function computeSlaStatus(email, now = new Date()) {
  if (email.slaStatus === 'breached') return 'breached';

  const firstResponseDue = normalizeDateValue(email.firstResponseDueAt);
  const resolutionDue = normalizeDateValue(email.resolutionDueAt);
  const nowTime = now.getTime();
  const responded = hasAgentReply(email);

  const isFirstResponseOverdue = Boolean(firstResponseDue && !responded && firstResponseDue.getTime() < nowTime);
  const isResolutionOverdue = Boolean(resolutionDue && resolutionDue.getTime() < nowTime);

  if (isFirstResponseOverdue || isResolutionOverdue) return 'overdue';

  const pendingDueDates = [
    !responded ? firstResponseDue : null,
    resolutionDue
  ].filter(Boolean);

  const isAtRisk = pendingDueDates.some((dueDate) => dueDate.getTime() - nowTime <= AT_RISK_WINDOW_MS);
  if (isAtRisk) return 'atRisk';

  return 'onTrack';
}

export function selectEmailsWithSla(emails, now = new Date()) {
  return emails.map((email) => ({
    ...email,
    computedSlaStatus: computeSlaStatus(email, now)
  }));
}

export function buildDashboardMetrics(deals, emails, pipelineStages, now = new Date()) {
  const totalsByStage = new Map(
    pipelineStages.map((stage) => [
      stage,
      {
        stage,
        totalValue: 0,
        dealCount: 0,
        weightedValue: 0
      }
    ])
  );

  let totalPipelineValue = 0;
  let weightedPipelineValue = 0;
  let wonDeals = 0;
  let lostDeals = 0;

  for (const deal of deals) {
    const value = Number(deal.value) || 0;
    const probability = Number.isFinite(Number(deal.probability)) ? Number(deal.probability) : 0;

    if (deal.stage !== 'Lost') {
      totalPipelineValue += value;
      weightedPipelineValue += Math.round((value * probability) / 100);
    }

    if (deal.stage === 'Won') {
      wonDeals += 1;
    }

    if (deal.stage === 'Lost') {
      lostDeals += 1;
    }

    const stageEntry =
      totalsByStage.get(deal.stage) ??
      {
        stage: deal.stage,
        totalValue: 0,
        dealCount: 0,
        weightedValue: 0
      };

    stageEntry.totalValue += value;
    stageEntry.dealCount += 1;
    stageEntry.weightedValue += Math.round((value * probability) / 100);

    if (!totalsByStage.has(deal.stage)) {
      totalsByStage.set(deal.stage, stageEntry);
    }
  }

  const closedDeals = wonDeals + lostDeals;
  const activeDeals = deals.length - lostDeals - wonDeals;

  const stageValueBreakdown = [
    ...pipelineStages.map((stage) => totalsByStage.get(stage)),
    ...Array.from(totalsByStage.values()).filter((stageSummary) => !pipelineStages.includes(stageSummary.stage))
  ];

  const emailsWithSla = selectEmailsWithSla(emails, now);

  return {
    totalDeals: deals.length,
    totalPipelineValue,
    weightedPipelineValue,
    stageValueBreakdown,
    winRate: closedDeals > 0 ? wonDeals / closedDeals : 0,
    avgDealValue: deals.length > 0 ? totalPipelineValue / deals.length : 0,
    activeDeals,
    unlinkedEmailCount: emails.filter((email) => email.dealId == null).length,
    inboxEmailCount: emails.filter((email) => email.folder === 'inbox').length,
    sentEmailCount: emails.filter((email) => email.folder === 'sent').length,
    atRiskEmailCount: emailsWithSla.filter((email) => email.computedSlaStatus === 'atRisk').length,
    overdueEmailCount: emailsWithSla.filter((email) => ['overdue', 'breached'].includes(email.computedSlaStatus)).length
  };
}
