import { useMemo, useState } from 'react';
import TabPanel from 'devextreme-react/tab-panel';
import ThreadView from './ThreadView.jsx';
import { formatCurrency } from '../../utils/formatters';

const EMPTY_DRAFT = { to: '', cc: '', subject: '', body: '' };

/**
 * @param {{
 *  selectedEmail: {id:number,from:string,to?:string,cc?:string,subject:string,snippet:string,date:string,dealId:number|null,thread?:Array<{from:string,at:string,body:string}>} | null,
 *  selectedDeal: {title:string,contact:string,stage:string,value:number,probability:number,notes?:string[],returnCase?:Record<string,unknown>} | null,
 *  selectedReturnCase: {rmaNumber:string,orderNumber:string,sku:string,quantity:number,returnReason:string,condition:string,disposition:string,goodsReceivedDate?:string,inspectionOutcome?:string,refundMethod?:string,creditNoteId?:string,refundPostedAt?:string,refundAmount:number} | null,
 *  deals: Array<{id:number,title:string}>,
 *  draft: {to:string,cc:string,subject:string,body:string} | null,
 *  onSetDraft: (payload: {emailId:number,to:string,cc:string,subject:string,body:string,dealId:number|null}) => void,
 *  onClearDraft: (payload: {emailId:number}) => void,
 *  onReply: (payload: {emailId:number,to:string,cc:string,subject:string,body:string,dealId:number|null}) => void,
 *  onLinkDeal: (payload: { emailId: number, dealId: number }) => void,
 *  assignees: Array<{id:string,name:string}>,
 *  resolveAssigneeName: (assigneeId?:string|null) => string,
 *  macroTemplates: Array<{id:string,title:string,category:string,body:string,isArchived?:boolean}>,
 *  onUseMacro: (payload: {templateId:string,emailId:number|null}) => void,
 *  onAssign: (payload: {emailId:number,assigneeId:string}) => void,
 *  actorName: string,
 *  onAddInternalNote: (payload: {emailId:number,note:string,actorName:string}) => void,
 *  onRequestApproval: (payload: {emailId:number,summary:string,actorName:string}) => void,
 *  onApprove: (payload: {emailId:number,comment:string,actorName:string}) => void,
 *  onReject: (payload: {emailId:number,comment:string,actorName:string}) => void
 * }} props
 */
