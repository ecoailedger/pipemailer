import { formatCurrency } from '../../utils/formatters';

/**
 * @param {{
 *  deals: Array<{id:number,title:string,contact:string,stage:string,value:number}>,
 *  stages: string[],
 *  selectedDealId: number | null,
 *  onSelectDeal: (id: number) => void
 * }} props
 */
export default function PipelineView({ deals, stages, selectedDealId, onSelectDeal }) {
  return (
    <div id="kanbanView" style={{ display: 'block' }}>
      <div className="kanban-row">
        {stages.map((stage) => {
          const stageDeals = deals.filter((deal) => deal.stage === stage);
          return (
            <section key={stage} className="kanban-col">
              <header className="kanban-head">{stage}</header>
              <div className="kanban-body">
                {stageDeals.map((deal) => (
                  <article
                    key={deal.id}
                    className="deal-card"
                    style={{ borderColor: selectedDealId === deal.id ? 'var(--accent)' : undefined }}
                    onClick={() => onSelectDeal(deal.id)}
                  >
                    <div>{deal.title}</div>
                    <div className="info-row">{deal.contact}</div>
                    <div className="deal-value">{formatCurrency(deal.value)}</div>
                  </article>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
