import { formatCurrency } from '../../utils/formatters';

/**
 * @param {{ deals: Array<{id:string,name:string,stage:string,value:number}> }} props
 */
export default function PipelineView({ deals }) {
  const grouped = deals.reduce((acc, deal) => {
    const key = deal.stage || 'Unsorted';
    if (!acc[key]) acc[key] = [];
    acc[key].push(deal);
    return acc;
  }, {});

  return (
    <div id="kanbanView" style={{ display: 'block' }}>
      <div className="kanban-row">
        {Object.entries(grouped).map(([stage, stageDeals]) => (
          <section key={stage} className="kanban-col">
            <header className="kanban-head">{stage}</header>
            <div className="kanban-body">
              {stageDeals.map((deal) => (
                <article key={deal.id} className="deal-card">
                  <div>{deal.name}</div>
                  <div className="deal-value">{formatCurrency(deal.value)}</div>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
