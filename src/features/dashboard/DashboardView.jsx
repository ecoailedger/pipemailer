import Chart, { ArgumentAxis, CommonSeriesSettings, Label, Legend, Series, Tooltip, ValueAxis } from 'devextreme-react/chart';
import { formatCurrency, formatDate, normalizeDateValue } from '../../utils/formatters';

const KPI_ITEMS = [
  { key: 'totalPipelineValue', label: 'Total Pipeline', format: (value) => formatCurrency(value) },
  { key: 'weightedPipelineValue', label: 'Weighted Pipeline', format: (value) => formatCurrency(value) },
  { key: 'winRate', label: 'Win Rate', format: (value) => `${(value * 100).toFixed(1)}%` },
  { key: 'avgDealValue', label: 'Avg Deal Value', format: (value) => formatCurrency(value) },
  { key: 'activeDeals', label: 'Active Deals', format: (value) => String(value) },
  { key: 'unlinkedEmailCount', label: 'Unlinked Emails', format: (value) => String(value) }
];

function getEmailSortValue(email) {
  return normalizeDateValue(email.date)?.getTime() ?? 0;
}

function getDealSortValue(deal) {
  const dated = normalizeDateValue(deal.updatedAt) ?? normalizeDateValue(deal.createdAt);
  if (dated) return dated.getTime();

  const days = Number.isFinite(Number(deal.days)) ? Number(deal.days) : Number.MAX_SAFE_INTEGER;
  return -days;
}

/**
 * @param {{
 *  dashboardMetrics: {
 *    totalPipelineValue: number,
 *    weightedPipelineValue: number,
 *    stageValueBreakdown: Array<{ stage: string, totalValue: number, dealCount: number, weightedValue: number }>,
 *    winRate: number,
 *    avgDealValue: number,
 *    activeDeals: number,
 *    unlinkedEmailCount: number
 *  },
 *  emails: Array<{ id: number, subject: string, from: string, date: string, dealId?: number | null }>,
 *  deals: Array<{ id: number, title: string, stage: string, days?: number, createdAt?: string, updatedAt?: string }>
 * }} props
 */
export default function DashboardView({ dashboardMetrics, emails, deals }) {
  const recentEmails = [...emails].sort((a, b) => getEmailSortValue(b) - getEmailSortValue(a)).slice(0, 6);
  const recentDealUpdates = [...deals].sort((a, b) => getDealSortValue(b) - getDealSortValue(a)).slice(0, 6);

  return (
    <div className="dashboard-grid">
      <section className="dashboard-section">
        <h3>Pipeline Snapshot</h3>
        <div className="dashboard-kpis">
          {KPI_ITEMS.map((item) => (
            <article className="kpi-card" key={item.key}>
              <p className="kpi-label">{item.label}</p>
              <p className="kpi-value">{item.format(dashboardMetrics[item.key])}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="dashboard-section">
        <h3>Stage Value</h3>
        <Chart id="stageValueChart" dataSource={dashboardMetrics.stageValueBreakdown} palette="Soft Blue" height={320}>
          <CommonSeriesSettings argumentField="stage" type="stackedBar" />
          <ArgumentAxis>
            <Label overlappingBehavior="stagger" />
          </ArgumentAxis>
          <ValueAxis>
            <Label customizeText={(point) => formatCurrency(point.value)} />
          </ValueAxis>
          <Series valueField="totalValue" name="Total Value" />
          <Series valueField="weightedValue" name="Weighted Value" />
          <Legend verticalAlignment="bottom" horizontalAlignment="center" />
          <Tooltip
            enabled
            shared
            customizeTooltip={(info) => ({
              text: `${info.seriesName}: ${formatCurrency(info.value)}`
            })}
          />
        </Chart>
      </section>

      <section className="dashboard-section">
        <h3>Recent Emails</h3>
        <ul className="dashboard-list">
          {recentEmails.map((email) => (
            <li key={email.id}>
              <div className="dashboard-list-head">
                <strong>{email.subject}</strong>
                <span>{formatDate(email.date)}</span>
              </div>
              <p>{email.from}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="dashboard-section">
        <h3>Recent Deal Updates</h3>
        <ul className="dashboard-list">
          {recentDealUpdates.map((deal) => (
            <li key={deal.id}>
              <div className="dashboard-list-head">
                <strong>{deal.title}</strong>
                <span>{deal.stage}</span>
              </div>
              <p>
                {deal.updatedAt || deal.createdAt
                  ? `Updated ${formatDate(deal.updatedAt || deal.createdAt)}`
                  : `Freshness: ${Number.isFinite(Number(deal.days)) ? `${deal.days} day(s)` : 'unknown'}`}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
