import { useEffect, useState } from 'react';
import Popup from 'devextreme-react/popup';
import TextArea from 'devextreme-react/text-area';
import TextBox from 'devextreme-react/text-box';
import Button from 'devextreme-react/button';

/**
 * @param {{ open: boolean, onClose: () => void, onSave: (payload: { to: string, subject: string, body: string }) => void }} props
 */
export default function ComposePopup({ open, onClose, onSave }) {
  const [form, setForm] = useState({ to: '', subject: '', body: '' });

  useEffect(() => {
    if (!open) return;
    setForm({ to: '', subject: '', body: '' });
  }, [open]);

  const update = (field) => (event) => setForm((prev) => ({ ...prev, [field]: event.value ?? '' }));

  return (
    <Popup visible={open} title="Compose Email" width={640} height={460} onHiding={onClose} showCloseButton>
      <div className="p-4">
        <TextBox label="To" labelMode="floating" stylingMode="filled" className="mb-3" value={form.to} onValueChanged={update('to')} />
        <TextBox label="Subject" labelMode="floating" stylingMode="filled" className="mb-3" value={form.subject} onValueChanged={update('subject')} />
        <TextArea label="Message" labelMode="floating" stylingMode="filled" minHeight={220} value={form.body} onValueChanged={update('body')} />
        <div className="compose-actions">
          <Button text="Send" type="default" stylingMode="contained" onClick={() => onSave(form)} />
          <Button text="Cancel" stylingMode="text" onClick={onClose} />
        </div>
      </div>
    </Popup>
  );
}
