import { normalizeDateValue } from '../../utils/formatters';

const AT_RISK_WINDOW_MS = 6 * 60 * 60 * 1000;

function hasAgentReply(email) {
  if (email.from === 'You') return true;
  return (email.thread ?? []).some((message) => message.from === 'You');
}

function getThreadMessageTime(message) {
  return normalizeDateValue(message.at)?.getTime() ?? 0;
}

function getFirstResponseTimeMs(email) {
  const emailTime = normalizeDateValue(email.date)?.getTime();
  if (!emailTime) return null;
  const firstAgentMessage = (email.thread ?? [])
    .filter((message) => message.from === 'You')
    .map(getThreadMessageTime)
    .filter(Boolean)
    .sort((a, b) => a - b)[0];
  if (!firstAgentMessage || firstAgentMessage < emailTime) return null;
  return firstAgentMessage - emailTime;
}

function getResolutionTimeMs(email) {
  const emailTime = normalizeDateValue(email.date)?.getTime();
  if (!emailTime) return null;
  const threadTimes = (email.thread ?? []).map(getThreadMessageTime).filter(Boolean);
  const lastThreadTime = threadTimes.length > 0 ? Math.max(...threadTimes) : null;
  if (!lastThreadTime || lastThreadTime < emailTime) return null;
  return lastThreadTime - emailTime;
}

function median(values = []) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const midpoint = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return sorted[midpoint];
  return (sorted[midpoint - 1] + sorted[midpoint]) / 2;
}

function buildReasonCodeDistribution(emails = []) {
  const counts = new Map();
  const increment = (reason) => {
    counts.set(reason, (counts.get(reason) ?? 0) + 1);
  };

  for (const email of emails) {
    if (email.reasonCode) {
      increment(String(email.reasonCode));
      continue;
    }

    if ((email.slaEscalations ?? []).length) {
      increment('sla_escalated');
      continue;
    }

    if ((email.approvalStatus ?? 'none') === 'rejected') {
      increment('approval_rejected');
      continue;
    }

    if ((email.approvalStatus ?? 'none') === 'required') {
      increment('approval_required');
      continue;
    }

    if (!email.assigneeId) {
      increment('unassigned');
      continue;
    }

    increment('general_inquiry');
  }

  return Array.from(counts.entries())
    .map(([reasonCode, count]) => ({ reasonCode, count }))
    .sort((a, b) => b.count - a.count);
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

export function buildMacroAnalytics(macroTemplates = [], macroUsageLog = [], now = new Date()) {
  const templateMap = new Map(macroTemplates.map((template) => [template.id, template]));
  const usageByTemplate = new Map();
  const usageByCategory = new Map();
  const reviewers = new Set();
  const last30Cutoff = now.getTime() - 30 * 24 * 60 * 60 * 1000;
  let recentUsageCount = 0;

  for (const event of macroUsageLog) {
    const template = templateMap.get(event.templateId);
    if (!template) continue;

    const usageTime = normalizeDateValue(event.insertedAt)?.getTime() ?? 0;
    if (usageTime >= last30Cutoff) {
      recentUsageCount += 1;
    }

    reviewers.add(event.userId || 'unknown');

    const templateUsage = usageByTemplate.get(template.id) ?? {
      templateId: template.id,
      title: template.title,
      category: template.category,
      usageCount: 0,
      lastUsedAt: null,
      archived: Boolean(template.isArchived)
    };

    templateUsage.usageCount += 1;
    if (!templateUsage.lastUsedAt || usageTime > normalizeDateValue(templateUsage.lastUsedAt)?.getTime()) {
      templateUsage.lastUsedAt = event.insertedAt;
    }
    usageByTemplate.set(template.id, templateUsage);

    usageByCategory.set(template.category, (usageByCategory.get(template.category) ?? 0) + 1);
  }

  const sortedTemplateUsage = Array.from(usageByTemplate.values()).sort((a, b) => b.usageCount - a.usageCount);

  return {
    totalMacros: macroTemplates.length,
    activeMacros: macroTemplates.filter((template) => !template.isArchived).length,
    archivedMacros: macroTemplates.filter((template) => template.isArchived).length,
    totalMacroUsages: macroUsageLog.length,
    recentMacroUsages: recentUsageCount,
    uniqueReviewers: reviewers.size,
    templateUsage: sortedTemplateUsage,
    categoryUsage: Array.from(usageByCategory.entries())
      .map(([category, usageCount]) => ({ category, usageCount }))
      .sort((a, b) => b.usageCount - a.usageCount)
  };
}

export function buildDashboardMetrics(deals, emails, pipelineStages, now = new Date(), macroTemplates = [], macroUsageLog = []) {
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
  const macroAnalytics = buildMacroAnalytics(macroTemplates, macroUsageLog, now);
  const firstResponseSamples = emailsWithSla.map(getFirstResponseTimeMs).filter((value) => Number.isFinite(value));
  const resolutionSamples = emailsWithSla.map(getResolutionTimeMs).filter((value) => Number.isFinite(value));
  const reopenedCount = emailsWithSla.filter((email) => {
    const thread = email.thread ?? [];
    let firstAgentReplyIndex = -1;
    for (let index = 0; index < thread.length; index += 1) {
      if (thread[index].from === 'You') {
        firstAgentReplyIndex = index;
        break;
      }
    }
    if (firstAgentReplyIndex === -1) return false;
    const postReplyInbound = thread.slice(firstAgentReplyIndex + 1).filter((message) => message.from !== 'You');
    return postReplyInbound.length > 0;
  }).length;
  const stageAging = [
    ...pipelineStages.map((stage) => stage ?? ''),
    ...new Set(deals.map((deal) => deal.stage).filter((stage) => !pipelineStages.includes(stage)))
  ].map((stage) => {
    const stageDeals = deals.filter((deal) => deal.stage === stage);
    const days = stageDeals
      .map((deal) => Number(deal.days))
      .filter((value) => Number.isFinite(value) && value >= 0);
    return {
      stage,
      dealCount: stageDeals.length,
      avgDays: days.length ? days.reduce((sum, value) => sum + value, 0) / days.length : 0,
      medianDays: median(days)
    };
  });
  const reasonCodeDistribution = buildReasonCodeDistribution(emailsWithSla);

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
    overdueEmailCount: emailsWithSla.filter((email) => ['overdue', 'breached'].includes(email.computedSlaStatus)).length,
    medianFirstResponseTimeMs: median(firstResponseSamples),
    medianResolutionTimeMs: median(resolutionSamples),
    reopenRate: emailsWithSla.length > 0 ? reopenedCount / emailsWithSla.length : 0,
    stageAging,
    reasonCodeDistribution,
    macroAnalytics
  };
}
