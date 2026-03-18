import Popup from 'devextreme-react/popup';
import TextBox from 'devextreme-react/text-box';
import NumberBox from 'devextreme-react/number-box';
import SelectBox from 'devextreme-react/select-box';
import Button from 'devextreme-react/button';

const stages = ['Qualified', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'];

/**
 * @param {{ open: boolean, onClose: () => void, onSave: () => void }} props
 */
export default function DealPopup({ open, onClose, onSave }) {
  return (
    <Popup visible={open} title="Create Deal" width={480} height={420} onHiding={onClose} showCloseButton>
      <div className="p-4">
        <TextBox label="Deal name" labelMode="floating" stylingMode="filled" className="mb-3" />
        <SelectBox items={stages} label="Stage" labelMode="floating" stylingMode="filled" className="mb-3" />
        <NumberBox label="Value" labelMode="floating" stylingMode="filled" format="$ #,##0" className="mb-3" />
        <div className="d-flex gap-2 mt-4">
          <Button text="Save" type="default" stylingMode="contained" onClick={onSave} />
          <Button text="Cancel" stylingMode="text" onClick={onClose} />
        </div>
      </div>
    </Popup>
  );
}
