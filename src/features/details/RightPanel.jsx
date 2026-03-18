import { useMemo, useState } from 'react';
import TabPanel from 'devextreme-react/tab-panel';
import ThreadView from './ThreadView.jsx';
import { formatCurrency } from '../../utils/formatters';

const EMPTY_DRAFT = { to: '', cc: '', subject: '', body: '' };

/**
 * @param {{
 *  selectedEmail: {id:number,from:string,to?:string,cc?:string,subject:string,snippet:string,date:string,dealId:number|null,thread?:Array<{from:string,at:string,body:string}>} | null,
 *  selectedDeal: {title:string,contact:string,stage:string,value:number,probability:number,notes?:string[]} | null,
 *  deals: Array<{id:number,title:string}>,
 *  draft: {to:string,cc:string,subject:string,body:string} | null,
 *  onSetDraft: (payload: {emailId:number,to:string,cc:string,subject:string,body:string,dealId:number|null}) => void,
 *  onClearDraft: (payload: {emailId:number}) => void,
 *  onReply: (payload: {emailId:number,to:string,cc:string,subject:string,body:string,dealId:number|null}) => void,
 *  onLinkDeal: (payload: { emailId: number, dealId: number }) => void
 * }} props
 */
export default function RightPanel({ selectedEmail, selectedDeal, deals, draft, onSetDraft, onClearDraft, onReply, onLinkDeal }) {
  const [isComposerOpen, setIsComposerOpen] = useState(false);

  const composerDraft = useMemo(() => draft ?? EMPTY_DRAFT, [draft]);

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
          onDraftChange={updateDraft}
          onSendReply={sendReply}
          onCancelReply={cancelReply}
        />
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
      title: 'Activity',
      content: (
        <div className="thread-wrap">
          {selectedEmail?.thread?.length ? (
            selectedEmail.thread.map((message, index) => (
              <div className="timeline-item" key={`activity-${message.at}-${index}`}>
                <div className="timeline-head">
                  <span>{message.from}</span>
                  <span>{message.at}</span>
                </div>
                <div className="email-body-full">{message.body}</div>
              </div>
            ))
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
