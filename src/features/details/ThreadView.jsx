import Button from 'devextreme-react/button';
import { formatDate } from '../../utils/formatters';
import DealAlignmentCard from './DealAlignmentCard.jsx';
import ReplyComposer from './ReplyComposer.jsx';

const PRIORITY_LABELS = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent'
};

const SLA_LABELS = {
  onTrack: 'On track',
  atRisk: 'At risk',
  overdue: 'Overdue',
  breached: 'Breached'
};

/**
 * @param {{
 *  selectedEmail: {id:number,from:string,to?:string,cc?:string,subject:string,snippet:string,date:string,thread?:Array<{from:string,at:string,body:string}>,dealId:number|null,firstResponseDueAt?:string|null,resolutionDueAt?:string|null,priority?:string,computedSlaStatus?:string,slaStatus?:string} | null,
 *  selectedDeal: {stage:string,title:string} | null,
 *  deals: Array<{id:number,title:string}>,
 *  draft: {to:string,cc:string,subject:string,body:string},
 *  showComposer: boolean,
 *  onStartReply: (mode: 'reply' | 'replyAll') => void,
 *  onLinkDeal: (payload: { emailId: number, dealId: number }) => void,
 *  onDraftChange: (field: 'to'|'cc'|'subject'|'body', value: string) => void,
 *  onSendReply: () => void,
 *  onCancelReply: () => void
 * }} props
 */
export default function ThreadView({
  selectedEmail,
  selectedDeal,
  deals,
  draft,
  showComposer,
  onStartReply,
  onLinkDeal,
  onDraftChange,
  onSendReply,
  onCancelReply
}) {
  const thread = selectedEmail?.thread?.length
    ? selectedEmail.thread
    : selectedEmail
      ? [{ from: selectedEmail.from, at: selectedEmail.date, body: selectedEmail.snippet }]
      : [];

  if (!selectedEmail) {
    return <div className="empty-state">Select an email to view the full thread.</div>;
  }

  const slaStatus = selectedEmail.computedSlaStatus ?? selectedEmail.slaStatus ?? 'onTrack';

  return (
    <div className="thread-wrap">
      <div className="thread-sticky-actions">
        <div className="thread-actions-primary">
          <Button text="Reply" type="default" stylingMode="contained" onClick={() => onStartReply('reply')} />
          <Button text="Reply all" stylingMode="outlined" onClick={() => onStartReply('replyAll')} />
        </div>
      </div>

      <div className="thread-meta">
        <div className="thread-meta-row"><span>Subject</span><span>{selectedEmail.subject}</span></div>
        <div className="thread-meta-row"><span>Linked deal</span><span>{selectedDeal?.title ?? 'Unlinked'}</span></div>
        <div className="thread-meta-row"><span>First response due</span><span>{formatDate(selectedEmail.firstResponseDueAt)}</span></div>
        <div className="thread-meta-row"><span>Resolution due</span><span>{formatDate(selectedEmail.resolutionDueAt)}</span></div>
        <div className="thread-meta-row">
          <span>SLA</span>
          <span className="email-chip-row">
            <span className={`sla-badge priority-${selectedEmail.priority ?? 'medium'}`}>{PRIORITY_LABELS[selectedEmail.priority] ?? 'Medium'}</span>
            <span className={`sla-badge status-${slaStatus}`}>{SLA_LABELS[slaStatus] ?? 'On track'}</span>
          </span>
        </div>
      </div>

      <div className="thread-list">
        {thread.map((message, index) => (
          <article className="thread-message" key={`${message.at}-${index}`}>
            <div className="thread-message-head">
              <span>{message.from}</span>
              <span>{formatDate(message.at)}</span>
            </div>
            <div className="email-body-full">{message.body}</div>
          </article>
        ))}
      </div>

      <DealAlignmentCard
        emailId={selectedEmail.id}
        dealId={selectedEmail.dealId}
        selectedDeal={selectedDeal}
        deals={deals}
        onLinkDeal={onLinkDeal}
      />

      {showComposer ? (
        <ReplyComposer draft={draft} onChange={onDraftChange} onSend={onSendReply} onCancel={onCancelReply} />
      ) : null}
    </div>
  );
}
