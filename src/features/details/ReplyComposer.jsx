import TextBox from 'devextreme-react/text-box';
import TextArea from 'devextreme-react/text-area';
import Button from 'devextreme-react/button';

/**
 * @param {{
 *  draft: {to:string,cc:string,subject:string,body:string},
 *  onChange: (field: 'to'|'cc'|'subject'|'body', value: string) => void,
 *  onSend: () => void,
 *  onCancel: () => void
 * }} props
 */
export default function ReplyComposer({ draft, onChange, onSend, onCancel }) {
  const handleShortcut = (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault();
      onSend();
    }
  };

  return (
    <section className="reply-composer" onKeyDown={handleShortcut}>
      <TextBox label="To" labelMode="floating" stylingMode="filled" className="mb-2" value={draft.to} onValueChanged={(event) => onChange('to', event.value ?? '')} />
      <TextBox label="Cc" labelMode="floating" stylingMode="filled" className="mb-2" value={draft.cc} onValueChanged={(event) => onChange('cc', event.value ?? '')} />
      <TextBox label="Subject" labelMode="floating" stylingMode="filled" className="mb-2" value={draft.subject} onValueChanged={(event) => onChange('subject', event.value ?? '')} />
      <TextArea label="Body" labelMode="floating" stylingMode="filled" minHeight={120} value={draft.body} onValueChanged={(event) => onChange('body', event.value ?? '')} />
      <div className="compose-actions">
        <Button text="Send" type="default" stylingMode="contained" onClick={onSend} />
        <Button text="Cancel" stylingMode="text" onClick={onCancel} />
      </div>
      <div className="composer-hint">Tip: press Cmd/Ctrl + Enter to send.</div>
    </section>
  );
}
