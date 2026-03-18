import { useMemo, useState } from 'react';
import Chart, { ArgumentAxis, CommonSeriesSettings, Label, Legend, Series, Tooltip, ValueAxis } from 'devextreme-react/chart';
import { formatCurrency, formatDate, normalizeDateValue } from '../../utils/formatters';

const KPI_ITEMS = [
  { key: 'totalPipelineValue', label: 'Total Pipeline', format: (value) => formatCurrency(value) },
  { key: 'weightedPipelineValue', label: 'Weighted Pipeline', format: (value) => formatCurrency(value) },
  { key: 'winRate', label: 'Win Rate', format: (value) => `${(value * 100).toFixed(1)}%` },
  { key: 'avgDealValue', label: 'Avg Deal Value', format: (value) => formatCurrency(value) },
  { key: 'activeDeals', label: 'Active Deals', format: (value) => String(value) },
  { key: 'unlinkedEmailCount', label: 'Unlinked Emails', format: (value) => String(value) },
  { key: 'atRiskEmailCount', label: 'SLA At Risk', format: (value) => String(value) },
  { key: 'overdueEmailCount', label: 'SLA Overdue', format: (value) => String(value) }
];

const EMPTY_MACRO_FORM = {
  id: null,
  title: '',
  category: '',
  body: ''
};

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
 *    unlinkedEmailCount: number,
 *    atRiskEmailCount: number,
 *    overdueEmailCount: number,
 *    macroAnalytics?: {
 *      totalMacros: number,
 *      activeMacros: number,
 *      archivedMacros: number,
 *      totalMacroUsages: number,
 *      recentMacroUsages: number,
 *      uniqueReviewers: number,
 *      templateUsage: Array<{templateId:string,title:string,category:string,usageCount:number,lastUsedAt:string|null,archived:boolean}>,
 *      categoryUsage: Array<{category:string,usageCount:number}>
 *    }
 *  },
 *  emails: Array<{ id: number, subject: string, from: string, date: string, dealId?: number | null }>,
 *  deals: Array<{ id: number, title: string, stage: string, days?: number, createdAt?: string, updatedAt?: string }>,
 *  macroTemplates: Array<{id:string,title:string,category:string,body:string,isArchived?:boolean,updatedAt?:string}>,
 *  macroCategories: Array<{id:string,label:string}>,
 *  onCreateMacro: (payload: {title:string,category:string,body:string}) => void,
 *  onUpdateMacro: (payload: {id:string,title:string,category:string,body:string}) => void,
 *  onArchiveMacro: (payload: {id:string,isArchived:boolean}) => void
 * }} props
 */
