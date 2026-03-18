import { useMemo } from 'react';
import AppShell from './layout/AppShell';
import TopBar from './features/topbar/TopBar.jsx';
import SidebarNav from './features/nav/SidebarNav.jsx';
import EmailListView from './features/email/EmailListView.jsx';
import PipelineView from './features/pipeline/PipelineView.jsx';
import RightPanel from './features/details/RightPanel.jsx';
import ComposePopup from './features/popups/ComposePopup.jsx';
import DealPopup from './features/popups/DealPopup.jsx';
import LinkPopup from './features/popups/LinkPopup.jsx';
import { useAppStore } from './state/useAppStore';

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
  const { state, actions } = useAppStore();

  const folderCounts = useMemo(
    () =>
      state.emails.reduce(
        (counts, email) => {
          counts[email.folder] = (counts[email.folder] ?? 0) + 1;
          return counts;
        },
        { inbox: 0, sent: 0, drafts: 0, archive: 0 }
      ),
    [state.emails]
  );

  const filteredEmails = useMemo(() => {
    const normalized = state.searchQuery.trim().toLowerCase();

    return state.emails.filter((email) => {
      if (email.folder !== state.selectedFolder) return false;
      if (!normalized) return true;
      return [email.from, email.subject, email.snippet].some((field) => field.toLowerCase().includes(normalized));
    });
  }, [state.emails, state.searchQuery, state.selectedFolder]);

  const filteredDeals = useMemo(() => {
    const normalized = state.searchQuery.trim().toLowerCase();

    return state.deals.filter((deal) => {
      if (state.selectedStage && deal.stage !== state.selectedStage) return false;
      if (!normalized) return true;
      return [deal.title, deal.contact, deal.stage].some((field) => field.toLowerCase().includes(normalized));
    });
  }, [state.deals, state.searchQuery, state.selectedStage]);

  const selectedEmail = useMemo(
    () => state.emails.find((email) => email.id === state.selectedEmailId) ?? null,
    [state.emails, state.selectedEmailId]
  );
  const selectedDeal = useMemo(
    () => state.deals.find((deal) => deal.id === state.selectedDealId) ?? null,
    [state.deals, state.selectedDealId]
  );

  return (
    <div style={themeVars[state.themeMode]}>
      <AppShell
        topbar={
          <TopBar
            view={state.view}
            themeMode={state.themeMode}
            searchText={state.searchQuery}
            onCompose={() => actions.setPopupOpen('compose', true)}
            onToggleTheme={actions.toggleTheme}
            onSwitchToEmail={() => actions.setView('email')}
            onSwitchToPipeline={() => actions.setView('pipeline')}
            onSearchChange={actions.setSearchQuery}
          />
        }
        left={
          <SidebarNav
            view={state.view}
            selectedFolder={state.selectedFolder}
            folderCounts={folderCounts}
            pipelineStages={state.pipelineStages}
            onSelectFolder={(folder) => {
              actions.setSelectedFolder(folder);
              actions.setView('email');
            }}
            onOpenPipeline={(stage) => {
              actions.setSelectedStage(stage ?? null);
              actions.setView('pipeline');
            }}
          />
        }
        main={
          <section className="p-4">
            {state.view === 'email' ? (
              <EmailListView
                emails={filteredEmails}
                selectedEmailId={state.selectedEmailId}
                onSelectEmail={actions.selectEmail}
              />
            ) : (
              <PipelineView
                deals={filteredDeals}
                stages={state.pipelineStages}
                selectedDealId={state.selectedDealId}
                onSelectDeal={actions.selectDeal}
              />
            )}
          </section>
        }
        right={
          <section className="p-4">
            <RightPanel
              selectedEmail={selectedEmail}
              selectedDeal={selectedDeal}
              onCompose={() => actions.setPopupOpen('compose', true)}
              onCreateDeal={() => actions.setPopupOpen('deal', true)}
              onLinkEmail={() => actions.setPopupOpen('link', true)}
            />
          </section>
        }
      />
      <ComposePopup
        open={state.popups.compose}
        onClose={() => actions.setPopupOpen('compose', false)}
        onSave={actions.saveCompose}
      />
      <DealPopup
        open={state.popups.deal}
        stages={state.pipelineStages}
        onClose={() => actions.setPopupOpen('deal', false)}
        onSave={actions.saveDeal}
      />
      <LinkPopup
        open={state.popups.link}
        emails={state.emails}
        deals={state.deals}
        defaultEmailId={state.selectedEmailId}
        defaultDealId={state.selectedDealId}
        onClose={() => actions.setPopupOpen('link', false)}
        onSave={actions.saveLink}
      />
    </div>
  );
}
