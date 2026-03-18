import Button from 'devextreme-react/button';
import TextBox from 'devextreme-react/text-box';

/**
 * @param {{
 *  onCompose: () => void,
 *  onToggleTheme: () => void,
 *  themeMode: 'light'|'dark',
 *  searchQuery: string,
 *  onSearchChange: (value: string) => void
 * }} props
 */
export default function TopBar({ onCompose, onToggleTheme, themeMode, searchQuery, onSearchChange }) {
  return (
    <header className="topbar">
      <div className="logo">
        Pipe<span>Mailer</span>
      </div>
      <TextBox
        id="searchBox"
        placeholder="Search emails, contacts, and deals"
        mode="search"
        stylingMode="filled"
        value={searchQuery}
        onValueChanged={(event) => onSearchChange(event.value ?? '')}
      />
      <div className="top-actions">
        <Button text="Compose" type="default" stylingMode="contained" onClick={onCompose} />
        <Button text={themeMode === 'light' ? 'Dark' : 'Light'} icon="contrast" stylingMode="outlined" onClick={onToggleTheme} />
      </div>
    </header>
  );
}
