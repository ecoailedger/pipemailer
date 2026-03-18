import { useMemo, useState } from 'react';
import AppShell from './layout/AppShell';
import TopBar from './features/topbar/TopBar';
import SidebarNav from './features/nav/SidebarNav';

const SEED_EMAILS = [
  { id: 1, folder: 'inbox', from: 'Avery', subject: 'Kickoff notes', snippet: 'Shared notes and next steps from kickoff.' },
  { id: 2, folder: 'inbox', from: 'Morgan', subject: 'Pricing draft', snippet: 'Can you confirm assumptions before review?' },
  { id: 3, folder: 'sent', from: 'You', subject: 'Re: Scope update', snippet: 'Thanks! I attached the latest scope version.' },
  { id: 4, folder: 'drafts', from: 'You', subject: 'Follow-up plan', snippet: 'Drafting a follow-up for the legal thread.' },
  { id: 5, folder: 'inbox', from: 'Jordan', subject: 'Timeline check', snippet: 'Do we still target launch in early May?' }
];

const SEED_PIPELINE_STAGES = ['Lead', 'Qualified', 'Proposal', 'Negotiation', 'Won'];

const themeVars = {
  light: {},
  dark: {
    '--bg-base': '#0d1117',
    '--bg-surface': '#161b22',
    '--bg-elevated': '#21262d',
    '--bg-hover': '#30363d',
    '--accent': '#00d4aa',
    '--accent-dim': '#00d4aa33',
    '--text-primary': '#e6edf3',
    '--text-secondary': '#8b949e',
    '--text-muted': '#484f58',
    '--border': '#30363d',
    '--border-subtle': '#21262d'
  }
};

export default function App() {
  const [view, setView] = useState('email');
  const [searchText, setSearchText] = useState('');
  const [selectedFolder, setSelectedFolder] = useState('inbox');
  const [themeMode, setThemeMode] = useState('light');

  const emails = SEED_EMAILS;
  const pipelineStages = SEED_PIPELINE_STAGES;

  const folderCounts = useMemo(() => {
    return emails.reduce(
      (counts, email) => {
        counts[email.folder] = (counts[email.folder] ?? 0) + 1;
        return counts;
      },
      { inbox: 0, sent: 0, drafts: 0 }
    );
  }, [emails]);

  const filteredEmails = useMemo(() => {
    const normalized = searchText.trim().toLowerCase();
    return emails.filter((email) => {
      if (email.folder !== selectedFolder) return false;
      if (!normalized) return true;
      return [email.from, email.subject, email.snippet].some((field) => field.toLowerCase().includes(normalized));
    });
  }, [emails, searchText, selectedFolder]);

  return (
    <div style={themeVars[themeMode]}>
      <AppShell
        topbar={
          <TopBar
            onCompose={() => {}}
            onToggleTheme={() => setThemeMode((current) => (current === 'light' ? 'dark' : 'light'))}
            onSwitchToEmail={() => setView('email')}
            onSwitchToPipeline={() => setView('pipeline')}
            onSearchChange={setSearchText}
          />
        }
        left={
          <SidebarNav
            selectedFolder={selectedFolder}
            folderCounts={folderCounts}
            pipelineStages={pipelineStages}
            selectedStage={pipelineStages[0]}
            deals={[]}
            onFolderChange={setSelectedFolder}
            onStageSelect={() => setView('pipeline')}
          />
        }
        main={
          <section className="p-4">
            {view === 'email' ? (
              <>
                <h3 className="mb-2">Email View (Placeholder)</h3>
                <div className="text-secondary text-sm">Showing {filteredEmails.length} email(s) in {selectedFolder}.</div>
              </>
            ) : (
              <>
                <h3 className="mb-2">Pipeline View (Placeholder)</h3>
                <div className="text-secondary text-sm">Stages: {pipelineStages.join(' • ')}</div>
              </>
            )}
          </section>
        }
        right={
          <section className="p-4">
            <h3 className="mb-2">Details Panel (Placeholder)</h3>
            <div className="text-secondary text-sm">Select an email or pipeline item to view details here.</div>
          </section>
        }
      />
    </div>
  );
}
