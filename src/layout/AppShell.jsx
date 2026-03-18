/**
 * @param {{ topbar: import('react').ReactNode, left: import('react').ReactNode, main: import('react').ReactNode, right: import('react').ReactNode }} props
 */
export default function AppShell({ topbar, left, main, right }) {
  return (
    <div className="app-shell">
      {topbar}
      <div className="content">
        <aside className="panel">{left}</aside>
        <main className="panel">{main}</main>
        <aside className="panel right-panel">{right}</aside>
      </div>
    </div>
  );
}
