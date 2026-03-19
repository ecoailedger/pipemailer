import { formatCurrency } from '../../utils/formatters';

const RETURN_STAGE_BADGE_CONFIG = {
  'Awaiting Customer': { label: 'Awaiting customer', className: 'return-awaiting-customer' },
  'Awaiting Warehouse': { label: 'Awaiting warehouse', className: 'return-awaiting-warehouse' },
  'Inspection Complete': { label: 'Inspection complete', className: 'return-inspection-complete' },
  'Awaiting Finance': { label: 'Awaiting finance', className: 'return-awaiting-finance' },
  'Ready to Refund': { label: 'Ready to refund', className: 'return-ready-refund' },
  'Ready to Replace': { label: 'Ready to replace', className: 'return-ready-replace' },
  Closed: { label: 'Closed', className: 'return-closed' }
};

/**
 * @param {{
 *  deals: Array<{id:number,title:string,contact:string,stage:string,value:number,approvalStatus?:string}>,
 *  stages: string[],
 *  selectedDealId: number | null,
 *  onSelectDeal: (id: number) => void
 * }} props
 */
export default function PipelineView({ deals, stages, selectedDealId, onSelectDeal }) {
  const getReturnStageBadge = (stage) => RETURN_STAGE_BADGE_CONFIG[stage] ?? null;

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
                    {deal.approvalStatus && deal.approvalStatus !== 'none' ? (
                      <div className={`pipeline-status-badge approval-${deal.approvalStatus}`}>
                        {deal.approvalStatus === 'required'
                          ? 'Approval required'
                          : deal.approvalStatus === 'approved'
                            ? 'Approved'
                            : 'Rejected'}
                      </div>
                    ) : null}
                    {getReturnStageBadge(deal.stage) ? (
                      <div className={`pipeline-status-badge ${getReturnStageBadge(deal.stage).className}`}>
                        {getReturnStageBadge(deal.stage).label}
                      </div>
                    ) : null}
                    {deal.returnCase ? (
                      <div className="info-row">RMA {deal.returnCase.rmaNumber} · Order {deal.returnCase.orderNumber} · SKU {deal.returnCase.sku}</div>
                    ) : null}
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
