/**
 * @param {{
 *  deals: Array<{ id: number, stage: string, value: number }>,
 *  emails: Array<{ id: number, folder: string }>,
 *  pipelineStages: string[]
 * }} props
 */
export default function DashboardView({ deals, emails, pipelineStages }) {
  const totalPipelineValue = deals.reduce((sum, deal) => sum + (Number(deal.value) || 0), 0);
  const dealsByStage = pipelineStages.map((stage) => ({
    stage,
    count: deals.filter((deal) => deal.stage === stage).length
  }));

  const inboxCount = emails.filter((email) => email.folder === 'inbox').length;
  const sentCount = emails.filter((email) => email.folder === 'sent').length;

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <article className="panel-card">
        <h3>Total Deals</h3>
        <p className="panel-value">{deals.length}</p>
      </article>
      <article className="panel-card">
        <h3>Pipeline Value</h3>
        <p className="panel-value">${totalPipelineValue.toLocaleString()}</p>
      </article>
      <article className="panel-card">
        <h3>Inbox Emails</h3>
        <p className="panel-value">{inboxCount}</p>
      </article>
      <article className="panel-card">
        <h3>Sent Emails</h3>
        <p className="panel-value">{sentCount}</p>
      </article>

      <article className="panel-card md:col-span-2 xl:col-span-4">
        <h3>Deals by Stage</h3>
        <ul className="dashboard-stage-list">
          {dealsByStage.map((item) => (
            <li key={item.stage}>
              <span>{item.stage}</span>
              <strong>{item.count}</strong>
            </li>
          ))}
        </ul>
      </article>
    </div>
  );
}
