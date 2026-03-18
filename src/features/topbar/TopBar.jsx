import Button from 'devextreme-react/button';
import TextBox from 'devextreme-react/text-box';

/**
 * @param {{ onCompose: () => void, onCreateDeal: () => void }} props
 */
export default function TopBar({ onCompose, onCreateDeal }) {
  return (
    <header className="topbar">
      <div className="logo">
        Pipe<span>Mailer</span>
      </div>
      <TextBox id="searchBox" placeholder="Search emails, contacts, and deals" mode="search" stylingMode="filled" />
      <div className="top-actions">
        <Button text="Compose" type="default" stylingMode="contained" onClick={onCompose} />
        <Button text="New Deal" type="normal" stylingMode="outlined" onClick={onCreateDeal} />
      </div>
    </header>
  );
}
