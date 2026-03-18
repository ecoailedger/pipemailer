import SelectBox from 'devextreme-react/select-box';

/**
 * @param {{
 *  emailId: number | null,
 *  dealId: number | null,
 *  selectedDeal: {stage:string} | null,
 *  deals: Array<{id:number,title:string}>,
 *  onLinkDeal: (payload: { emailId: number, dealId: number }) => void
 * }} props
 */
export default function DealAlignmentCard({ emailId, dealId, selectedDeal, deals, onLinkDeal }) {
  const hasEmail = Boolean(emailId);

  return (
    <section className="thread-message">
      <h4 className="panel-section-label">Deal alignment</h4>
      <SelectBox
        label="Linked deal"
        labelMode="floating"
        stylingMode="filled"
        dataSource={deals}
        valueExpr="id"
        displayExpr="title"
        value={dealId ?? null}
        disabled={!hasEmail}
        searchEnabled
        onValueChanged={(event) => {
          if (!emailId || !event.value) return;
          onLinkDeal({ emailId, dealId: event.value });
        }}
      />
      <div className="thread-meta" style={{ marginBottom: 0, marginTop: 10 }}>
        <div className="thread-meta-row"><span>Stage</span><span>{selectedDeal?.stage ?? 'Unlinked'}</span></div>
      </div>
    </section>
  );
}
