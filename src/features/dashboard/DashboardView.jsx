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
  { key: 'overdueEmailCount', label: 'SLA Overdue', format: (value) => String(value) },
  { key: 'awaitingWarehouseCount', label: 'Awaiting Warehouse', format: (value) => String(value) },
  { key: 'awaitingFinanceCount', label: 'Awaiting Finance', format: (value) => String(value) },
  { key: 'medianFirstResponseTimeMs', label: 'Median First Response', format: (value) => `${(value / (60 * 60 * 1000)).toFixed(1)}h` },
  { key: 'medianResolutionTimeMs', label: 'Median Resolution', format: (value) => `${(value / (60 * 60 * 1000)).toFixed(1)}h` },
  { key: 'reopenRate', label: 'Reopen Rate', format: (value) => `${(value * 100).toFixed(1)}%` }
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

function getMedian(values = []) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const midpoint = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[midpoint] : (sorted[midpoint - 1] + sorted[midpoint]) / 2;
}

function normalizeStageLabel(stage) {
  return String(stage ?? '').trim().toLowerCase();
}

function isAwaitingWarehouseStage(stage) {
  const normalized = normalizeStageLabel(stage);
  return normalized === 'awaiting warehouse' || normalized === 'warehouse pending';
}

function isAwaitingFinanceStage(stage) {
  const normalized = normalizeStageLabel(stage);
  return normalized === 'awaiting finance' || normalized === 'finance pending';
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
 *    awaitingWarehouseCount?: number,
 *    awaitingFinanceCount?: number,
 *    medianFirstResponseTimeMs: number,
 *    medianResolutionTimeMs: number,
 *    reopenRate: number,
 *    stageAging: Array<{stage:string,dealCount:number,avgDays:number,medianDays:number}>,
 *    reasonCodeDistribution: Array<{reasonCode:string,count:number}>,
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
 *  assignees: Array<{id:string,name:string}>,
 *  currentUserId: string,
 *  teamAssigneeIds: string[],
 *  onDrillDown?: (payload: { target: 'email' | 'pipeline', folder?: string, stage?: string, assigneeId?: string, queue?: string }) => void,
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
  assignees,
  currentUserId,
  teamAssigneeIds,
  onDrillDown,
  macroTemplates,
  macroCategories,
  onCreateMacro,
  onUpdateMacro,
  onArchiveMacro
}) {
  const [selectedAssigneeId, setSelectedAssigneeId] = useState('all');
  const [selectedTeamFilter, setSelectedTeamFilter] = useState('all');
  const [timeWindowDays, setTimeWindowDays] = useState(30);
  const [macroForm, setMacroForm] = useState(EMPTY_MACRO_FORM);

  const canSubmitMacro = Boolean(macroForm.title.trim() && macroForm.category && macroForm.body.trim());
  const timeWindowCutoff = useMemo(() => Date.now() - Number(timeWindowDays) * 24 * 60 * 60 * 1000, [timeWindowDays]);

  const assigneeOptions = useMemo(() => {
    const byId = new Map(assignees.map((assignee) => [assignee.id, assignee]));
    return Array.from(byId.values());
  }, [assignees]);

  const filteredEmails = useMemo(
    () =>
      emails.filter((email) => {
        if (selectedAssigneeId !== 'all' && email.assigneeId !== selectedAssigneeId) return false;
        if (selectedTeamFilter === 'team' && !teamAssigneeIds.includes(email.assigneeId)) return false;
        if (selectedTeamFilter === 'mine' && email.assigneeId !== currentUserId) return false;
        const emailTime = normalizeDateValue(email.date)?.getTime() ?? 0;
        return emailTime >= timeWindowCutoff;
      }),
    [currentUserId, emails, selectedAssigneeId, selectedTeamFilter, teamAssigneeIds, timeWindowCutoff]
  );

  const filteredDeals = useMemo(
    () =>
      deals.filter((deal) => {
        const updatedAt = normalizeDateValue(deal.updatedAt)?.getTime() ?? normalizeDateValue(deal.createdAt)?.getTime() ?? Date.now();
        return updatedAt >= timeWindowCutoff;
      }),
    [deals, timeWindowCutoff]
  );

  const recentEmails = [...filteredEmails].sort((a, b) => getEmailSortValue(b) - getEmailSortValue(a)).slice(0, 6);
  const recentDealUpdates = [...filteredDeals].sort((a, b) => getDealSortValue(b) - getDealSortValue(a)).slice(0, 6);

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
  const kpiValues = useMemo(() => {
    const firstResponseHours = filteredEmails
      .map((email) => {
        const emailTime = normalizeDateValue(email.date)?.getTime() ?? null;
        if (!emailTime) return null;
        const firstAgentAt = (email.thread ?? [])
          .filter((message) => message.from === 'You')
          .map((message) => normalizeDateValue(message.at)?.getTime() ?? 0)
          .filter(Boolean)
          .sort((a, b) => a - b)[0];
        return firstAgentAt && firstAgentAt > emailTime ? firstAgentAt - emailTime : null;
      })
      .filter((value) => Number.isFinite(value));
    const resolutionSamples = filteredEmails
      .map((email) => {
        const emailTime = normalizeDateValue(email.date)?.getTime() ?? null;
        if (!emailTime) return null;
        const lastActivity = (email.thread ?? [])
          .map((message) => normalizeDateValue(message.at)?.getTime() ?? 0)
          .filter(Boolean)
          .sort((a, b) => b - a)[0];
        return lastActivity && lastActivity > emailTime ? lastActivity - emailTime : null;
      })
      .filter((value) => Number.isFinite(value));
    const reopenedCount = filteredEmails.filter((email) => {
      const firstReplyIndex = (email.thread ?? []).findIndex((message) => message.from === 'You');
      if (firstReplyIndex === -1) return false;
      return (email.thread ?? []).slice(firstReplyIndex + 1).some((message) => message.from !== 'You');
    }).length;

    const filteredMetrics = {
      totalPipelineValue: filteredDeals.filter((deal) => deal.stage !== 'Lost').reduce((sum, deal) => sum + (Number(deal.value) || 0), 0),
      weightedPipelineValue: filteredDeals
        .filter((deal) => deal.stage !== 'Lost')
        .reduce((sum, deal) => sum + Math.round(((Number(deal.value) || 0) * (Number(deal.probability) || 0)) / 100), 0),
      winRate: dashboardMetrics.winRate,
      avgDealValue: filteredDeals.length
        ? filteredDeals.reduce((sum, deal) => sum + (Number(deal.value) || 0), 0) / filteredDeals.length
        : 0,
      activeDeals: filteredDeals.filter((deal) => !['Won', 'Lost'].includes(deal.stage)).length,
      unlinkedEmailCount: filteredEmails.filter((email) => email.dealId == null).length,
      atRiskEmailCount: filteredEmails.filter((email) => email.computedSlaStatus === 'atRisk').length,
      overdueEmailCount: filteredEmails.filter((email) => ['overdue', 'breached'].includes(email.computedSlaStatus)).length,
      awaitingWarehouseCount: filteredDeals.filter((deal) => deal.entityType === 'return' && isAwaitingWarehouseStage(deal.stage)).length,
      awaitingFinanceCount: filteredDeals.filter((deal) => deal.entityType === 'return' && isAwaitingFinanceStage(deal.stage)).length,
      medianFirstResponseTimeMs: getMedian(firstResponseHours),
      medianResolutionTimeMs: getMedian(resolutionSamples),
      reopenRate: filteredEmails.length ? reopenedCount / filteredEmails.length : 0
    };
    return { filteredMetrics };
  }, [dashboardMetrics.winRate, filteredDeals, filteredEmails]);

  const filteredStageValueBreakdown = useMemo(() => {
    const stageMap = new Map();
    for (const deal of filteredDeals) {
      const existing = stageMap.get(deal.stage) ?? { stage: deal.stage, totalValue: 0, weightedValue: 0, dealCount: 0 };
      const value = Number(deal.value) || 0;
      const probability = Number(deal.probability) || 0;
      existing.totalValue += value;
      existing.weightedValue += Math.round((value * probability) / 100);
      existing.dealCount += 1;
      stageMap.set(deal.stage, existing);
    }
    return Array.from(stageMap.values());
  }, [filteredDeals]);

  const filteredStageAging = useMemo(
    () =>
      filteredStageValueBreakdown.map((item) => {
        const stageDeals = filteredDeals.filter((deal) => deal.stage === item.stage);
        const days = stageDeals.map((deal) => Number(deal.days)).filter((value) => Number.isFinite(value) && value >= 0);
        return {
          stage: item.stage,
          dealCount: stageDeals.length,
          avgDays: days.length ? days.reduce((sum, value) => sum + value, 0) / days.length : 0,
          medianDays: getMedian(days)
        };
      }),
    [filteredDeals, filteredStageValueBreakdown]
  );

  const filteredReasonCodeDistribution = useMemo(() => {
    const counts = new Map();
    for (const item of filteredEmails) {
      const reason =
        item.reasonCode ??
        ((item.slaEscalations ?? []).length
          ? 'sla_escalated'
          : item.approvalStatus === 'rejected'
            ? 'approval_rejected'
            : item.approvalStatus === 'required'
              ? 'approval_required'
              : !item.assigneeId
                ? 'unassigned'
                : 'general_inquiry');
      counts.set(reason, (counts.get(reason) ?? 0) + 1);
    }
    return Array.from(counts.entries()).map(([reasonCode, count]) => ({ reasonCode, count }));
  }, [filteredEmails]);

  return (
    <div className="dashboard-grid">
      <section className="dashboard-section">
        <h3>Pipeline Snapshot</h3>
        <div className="compose-actions">
          <select className="macro-input" value={selectedAssigneeId} onChange={(event) => setSelectedAssigneeId(event.target.value)}>
            <option value="all">All assignees</option>
            {assigneeOptions.map((assignee) => (
              <option value={assignee.id} key={assignee.id}>{assignee.name}</option>
            ))}
          </select>
          <select className="macro-input" value={selectedTeamFilter} onChange={(event) => setSelectedTeamFilter(event.target.value)}>
            <option value="all">All teams</option>
            <option value="team">My team</option>
            <option value="mine">Only me</option>
          </select>
          <select className="macro-input" value={timeWindowDays} onChange={(event) => setTimeWindowDays(Number(event.target.value))}>
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
        </div>
        <div className="dashboard-kpis">
          {KPI_ITEMS.map((item) => (
            <article className="kpi-card" key={item.key}>
              <button
                type="button"
                className="dx-button dx-button-mode-text dx-button-normal"
                onClick={() => {
                  if (!onDrillDown) return;
                  if (item.key.includes('Deal') || item.key.includes('Pipeline') || item.key === 'winRate') {
                    onDrillDown({ target: 'pipeline' });
                    return;
                  }
                  onDrillDown({
                    target: 'email',
                    folder: 'inbox',
                    assigneeId: selectedAssigneeId !== 'all' ? selectedAssigneeId : undefined,
                    queue: selectedTeamFilter === 'mine' ? 'mine' : selectedTeamFilter === 'team' ? 'team' : 'all'
                  });
                }}
              >
                <p className="kpi-label">{item.label}</p>
                <p className="kpi-value">{item.format(kpiValues.filteredMetrics[item.key])}</p>
              </button>
            </article>
          ))}
        </div>
      </section>

      <section className="dashboard-section">
        <h3>Stage Value</h3>
        <Chart id="stageValueChart" dataSource={filteredStageValueBreakdown} palette="Soft Blue" height={320}>
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
        <h3>Stage Aging</h3>
        <Chart id="stageAgingChart" dataSource={filteredStageAging} palette="Soft Pastel" height={320}>
          <CommonSeriesSettings argumentField="stage" type="bar" />
          <ArgumentAxis>
            <Label overlappingBehavior="stagger" />
          </ArgumentAxis>
          <Series valueField="avgDays" name="Avg Days" />
          <Series valueField="medianDays" name="Median Days" />
          <Legend verticalAlignment="bottom" horizontalAlignment="center" />
          <Tooltip enabled shared />
        </Chart>
      </section>

      <section className="dashboard-section">
        <h3>Reason Code Distribution</h3>
        <Chart id="reasonCodeChart" dataSource={filteredReasonCodeDistribution} palette="Material" height={280}>
          <CommonSeriesSettings argumentField="reasonCode" type="bar" />
          <ArgumentAxis>
            <Label overlappingBehavior="rotate" rotationAngle={-30} />
          </ArgumentAxis>
          <Series valueField="count" name="Cases" />
          <Tooltip enabled />
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
