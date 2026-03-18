import TabPanel from 'devextreme-react/tab-panel';
import Button from 'devextreme-react/button';
import { formatCurrency, formatDate } from '../../utils/formatters';

/**
 * @param {{
 *  selectedEmail: {from:string,subject:string,snippet:string,date:string,dealId:number|null} | null,
 *  selectedDeal: {title:string,contact:string,stage:string,value:number,probability:number,notes?:string[]} | null,
 *  onCompose: () => void,
 *  onCreateDeal: () => void
 * }} props
 */
export default function RightPanel({ selectedEmail, selectedDeal, onCompose, onCreateDeal }) {
  const tabs = [
    {
      title: 'Summary',
      content: (
        <div className="thread-wrap">
          <div className="thread-meta">
            <div className="thread-meta-row"><span>From</span><span>{selectedEmail?.from ?? '—'}</span></div>
            <div className="thread-meta-row"><span>Date</span><span>{selectedEmail ? formatDate(selectedEmail.date) : '—'}</span></div>
            <div className="thread-meta-row"><span>Deal</span><span>{selectedDeal?.title ?? 'Unlinked'}</span></div>
          </div>
          <article className="thread-message">
            <div className="thread-message-head"><span>{selectedEmail?.subject ?? 'No email selected'}</span></div>
            <div className="email-body-full">{selectedEmail?.snippet ?? 'Select an email to view details.'}</div>
          </article>
        </div>
      )
    },
    {
      title: 'Deal',
      content: (
        <div className="thread-wrap">
          {selectedDeal ? (
            <article className="thread-message">
              <div><strong>{selectedDeal.title}</strong></div>
              <div className="info-row">{selectedDeal.contact}</div>
              <div className="thread-meta-row"><span>Stage</span><span>{selectedDeal.stage}</span></div>
              <div className="thread-meta-row"><span>Value</span><span>{formatCurrency(selectedDeal.value)}</span></div>
              <div className="thread-meta-row"><span>Probability</span><span>{selectedDeal.probability}%</span></div>
            </article>
          ) : (
            <div className="empty-state">No linked deal selected.</div>
          )}
        </div>
      )
    },
    {
      title: 'Actions',
      content: (
        <div className="thread-wrap">
          <div className="thread-actions-row">
            <Button text="Reply" type="default" stylingMode="contained" onClick={onCompose} />
            <Button text="Create Deal" stylingMode="outlined" onClick={onCreateDeal} />
          </div>
        </div>
      )
    }
  ];

  return <TabPanel id="detailTabs" dataSource={tabs} deferRendering={false} itemTitleRender={(item) => item.title} itemRender={(item) => item.content} />;
}
