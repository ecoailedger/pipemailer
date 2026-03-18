import { useEffect, useState } from 'react';
import Popup from 'devextreme-react/popup';
import TextBox from 'devextreme-react/text-box';
import NumberBox from 'devextreme-react/number-box';
import SelectBox from 'devextreme-react/select-box';
import Button from 'devextreme-react/button';

/**
 * @param {{ open: boolean, stages: string[], onClose: () => void, onSave: (payload: { title: string, contact: string, stage: string, value: number }) => void }} props
 */
export default function DealPopup({ open, stages, onClose, onSave }) {
  const [form, setForm] = useState({ title: '', contact: '', stage: stages[0] ?? 'Leads', value: 10000 });

  useEffect(() => {
    if (!open) return;
    setForm({ title: '', contact: '', stage: stages[0] ?? 'Leads', value: 10000 });
  }, [open, stages]);

  return (
    <Popup visible={open} title="Create Deal" width={480} height={440} onHiding={onClose} showCloseButton>
      <div className="p-4">
        <TextBox label="Deal name" labelMode="floating" stylingMode="filled" className="mb-3" value={form.title} onValueChanged={(event) => setForm((prev) => ({ ...prev, title: event.value ?? '' }))} />
        <TextBox label="Contact" labelMode="floating" stylingMode="filled" className="mb-3" value={form.contact} onValueChanged={(event) => setForm((prev) => ({ ...prev, contact: event.value ?? '' }))} />
        <SelectBox items={stages} label="Stage" labelMode="floating" stylingMode="filled" className="mb-3" value={form.stage} onValueChanged={(event) => setForm((prev) => ({ ...prev, stage: event.value ?? prev.stage }))} />
        <NumberBox label="Value" labelMode="floating" stylingMode="filled" format="$ #,##0" className="mb-3" value={form.value} onValueChanged={(event) => setForm((prev) => ({ ...prev, value: Number(event.value) || 0 }))} />
        <div className="d-flex gap-2 mt-4">
          <Button text="Save" type="default" stylingMode="contained" onClick={() => onSave(form)} />
          <Button text="Cancel" stylingMode="text" onClick={onClose} />
        </div>
      </div>
    </Popup>
  );
}
