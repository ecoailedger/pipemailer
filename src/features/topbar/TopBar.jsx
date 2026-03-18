import Button from 'devextreme-react/button';
import TextBox from 'devextreme-react/text-box';

/**
 * @param {{
 *  onCompose: () => void,
 *  onToggleTheme: () => void,
 *  onSearchChange: (value: string) => void,
 *  onSwitchToEmail: () => void,
 *  onSwitchToPipeline: () => void
 * }} props
 */
export default function TopBar({
  onCompose,
  onToggleTheme,
  onSearchChange,
  onSwitchToEmail,
  onSwitchToPipeline
}) {
  return (
    <header className="topbar">
      <div className="logo">
        Pipe<span>Mailer</span>
      </div>
      <TextBox
        id="searchBox"
        placeholder="Search emails"
        mode="search"
        stylingMode="filled"
        onValueChanged={(e) => onSearchChange(e.value ?? '')}
      />
      <div className="top-actions">
        <Button text="Email View" stylingMode="outlined" onClick={onSwitchToEmail} />
        <Button text="Pipeline View" stylingMode="outlined" onClick={onSwitchToPipeline} />
        <Button text="Add Email" type="default" stylingMode="contained" onClick={onCompose} />
        <Button text="Theme" icon="contrast" stylingMode="outlined" onClick={onToggleTheme} />
      </div>
    </header>
  );
}
