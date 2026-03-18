import { useMemo, useState } from 'react';
import AppShell from './layout/AppShell';
import TopBar from './features/topbar/TopBar.jsx';
import SidebarNav from './features/nav/SidebarNav.jsx';
import EmailListView from './features/email/EmailListView.jsx';
import PipelineView from './features/pipeline/PipelineView.jsx';
import DashboardView from './features/dashboard/DashboardView.jsx';
import RightPanel from './features/details/RightPanel.jsx';
import ComposePopup from './features/popups/ComposePopup.jsx';
import DealPopup from './features/popups/DealPopup.jsx';
import LinkPopup from './features/popups/LinkPopup.jsx';
import { useAppStore } from './state/useAppStore';
import { buildDashboardMetrics, selectEmailsWithSla } from './features/dashboard/selectors';
import { buildReturnCaseLookupByEmailId, matchesDealSearch, matchesEmailSearch } from './state/selectors';

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
  const [selectedAssigneeFilter, setSelectedAssigneeFilter] = useState('all');
  const normalizedSearchQuery = state.searchQuery.trim().toLowerCase();
  const assigneeLookup = useMemo(
    () => Object.fromEntries(state.assignees.map((item) => [item.id, item.name])),
    [state.assignees]
  );

  const emailsWithSla = useMemo(() => selectEmailsWithSla(state.emails), [state.emails]);
  const returnCaseByEmailId = useMemo(() => buildReturnCaseLookupByEmailId(state.returnCases), [state.returnCases]);

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
    return emailsWithSla.filter((email) => {
      if (email.folder !== state.selectedFolder) return false;
      if (state.selectedQueue === 'unassigned' && email.assigneeId) return false;
      if (state.selectedQueue === 'mine' && email.assigneeId !== state.currentUserId) return false;
      if (state.selectedQueue === 'team' && !state.teamAssigneeIds.includes(email.assigneeId)) return false;
      if (selectedAssigneeFilter !== 'all' && email.assigneeId !== selectedAssigneeFilter) return false;
      const linkedReturnCase = returnCaseByEmailId[email.id] ?? null;
      return matchesEmailSearch(email, normalizedSearchQuery, linkedReturnCase);
    });
  }, [
    normalizedSearchQuery,
    selectedAssigneeFilter,
    state.currentUserId,
    emailsWithSla,
    state.selectedFolder,
    state.selectedQueue,
    state.teamAssigneeIds,
    returnCaseByEmailId
  ]);

  const dealApprovalStatusById = useMemo(() => {
    const statusWeight = { none: 0, rejected: 1, approved: 2, required: 3 };
    return state.emails.reduce((lookup, email) => {
      if (!email.dealId) return lookup;
      const nextStatus = email.approvalStatus ?? 'none';
      const prevStatus = lookup[email.dealId] ?? 'none';
      if (statusWeight[nextStatus] > statusWeight[prevStatus]) {
        lookup[email.dealId] = nextStatus;
      }
      return lookup;
    }, {});
  }, [state.emails]);

  const queueCounts = useMemo(() => {
    const inboxEmails = state.emails.filter((email) => email.folder === state.selectedFolder);
    return {
      all: inboxEmails.length,
      unassigned: inboxEmails.filter((email) => !email.assigneeId).length,
      mine: inboxEmails.filter((email) => email.assigneeId === state.currentUserId).length,
      team: inboxEmails.filter((email) => state.teamAssigneeIds.includes(email.assigneeId)).length
    };
  }, [state.currentUserId, state.emails, state.selectedFolder, state.teamAssigneeIds]);

  const searchableDeals = useMemo(() => {
    if (!normalizedSearchQuery || state.view === 'email') return state.deals;
    return state.deals.filter((deal) => matchesDealSearch(deal, normalizedSearchQuery));
  }, [normalizedSearchQuery, state.deals, state.view]);

  const filteredDeals = useMemo(() => {
    return searchableDeals.map((deal) => ({
      ...deal,
      approvalStatus: deal.approvalStatus ?? dealApprovalStatusById[deal.id] ?? 'none'
    })).filter((deal) => {
      if (state.selectedStage && deal.stage !== state.selectedStage) return false;
      return true;
    });
  }, [dealApprovalStatusById, searchableDeals, state.selectedStage]);

  const selectedEmail = useMemo(
    () => emailsWithSla.find((email) => email.id === state.selectedEmailId) ?? null,
    [emailsWithSla, state.selectedEmailId]
  );
  const selectedDeal = useMemo(
    () => state.deals.find((deal) => deal.id === state.selectedDealId) ?? null,
    [state.deals, state.selectedDealId]
  );
  const selectedReturnCase = useMemo(() => {
    if (!selectedEmail?.returnCaseId) return null;
    return state.returnCases.find((item) => item.id === selectedEmail.returnCaseId) ?? null;
  }, [selectedEmail, state.returnCases]);

  const dashboardMetrics = useMemo(
    () => buildDashboardMetrics(state.deals, emailsWithSla, state.pipelineStages, new Date(), state.macroTemplates, state.macroUsageLog),
    [state.deals, emailsWithSla, state.pipelineStages, state.macroTemplates, state.macroUsageLog]
  );

  const handleDashboardDrillDown = ({ target, folder = 'inbox', stage = null, assigneeId, queue = 'all' }) => {
    if (target === 'pipeline') {
      actions.setSelectedStage(stage);
      actions.setView('pipeline');
      return;
    }

    actions.setSelectedFolder(folder);
    actions.setSelectedQueue(queue);
    setSelectedAssigneeFilter(assigneeId ?? 'all');
    actions.setView('email');
  };

  return (
    <div style={themeVars[state.themeMode]}>
      <AppShell
        topbar={
          <TopBar
            view={state.view}
            themeMode={state.themeMode}
            searchText={state.searchQuery}
            onCompose={() => actions.setPopupOpen('compose', true)}
            onCreateDeal={() => actions.setPopupOpen('deal', true)}
            onToggleTheme={actions.toggleTheme}
            onSwitchToEmail={() => actions.setView('email')}
            onSwitchToPipeline={() => actions.setView('pipeline')}
            onSwitchToDashboard={() => actions.setView('dashboard')}
            onSearchChange={actions.setSearchQuery}
          />
        }
        left={
          <SidebarNav
            view={state.view}
            selectedFolder={state.selectedFolder}
            selectedQueue={state.selectedQueue}
            folderCounts={folderCounts}
            queueCounts={queueCounts}
            pipelineStages={state.pipelineStages}
            onSelectFolder={(folder) => {
              actions.setSelectedFolder(folder);
              actions.setView('email');
            }}
            onSelectQueue={(queue) => {
              actions.setSelectedQueue(queue);
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
                assignees={state.assignees}
                selectedAssigneeFilter={selectedAssigneeFilter}
                onSelectAssigneeFilter={setSelectedAssigneeFilter}
                onSelectEmail={actions.selectEmail}
                resolveAssigneeName={(assigneeId) => assigneeLookup[assigneeId] ?? 'Unassigned'}
              />
            ) : state.view === 'pipeline' ? (
              <PipelineView
                deals={filteredDeals}
                stages={state.pipelineStages}
                selectedDealId={state.selectedDealId}
                onSelectDeal={actions.selectDeal}
              />
            ) : (
              <DashboardView
                dashboardMetrics={dashboardMetrics}
                emails={emailsWithSla}
                deals={searchableDeals}
                assignees={state.assignees}
                currentUserId={state.currentUserId}
                teamAssigneeIds={state.teamAssigneeIds}
                onDrillDown={handleDashboardDrillDown}
                macroTemplates={state.macroTemplates}
                macroCategories={state.macroCategories}
                onCreateMacro={actions.createMacroTemplate}
                onUpdateMacro={actions.updateMacroTemplate}
                onArchiveMacro={actions.archiveMacroTemplate}
              />
            )}
          </section>
        }
        right={
          <section className="p-4">
            <RightPanel
              selectedEmail={selectedEmail}
              selectedDeal={selectedDeal}
              selectedReturnCase={selectedReturnCase}
              deals={state.deals}
              draft={selectedEmail ? state.replyDrafts[selectedEmail.id] ?? null : null}
              onSetDraft={actions.setReplyDraft}
              onClearDraft={actions.clearReplyDraft}
              onReply={actions.replyToEmail}
              onLinkDeal={actions.linkEmailToDeal}
              assignees={state.assignees}
              resolveAssigneeName={(assigneeId) => assigneeLookup[assigneeId] ?? 'Unassigned'}
              macroTemplates={state.macroTemplates}
              onUseMacro={({ templateId, emailId }) => actions.trackMacroUsage({ templateId, emailId })}
              onAssign={actions.reassignEmail}
              actorName={assigneeLookup[state.currentUserId] ?? 'Internal user'}
              onAddInternalNote={actions.addInternalNote}
              onRequestApproval={actions.requestApproval}
              onApprove={actions.approveRequest}
              onReject={actions.rejectRequest}
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
        defaultEmailId={state.selectedEmailId}
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
