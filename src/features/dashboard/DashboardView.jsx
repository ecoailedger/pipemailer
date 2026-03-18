/**
 * @param {{
 *  dashboardMetrics: {
 *    totalDeals: number,
 *    totalPipelineValue: number,
 *    stageValueBreakdown: Array<{ stage: string, totalValue: number, dealCount: number, weightedValue: number }>,
 *    winRate: number,
 *    avgDealValue: number,
 *    activeDeals: number,
 *    unlinkedEmailCount: number,
 *    inboxEmailCount: number,
 *    sentEmailCount: number
 *  }
 * }} props
 */
export default function DashboardView({ dashboardMetrics }) {
  const {
    totalDeals,
    totalPipelineValue,
    stageValueBreakdown,
    winRate,
    avgDealValue,
    activeDeals,
    unlinkedEmailCount,
    inboxEmailCount,
    sentEmailCount
  } = dashboardMetrics;

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <article className="panel-card">
        <h3>Total Deals</h3>
        <p className="panel-value">{totalDeals}</p>
      </article>
      <article className="panel-card">
        <h3>Pipeline Value</h3>
        <p className="panel-value">${Math.round(totalPipelineValue).toLocaleString()}</p>
      </article>
      <article className="panel-card">
        <h3>Win Rate</h3>
        <p className="panel-value">{(winRate * 100).toFixed(1)}%</p>
      </article>
      <article className="panel-card">
        <h3>Avg Deal Value</h3>
        <p className="panel-value">${Math.round(avgDealValue).toLocaleString()}</p>
      </article>

      <article className="panel-card">
        <h3>Active Deals</h3>
        <p className="panel-value">{activeDeals}</p>
      </article>
      <article className="panel-card">
        <h3>Inbox Emails</h3>
        <p className="panel-value">{inboxEmailCount}</p>
      </article>
      <article className="panel-card">
        <h3>Sent Emails</h3>
        <p className="panel-value">{sentEmailCount}</p>
      </article>
      <article className="panel-card">
        <h3>Unlinked Emails</h3>
        <p className="panel-value">{unlinkedEmailCount}</p>
      </article>

      <article className="panel-card md:col-span-2 xl:col-span-4">
        <h3>Deals by Stage</h3>
        <ul className="dashboard-stage-list">
          {stageValueBreakdown.map((item) => (
            <li key={item.stage}>
              <span>{item.stage}</span>
              <strong>
                {item.dealCount} deals · ${Math.round(item.totalValue).toLocaleString()} · weighted ${Math.round(
                  item.weightedValue
                ).toLocaleString()}
              </strong>
            </li>
          ))}
        </ul>
      </article>
    </div>
  );
}
