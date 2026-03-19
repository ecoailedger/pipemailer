import Button from 'devextreme-react/button';
import TextBox from 'devextreme-react/text-box';

/**
 * @param {{
 *  view: 'email' | 'pipeline' | 'dashboard',
 *  themeMode: 'light' | 'dark',
 *  searchText: string,
 *  onCompose: () => void,
 *  onCreateDeal: () => void,
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
  onCreateDeal,
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
        placeholder="Search emails, deals, RMA, order, SKU"
        mode="search"
        stylingMode="filled"
        value={searchText}
        onValueChanged={(e) => onSearchChange(e.value ?? '')}
      />
      <div className="top-actions">
        <Button
          className="topbar-btn topbar-btn--view"
          text="Email View"
          type={view === 'email' ? 'default' : 'normal'}
          stylingMode="outlined"
          onClick={onSwitchToEmail}
        />
        <Button
          className="topbar-btn topbar-btn--view"
          text="Pipeline View"
          type={view === 'pipeline' ? 'default' : 'normal'}
          stylingMode="outlined"
          onClick={onSwitchToPipeline}
        />
        <Button
          className="topbar-btn topbar-btn--view"
          text="Dashboard"
          type={view === 'dashboard' ? 'default' : 'normal'}
          stylingMode="outlined"
          onClick={onSwitchToDashboard}
        />
        <Button className="topbar-btn topbar-btn--add-email" text="Add Email" type="default" stylingMode="contained" onClick={onCompose} />
        <Button className="topbar-btn topbar-btn--add-deal" text="Add Deal / Return" stylingMode="outlined" onClick={onCreateDeal} />
        <Button
          className="topbar-btn topbar-btn--theme"
          text={themeMode === 'light' ? 'Dark' : 'Light'}
          icon="contrast"
          stylingMode="outlined"
          onClick={onToggleTheme}
        />
      </div>
    </header>
  );
}
