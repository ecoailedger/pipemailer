import Popup from 'devextreme-react/popup';
import TagBox from 'devextreme-react/tag-box';
import Button from 'devextreme-react/button';

const availableLinks = ['Account', 'Contact', 'Opportunity', 'Support Case'];

/**
 * @param {{ open: boolean, onClose: () => void, onSave: () => void }} props
 */
export default function LinkPopup({ open, onClose, onSave }) {
  return (
    <Popup visible={open} title="Link Records" width={500} height={360} onHiding={onClose} showCloseButton>
      <div className="p-4">
        <TagBox
          items={availableLinks}
          label="Objects"
          labelMode="floating"
          stylingMode="filled"
          multiline
          searchEnabled
        />
        <div className="d-flex gap-2 mt-4">
          <Button text="Save" type="default" stylingMode="contained" onClick={onSave} />
          <Button text="Close" stylingMode="text" onClick={onClose} />
        </div>
      </div>
    </Popup>
  );
}
