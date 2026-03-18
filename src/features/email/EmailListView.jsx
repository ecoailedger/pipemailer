import List from 'devextreme-react/list';
import { formatRelativeFromNow } from '../../utils/formatters';

/**
 * @param {{
 *  emails: Array<{id:number,from:string,subject:string,snippet:string,date:string,isRead?:boolean}>,
 *  selectedEmailId: number | null,
 *  onSelectEmail: (id: number) => void
 * }} props
 */
export default function EmailListView({ emails, selectedEmailId, onSelectEmail }) {
  return (
    <div id="emailListContainer">
      <List
        dataSource={emails}
        keyExpr="id"
        focusStateEnabled={false}
        activeStateEnabled={false}
        hoverStateEnabled
        selectionMode="single"
        selectedItemKeys={selectedEmailId ? [selectedEmailId] : []}
        onSelectionChanged={(event) => {
          const selected = event.addedItems?.[0];
          if (selected?.id) onSelectEmail(selected.id);
        }}
        itemRender={(email) => (
          <div className="email-item">
            <div className="email-top">
              <span className="email-from">
                {!email.isRead ? <span className="unread-dot" /> : null}
                {email.from}
              </span>
              <span className="email-date">{formatRelativeFromNow(email.date)}</span>
            </div>
            <div className="email-subject">{email.subject}</div>
            <div className="email-snippet">{email.snippet}</div>
          </div>
        )}
      />
    </div>
  );
}
