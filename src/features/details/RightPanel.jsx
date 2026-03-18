import Button from 'devextreme-react/button';
import { formatDate } from '../../utils/formatters';

/**
 * @param {{ selectedEmail: {from:string,subject:string,snippet:string,receivedAt:string} | null, onCompose: () => void }} props
 */
export default function RightPanel({ selectedEmail, onCompose }) {
  if (!selectedEmail) {
    return <div className="empty-state">Select an email to view context, timeline, and quick actions.</div>;
  }

  return (
    <div>
      <div className="right-header">
        <strong>Details</strong>
        <Button text="Reply" type="default" stylingMode="contained" onClick={onCompose} />
      </div>
      <div className="thread-wrap">
        <div className="thread-meta">
          <div className="thread-meta-row">
            <span>From</span>
            <span>{selectedEmail.from}</span>
          </div>
          <div className="thread-meta-row">
            <span>Received</span>
            <span>{formatDate(selectedEmail.receivedAt)}</span>
          </div>
        </div>
        <article className="thread-message">
          <div className="thread-message-head">
            <span>{selectedEmail.subject}</span>
          </div>
          <div className="email-body-full">{selectedEmail.snippet}</div>
        </article>
      </div>
    </div>
  );
}
