import List from 'devextreme-react/list';
import { formatRelativeFromNow } from '../../utils/formatters';

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
 *  emails: Array<{id:number,from:string,subject:string,snippet:string,date:string,isRead?:boolean,assigneeId?:string|null,priority?:string,computedSlaStatus?:string}>,
 *  selectedEmailId: number | null,
 *  assignees: Array<{id:string,name:string}>,
 *  selectedAssigneeFilter: string,
 *  onSelectAssigneeFilter: (filter: string) => void,
 *  onSelectEmail: (id: number) => void,
 *  resolveAssigneeName: (assigneeId?:string|null) => string
 * }} props
 */
export default function EmailListView({
  emails,
  selectedEmailId,
  assignees,
  selectedAssigneeFilter,
  onSelectAssigneeFilter,
  onSelectEmail,
  resolveAssigneeName
}) {
  const assigneeFilters = [{ id: 'all', label: 'All assignees' }, ...assignees.map((item) => ({ id: item.id, label: item.name }))];

  return (
    <div id="emailListContainer">
      <div className="chip-row">
        {assigneeFilters.map((filter) => (
          <button
            key={filter.id}
            type="button"
            className={`filter-chip ${selectedAssigneeFilter === filter.id ? 'is-active' : ''}`}
            onClick={() => onSelectAssigneeFilter(filter.id)}
          >
            {filter.label}
          </button>
        ))}
      </div>
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
        itemRender={(email) => {
          const slaStatus = email.computedSlaStatus ?? email.slaStatus ?? 'onTrack';
          const isOverdue = slaStatus === 'overdue' || slaStatus === 'breached';
          return (
            <div className={`email-item ${isOverdue ? 'is-overdue' : ''}`}>
              <div className="email-top">
                <span className="email-from">
                  {!email.isRead ? <span className="unread-dot" /> : null}
                  {email.from}
                </span>
                <span className="email-date">{formatRelativeFromNow(email.date)}</span>
              </div>
              <div className="email-subject">{email.subject}</div>
              <div className="email-snippet">{email.snippet}</div>
              <div className="email-chip-row">
                <span className="assignment-chip">{resolveAssigneeName(email.assigneeId)}</span>
                <span className={`sla-badge priority-${email.priority ?? 'medium'}`}>{PRIORITY_LABELS[email.priority] ?? 'Medium'}</span>
                <span className={`sla-badge status-${slaStatus}`}>{SLA_LABELS[slaStatus] ?? 'On track'}</span>
              </div>
            </div>
          );
        }}
      />
    </div>
  );
}