export default function DashboardView({
  dashboardMetrics,
  emails,
  deals,
  macroTemplates,
  macroCategories,
  onCreateMacro,
  onUpdateMacro,
  onArchiveMacro
}) {
  const recentEmails = [...emails].sort((a, b) => getEmailSortValue(b) - getEmailSortValue(a)).slice(0, 6);
  const recentDealUpdates = [...deals].sort((a, b) => getDealSortValue(b) - getDealSortValue(a)).slice(0, 6);
  const [macroForm, setMacroForm] = useState(EMPTY_MACRO_FORM);

  const canSubmitMacro = Boolean(macroForm.title.trim() && macroForm.category && macroForm.body.trim());

  const categoryLookup = useMemo(
    () => Object.fromEntries(macroCategories.map((category) => [category.id, category.label])),
    [macroCategories]
  );

  const submitMacro = (event) => {
    event.preventDefault();
    if (!canSubmitMacro) return;

    const payload = {
      title: macroForm.title.trim(),
      category: macroForm.category,
      body: macroForm.body.trim()
    };

    if (macroForm.id) {
      onUpdateMacro({ id: macroForm.id, ...payload });
    } else {
      onCreateMacro(payload);
    }

    setMacroForm(EMPTY_MACRO_FORM);
  };

  const analytics = dashboardMetrics.macroAnalytics ?? {
    totalMacros: 0,
    activeMacros: 0,
    archivedMacros: 0,
    totalMacroUsages: 0,
    recentMacroUsages: 0,
    uniqueReviewers: 0,
    templateUsage: [],
    categoryUsage: []
  };

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

      <section className="dashboard-section">
        <h3>Macro Quality Review</h3>
        <div className="dashboard-kpis macro-kpis">
          <article className="kpi-card"><p className="kpi-label">Total macros</p><p className="kpi-value">{analytics.totalMacros}</p></article>
          <article className="kpi-card"><p className="kpi-label">Active</p><p className="kpi-value">{analytics.activeMacros}</p></article>
          <article className="kpi-card"><p className="kpi-label">Archived</p><p className="kpi-value">{analytics.archivedMacros}</p></article>
          <article className="kpi-card"><p className="kpi-label">Total uses</p><p className="kpi-value">{analytics.totalMacroUsages}</p></article>
          <article className="kpi-card"><p className="kpi-label">Uses (30d)</p><p className="kpi-value">{analytics.recentMacroUsages}</p></article>
          <article className="kpi-card"><p className="kpi-label">Reviewers</p><p className="kpi-value">{analytics.uniqueReviewers}</p></article>
        </div>
        <ul className="dashboard-list macro-list">
          {analytics.templateUsage.slice(0, 6).map((usage) => (
            <li key={usage.templateId}>
              <div className="dashboard-list-head">
                <strong>{usage.title}</strong>
                <span>{usage.usageCount} uses</span>
              </div>
              <p>
                {categoryLookup[usage.category] ?? usage.category} · Last used {formatDate(usage.lastUsedAt)}
                {usage.archived ? ' · Archived' : ''}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section className="dashboard-section">
        <h3>Macro Template Admin</h3>
        <form className="macro-form" onSubmit={submitMacro}>
          <input
            className="macro-input"
            value={macroForm.title}
            onChange={(event) => setMacroForm((current) => ({ ...current, title: event.target.value }))}
            placeholder="Template title"
          />
          <select
            className="macro-input"
            value={macroForm.category}
            onChange={(event) => setMacroForm((current) => ({ ...current, category: event.target.value }))}
          >
            <option value="">Select category…</option>
            {macroCategories.map((category) => (
              <option value={category.id} key={category.id}>{category.label}</option>
            ))}
          </select>
          <textarea
            className="macro-input macro-body"
            value={macroForm.body}
            onChange={(event) => setMacroForm((current) => ({ ...current, body: event.target.value }))}
            placeholder="Use placeholders: {{customer_name}}, {{order_number}}, {{rma_number}}"
          />
          <div className="compose-actions">
            <button type="submit" className="dx-button dx-button-mode-contained dx-button-normal" disabled={!canSubmitMacro}>
              {macroForm.id ? 'Save macro' : 'Create macro'}
            </button>
            {macroForm.id ? (
              <button type="button" className="dx-button dx-button-mode-text dx-button-normal" onClick={() => setMacroForm(EMPTY_MACRO_FORM)}>
                Cancel edit
              </button>
            ) : null}
          </div>
        </form>

        <ul className="dashboard-list macro-list">
          {macroTemplates.map((template) => (
            <li key={template.id}>
              <div className="dashboard-list-head">
                <strong>{template.title}</strong>
                <span>{template.isArchived ? 'Archived' : 'Active'}</span>
              </div>
              <p>{categoryLookup[template.category] ?? template.category}</p>
              <p>Updated {formatDate(template.updatedAt)}</p>
              <div className="compose-actions">
                <button
                  type="button"
                  className="dx-button dx-button-mode-outlined dx-button-normal"
                  onClick={() =>
                    setMacroForm({
                      id: template.id,
                      title: template.title,
                      category: template.category,
                      body: template.body
                    })
                  }
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="dx-button dx-button-mode-text dx-button-normal"
                  onClick={() => onArchiveMacro({ id: template.id, isArchived: !template.isArchived })}
                >
                  {template.isArchived ? 'Restore' : 'Archive'}
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
