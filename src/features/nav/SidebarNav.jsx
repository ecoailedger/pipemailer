import Button from 'devextreme-react/button';

/**
 * @param {{ activeView: 'email' | 'pipeline', onViewChange: (view: 'email'|'pipeline') => void, onOpenLinkPopup: () => void }} props
 */
export default function SidebarNav({ activeView, onViewChange, onOpenLinkPopup }) {
  return (
    <div>
      <h4 className="section-title">Workspace</h4>
      <div className="view-toggle">
        <Button
          text="Email"
          type={activeView === 'email' ? 'default' : 'normal'}
          stylingMode={activeView === 'email' ? 'contained' : 'outlined'}
          onClick={() => onViewChange('email')}
        />
        <Button
          text="Pipeline"
          type={activeView === 'pipeline' ? 'default' : 'normal'}
          stylingMode={activeView === 'pipeline' ? 'contained' : 'outlined'}
          onClick={() => onViewChange('pipeline')}
        />
      </div>
      <div className="action-grid">
        <Button text="Link Records" stylingMode="text" icon="link" onClick={onOpenLinkPopup} />
      </div>
    </div>
  );
}
