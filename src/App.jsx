import { useMemo } from 'react';
import Toast from 'devextreme-react/toast';
import LoadPanel from 'devextreme-react/load-panel';
import AppShell from './layout/AppShell';
import TopBar from './features/topbar/TopBar';
import SidebarNav from './features/nav/SidebarNav';
import EmailListView from './features/email/EmailListView';
import PipelineView from './features/pipeline/PipelineView';
import RightPanel from './features/details/RightPanel';
import ComposePopup from './features/popups/ComposePopup';
import DealPopup from './features/popups/DealPopup';
import LinkPopup from './features/popups/LinkPopup';
import { useAppStore } from './state/useAppStore';

const themeVars = {
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
  },
  light: {}
};

export default function App() {
  const { state, actions } = useAppStore();

  const visibleEmails = useMemo(() => {
    const folderEmails = state.emails.filter((email) => email.folder === state.selectedFolder);
    const query = state.searchQuery.trim().toLowerCase();
    if (!query) return folderEmails;
    return folderEmails.filter((email) => [email.from, email.subject, email.snippet].some((field) => field.toLowerCase().includes(query)));
  }, [state.emails, state.searchQuery, state.selectedFolder]);

  const selectedEmail = state.emails.find((email) => email.id === state.selectedEmailId) ?? null;
  const selectedDeal = state.deals.find((deal) => deal.id === state.selectedDealId) ?? null;

  return (
    <div style={themeVars[state.themeMode]}>
      <AppShell
        topbar={
          <TopBar
            onCompose={() => actions.setPopupOpen('compose', true)}
            onToggleTheme={() => {
              actions.toggleTheme();
              actions.showToast(`Switched to ${state.themeMode === 'light' ? 'dark' : 'light'} mode`);
            }}
            themeMode={state.themeMode}
            searchQuery={state.searchQuery}
            onSearchChange={actions.setSearchQuery}
          />
        }
        left={
          <SidebarNav
            selectedFolder={state.selectedFolder}
            pipelineStages={state.pipelineStages}
            selectedStage={state.selectedStage}
            deals={state.deals}
            onFolderChange={(folder) => {
              actions.setSelectedFolder(folder);
              actions.setView('email');
            }}
            onStageSelect={actions.setSelectedStage}
          />
        }
        main={
          state.view === 'pipeline' ? (
            <PipelineView deals={state.deals} stages={state.pipelineStages} selectedDealId={state.selectedDealId} onSelectDeal={actions.selectDeal} />
          ) : (
            <EmailListView emails={visibleEmails} selectedEmailId={state.selectedEmailId} onSelectEmail={actions.selectEmail} />
          )
        }
        right={
          <RightPanel
            selectedEmail={selectedEmail}
            selectedDeal={selectedDeal}
            onCompose={() => actions.setPopupOpen('compose', true)}
            onCreateDeal={() => actions.setPopupOpen('deal', true)}
            onLinkEmail={() => actions.setPopupOpen('link', true)}
          />
        }
      />

      <ComposePopup
        open={state.popups.compose}
        onClose={() => actions.setPopupOpen('compose', false)}
        onSave={(payload) => {
          actions.saveCompose(payload);
          actions.showToast(payload.body?.trim() ? 'Email sent' : 'Message body is required');
        }}
      />
      <DealPopup
        open={state.popups.deal}
        stages={state.pipelineStages}
        onClose={() => actions.setPopupOpen('deal', false)}
        onSave={(payload) => {
          actions.saveDeal(payload);
          actions.showToast(payload.title?.trim() && payload.contact?.trim() ? 'Deal created' : 'Deal name and contact are required');
        }}
      />
      <LinkPopup
        open={state.popups.link}
        emails={state.emails}
        deals={state.deals}
        defaultEmailId={state.selectedEmailId}
        defaultDealId={state.selectedDealId}
        onClose={() => actions.setPopupOpen('link', false)}
        onSave={(payload) => {
          actions.saveLink(payload);
          actions.showToast(payload.emailId && payload.dealId ? 'Email linked to deal' : 'Pick an email and a deal to link');
        }}
      />

      <Toast visible={state.toast.visible} message={state.toast.message} type="info" displayTime={1800} onHiding={actions.hideToast} />
      <LoadPanel visible={state.showLoading} showPane shading shadingColor="rgba(0,0,0,0.15)" message="Loading..." />
    </div>
  );
}
