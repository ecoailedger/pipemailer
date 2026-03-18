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

export default function App() {
  const { state, actions } = useAppStore();

  const selectedEmail = state.emails.find((email) => email.id === state.selectedEmailId) ?? null;

  return (
    <>
      <AppShell
        topbar={
          <TopBar
            onCompose={() => actions.setPopupOpen('compose', true)}
            onCreateDeal={() => actions.setPopupOpen('deal', true)}
          />
        }
        left={
          <SidebarNav
            activeView={state.activeView}
            onViewChange={actions.setActiveView}
            onOpenLinkPopup={() => actions.setPopupOpen('link', true)}
          />
        }
        main={
          state.activeView === 'pipeline' ? (
            <PipelineView deals={state.deals} />
          ) : (
            <EmailListView
              emails={state.emails}
              selectedEmailId={state.selectedEmailId}
              onSelectEmail={actions.selectEmail}
            />
          )
        }
        right={<RightPanel selectedEmail={selectedEmail} onCompose={() => actions.setPopupOpen('compose', true)} />}
      />

      <ComposePopup
        open={state.popups.compose}
        onClose={() => actions.setPopupOpen('compose', false)}
        onSave={() => actions.setPopupOpen('compose', false)}
      />
      <DealPopup
        open={state.popups.deal}
        onClose={() => actions.setPopupOpen('deal', false)}
        onSave={() => actions.setPopupOpen('deal', false)}
      />
      <LinkPopup
        open={state.popups.link}
        onClose={() => actions.setPopupOpen('link', false)}
        onSave={() => actions.setPopupOpen('link', false)}
      />
    </>
  );
}