export default function RightPanel({
  selectedEmail,
  selectedDeal,
  selectedReturnCase,
  deals,
  draft,
  onSetDraft,
  onClearDraft,
  onReply,
  onLinkDeal,
  assignees,
  resolveAssigneeName,
  macroTemplates,
  onUseMacro,
  onAssign,
  actorName,
  onAddInternalNote,
  onRequestApproval,
  onApprove,
  onReject
}) {
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [selectedAssigneeId, setSelectedAssigneeId] = useState('');
  const [noteDraft, setNoteDraft] = useState('');
  const [approvalSummary, setApprovalSummary] = useState('');

  const composerDraft = useMemo(() => draft ?? EMPTY_DRAFT, [draft]);
  const macroContext = useMemo(() => ({
    customerName: selectedEmail?.from || selectedEmail?.to || 'Customer',
    orderNumber: selectedReturnCase?.orderNumber || 'ORDER-UNKNOWN',
    rmaNumber: selectedReturnCase?.rmaNumber || 'RMA-UNKNOWN'
  }), [selectedEmail, selectedReturnCase]);

  const timelineItems = useMemo(() => {
    if (!selectedEmail) return [];
    if (selectedEmail.activityTimeline?.length) return selectedEmail.activityTimeline;
    return (selectedEmail.thread ?? []).map((message, index) => ({
      id: `thread-${selectedEmail.id}-${index}`,
      type: 'public-message',
      visibility: 'public',
      actorName: message.from,
      timestamp: message.at,
      body: message.body,
      status: 'sent',
      locked: true
    }));
  }, [selectedEmail]);
  const activeReturnCase = selectedReturnCase || selectedDeal?.returnCase;


  const openComposerFor = (mode) => {
    if (!selectedEmail) return;

    const includeCc = mode === 'replyAll';
    const nextDraft = {
      emailId: selectedEmail.id,
      to: selectedEmail.from || '',
      cc: includeCc ? selectedEmail.cc || '' : '',
      subject: selectedEmail.subject?.startsWith('Re:') ? selectedEmail.subject : `Re: ${selectedEmail.subject || ''}`,
      body: draft?.body || '',
      dealId: selectedEmail.dealId ?? null
    };

    onSetDraft(nextDraft);
    setIsComposerOpen(true);
  };

  const updateDraft = (field, value) => {
    if (!selectedEmail) return;
    onSetDraft({
      emailId: selectedEmail.id,
      to: composerDraft.to,
      cc: composerDraft.cc,
      subject: composerDraft.subject,
      body: composerDraft.body,
      dealId: selectedEmail.dealId ?? null,
      [field]: value
    });
  };

  const sendReply = () => {
    if (!selectedEmail) return;
    onReply({
      emailId: selectedEmail.id,
      to: composerDraft.to,
      cc: composerDraft.cc,
      subject: composerDraft.subject,
      body: composerDraft.body,
      dealId: selectedEmail.dealId ?? null
    });
    setIsComposerOpen(false);
  };

  const cancelReply = () => {
    if (selectedEmail) onClearDraft({ emailId: selectedEmail.id });
    setIsComposerOpen(false);
  };

  const tabs = [
    {
      title: 'Thread',
      content: (
        <ThreadView
          selectedEmail={selectedEmail}
          selectedDeal={selectedDeal}
          deals={deals}
          draft={composerDraft}
          showComposer={isComposerOpen}
          onStartReply={openComposerFor}
          onLinkDeal={onLinkDeal}
          macroTemplates={macroTemplates}
          macroContext={macroContext}
          onUseMacro={(templateId) => onUseMacro({ templateId, emailId: selectedEmail?.id ?? null })}
          onDraftChange={updateDraft}
          onSendReply={sendReply}
          onCancelReply={cancelReply}
        />
      )
    },
    {
      title: 'Assignment',
      content: (
        <div className="thread-wrap">
          {selectedEmail ? (
            <article className="thread-message">
              <div className="thread-meta-row"><span>Current owner</span><span>{resolveAssigneeName(selectedEmail.assigneeId)}</span></div>
              <div className="thread-meta-row"><span>Assigned at</span><span>{selectedEmail.assignedAt || '—'}</span></div>
              <div className="assign-controls">
                <select value={selectedAssigneeId} onChange={(event) => setSelectedAssigneeId(event.target.value)}>
                  <option value="">Choose assignee…</option>
                  {assignees.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="dx-button dx-button-mode-contained dx-button-normal"
                  onClick={() => {
                    if (!selectedAssigneeId) return;
                    onAssign({ emailId: selectedEmail.id, assigneeId: selectedAssigneeId });
                    setSelectedAssigneeId('');
                  }}
                >
                  {selectedEmail.assigneeId ? 'Reassign' : 'Assign'}
                </button>
              </div>
              {!!selectedEmail.assignmentHistory?.length && (
                <div className="assignment-history">
                  {selectedEmail.assignmentHistory.map((entry, index) => (
                    <div key={`${entry.assigneeId}-${entry.assignedAt}-${index}`} className="timeline-item">
                      <div className="thread-meta-row">
                        <span>{resolveAssigneeName(entry.assigneeId)}</span>
                        <span>{entry.assignedAt}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </article>
          ) : (
            <div className="empty-state">No thread selected.</div>
          )}
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
              {activeReturnCase ? (
                <>
                  <div className="thread-meta-row"><span>RMA</span><span>{activeReturnCase.rmaNumber}</span></div>
                  <div className="thread-meta-row"><span>Order</span><span>{activeReturnCase.orderNumber}</span></div>
                  <div className="thread-meta-row"><span>SKU</span><span>{activeReturnCase.sku}</span></div>
                  <div className="thread-meta-row"><span>Quantity</span><span>{activeReturnCase.quantity}</span></div>
                  <div className="thread-meta-row"><span>Reason</span><span>{activeReturnCase.returnReason}</span></div>
                  <div className="thread-meta-row"><span>Condition</span><span>{activeReturnCase.condition}</span></div>
                  <div className="thread-meta-row"><span>Disposition</span><span>{activeReturnCase.disposition}</span></div>
                  <div className="thread-meta-row"><span>Goods Received</span><span>{activeReturnCase.goodsReceivedDate || '—'}</span></div>
                  <div className="thread-meta-row"><span>Inspection</span><span>{activeReturnCase.inspectionOutcome || '—'}</span></div>
                  <div className="thread-meta-row"><span>Refund Method</span><span>{activeReturnCase.refundMethod || '—'}</span></div>
                  <div className="thread-meta-row"><span>Credit Note ID</span><span>{activeReturnCase.creditNoteId || '—'}</span></div>
                  <div className="thread-meta-row"><span>Refund Posted</span><span>{activeReturnCase.refundPostedAt || '—'}</span></div>
                  <div className="thread-meta-row"><span>Refund</span><span>{formatCurrency(activeReturnCase.refundAmount)}</span></div>
                </>
              ) : null}
            </article>
          ) : (
            <div className="empty-state">No linked deal selected.</div>
          )}
        </div>
      )
    },
    {
      title: 'Activity',
      content: (
        <div className="thread-wrap">
          {selectedEmail ? (
            <>
              <article className="thread-message">
                <div className="panel-section-label">Internal actions</div>
                <textarea
                  className="composer-textarea"
                  value={noteDraft}
                  onChange={(event) => setNoteDraft(event.target.value)}
                  placeholder="Add an internal note (not visible to customer)..."
                />
                <div className="thread-actions-row">
                  <button
                    type="button"
                    className="dx-button dx-button-mode-contained dx-button-normal"
                    onClick={() => {
                      if (!noteDraft.trim()) return;
                      onAddInternalNote({ emailId: selectedEmail.id, note: noteDraft, actorName });
                      setNoteDraft('');
                    }}
                  >
                    Add internal note
                  </button>
                </div>
                <textarea
                  className="composer-textarea"
                  value={approvalSummary}
                  onChange={(event) => setApprovalSummary(event.target.value)}
                  placeholder="Approval context or decision comment..."
                />
                <div className="thread-actions-row">
                  <button
                    type="button"
                    className="dx-button dx-button-mode-contained dx-button-normal"
                    onClick={() => onRequestApproval({ emailId: selectedEmail.id, summary: approvalSummary, actorName })}
                  >
                    Request approval
                  </button>
                  <button
                    type="button"
                    className="dx-button dx-button-mode-contained dx-button-normal"
                    onClick={() => onApprove({ emailId: selectedEmail.id, comment: approvalSummary, actorName })}
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    className="dx-button dx-button-mode-outlined dx-button-normal"
                    onClick={() => onReject({ emailId: selectedEmail.id, comment: approvalSummary, actorName })}
                  >
                    Reject
                  </button>
                </div>
              </article>
              {timelineItems.map((event, index) => (
                <div className="timeline-item" key={event.id ?? `activity-${event.timestamp}-${index}`}>
                <div className="timeline-head">
                  <span>
                    {event.actorName || 'System'}
                    <span className={`timeline-visibility ${event.visibility === 'internal' ? 'is-internal' : 'is-public'}`}>
                      {event.visibility === 'internal' ? 'Internal' : 'Public'}
                    </span>
                    {event.type?.startsWith('approval-') ? (
                      <span className={`timeline-approval ${event.status === 'required' ? 'approval-required' : `approval-${event.status}`}`}>
                        {event.status === 'required' ? 'Approval required' : event.status}
                      </span>
                    ) : null}
                  </span>
                  <span>{event.timestamp}</span>
                </div>
                <div className="email-body-full">{event.body}</div>
              </div>
              ))}
            </>
          ) : (
            <div className="empty-state">No activity yet for this thread.</div>
          )}
        </div>
      )
    }
  ];

  return (
    <TabPanel
      id="detailTabs"
      dataSource={tabs}
      deferRendering={false}
      itemTitleRender={(item) => item.title}
      itemRender={(item) => item.content}
    />
  );
}
