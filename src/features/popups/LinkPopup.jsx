import { useEffect, useState } from 'react';
import Popup from 'devextreme-react/popup';
import SelectBox from 'devextreme-react/select-box';
import Button from 'devextreme-react/button';

/**
 * @param {{
 *  open: boolean,
 *  emails: Array<{id:number,subject:string,from:string}>,
 *  deals: Array<{id:number,title:string}>,
 *  defaultEmailId: number|null,
 *  defaultDealId: number|null,
 *  onClose: () => void,
 *  onSave: (payload: { emailId: number|null, dealId: number|null }) => void
 * }} props
 */
export default function LinkPopup({ open, emails, deals, defaultEmailId, defaultDealId, onClose, onSave }) {
  const [emailId, setEmailId] = useState(defaultEmailId);
  const [dealId, setDealId] = useState(defaultDealId);

  useEffect(() => {
    if (!open) return;
    setEmailId(defaultEmailId);
    setDealId(defaultDealId);
  }, [open, defaultEmailId, defaultDealId]);

  return (
    <Popup visible={open} title="Link Email to Deal" width={520} height={360} onHiding={onClose} showCloseButton>
      <div className="p-4">
        <SelectBox
          items={emails}
          displayExpr={(item) => (item ? `${item.subject} · ${item.from}` : '')}
          valueExpr="id"
          value={emailId}
          searchEnabled
          label="Email"
          labelMode="floating"
          stylingMode="filled"
          onValueChanged={(event) => setEmailId(event.value ?? null)}
        />
        <div className="mt-3" />
        <SelectBox
          items={deals}
          displayExpr="title"
          valueExpr="id"
          value={dealId}
          searchEnabled
          label="Deal"
          labelMode="floating"
          stylingMode="filled"
          onValueChanged={(event) => setDealId(event.value ?? null)}
        />
        <div className="d-flex gap-2 mt-4">
          <Button text="Save" type="default" stylingMode="contained" onClick={() => onSave({ emailId, dealId })} />
          <Button text="Close" stylingMode="text" onClick={onClose} />
        </div>
      </div>
    </Popup>
  );
}
