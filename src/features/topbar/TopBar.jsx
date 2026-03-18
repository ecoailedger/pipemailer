import Button from 'devextreme-react/button';
import TextBox from 'devextreme-react/text-box';

/**
 * @param {{
 *  onCompose: () => void,
 *  onToggleTheme: () => void,
 *  onShowEmailView: () => void,
 *  onShowPipelineView: () => void,
 *  themeMode: 'light'|'dark',
 *  searchQuery: string,
 *  view: 'email'|'pipeline',
 *  onSearchChange: (value: string) => void
 * }} props
 */
export default function TopBar({
  onCompose,
  onToggleTheme,
  onShowEmailView,
  onShowPipelineView,
  themeMode,
  searchQuery,
  view,
  onSearchChange
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
        value={searchQuery}
        onValueChanged={(event) => onSearchChange(event.value ?? '')}
      />
      <div className="top-actions">
        <Button text="Compose" type="default" stylingMode="contained" onClick={onCompose} />
        <Button text="Email" stylingMode={view === 'email' ? 'contained' : 'outlined'} onClick={onShowEmailView} />
        <Button text="Pipeline" stylingMode={view === 'pipeline' ? 'contained' : 'outlined'} onClick={onShowPipelineView} />
        <Button text={themeMode === 'light' ? 'Dark' : 'Light'} icon="contrast" stylingMode="outlined" onClick={onToggleTheme} />
      </div>
    </header>
  );
}
