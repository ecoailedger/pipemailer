export function buildDashboardMetrics(deals, emails, pipelineStages) {
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
    sentEmailCount: emails.filter((email) => email.folder === 'sent').length
  };
}
