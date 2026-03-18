import Button from 'devextreme-react/button';
import TextBox from 'devextreme-react/text-box';

/**
 * @param {{
 *  view: 'email' | 'pipeline' | 'dashboard',
 *  themeMode: 'light' | 'dark',
 *  searchText: string,
 *  onCompose: () => void,
 *  onToggleTheme: () => void,
 *  onSearchChange: (value: string) => void,
 *  onSwitchToEmail: () => void,
 *  onSwitchToPipeline: () => void,
 *  onSwitchToDashboard: () => void
 * }} props
 */
export default function TopBar({
  view,
  themeMode,
  searchText,
  onCompose,
  onToggleTheme,
  onSearchChange,
  onSwitchToEmail,
  onSwitchToPipeline,
  onSwitchToDashboard
}) {
  return (
    <header className="topbar">
      <div className="logo">
        Pipe<span>Mailer</span>
      </div>
      <TextBox
        id="searchBox"
        placeholder="Search emails and deals"
        mode="search"
        stylingMode="filled"
        value={searchText}
        onValueChanged={(e) => onSearchChange(e.value ?? '')}
      />
      <div className="top-actions">
        <Button text="Email View" type={view === 'email' ? 'default' : 'normal'} stylingMode="outlined" onClick={onSwitchToEmail} />
        <Button text="Pipeline View" type={view === 'pipeline' ? 'default' : 'normal'} stylingMode="outlined" onClick={onSwitchToPipeline} />
        <Button text="Dashboard" type={view === 'dashboard' ? 'default' : 'normal'} stylingMode="outlined" onClick={onSwitchToDashboard} />
        <Button text="Add Email" type="default" stylingMode="contained" onClick={onCompose} />
        <Button
          text={themeMode === 'light' ? 'Dark' : 'Light'}
          icon="contrast"
          stylingMode="outlined"
          onClick={onToggleTheme}
        />
      </div>
    </header>
  );
}
