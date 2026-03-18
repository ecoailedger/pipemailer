import Popup from 'devextreme-react/popup';
import TextArea from 'devextreme-react/text-area';
import TextBox from 'devextreme-react/text-box';
import Button from 'devextreme-react/button';

/**
 * @param {{ open: boolean, onClose: () => void, onSave: () => void }} props
 */
export default function ComposePopup({ open, onClose, onSave }) {
  return (
    <Popup visible={open} title="Compose Email" width={640} height={460} onHiding={onClose} showCloseButton>
      <div className="p-4">
        <TextBox label="To" labelMode="floating" stylingMode="filled" className="mb-3" />
        <TextBox label="Subject" labelMode="floating" stylingMode="filled" className="mb-3" />
        <TextArea label="Message" labelMode="floating" stylingMode="filled" minHeight={220} />
        <div className="compose-actions">
          <Button text="Send" type="default" stylingMode="contained" onClick={onSave} />
          <Button text="Cancel" stylingMode="text" onClick={onClose} />
        </div>
      </div>
    </Popup>
  );
}
