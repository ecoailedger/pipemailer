import List from 'devextreme-react/list';

/**
 * @param {{
 *  view: 'email' | 'pipeline' | 'dashboard',
 *  selectedFolder: string,
 *  selectedQueue: string,
 *  onSelectFolder: (folder: string) => void,
 *  onSelectQueue: (queue: string) => void,
 *  onOpenPipeline: (stage?: string | null) => void,
 *  folderCounts: Record<string, number>,
 *  queueCounts: Record<string, number>,
 *  pipelineStages: string[]
 * }} props
 */
export default function SidebarNav({
  view,
  selectedFolder,
  selectedQueue,
  onSelectFolder,
  onSelectQueue,
  onOpenPipeline,
  folderCounts,
  queueCounts,
  pipelineStages
}) {
  const folders = [
    { id: 'inbox', label: 'Inbox' },
    { id: 'sent', label: 'Sent' },
    { id: 'drafts', label: 'Drafts' },
    { id: 'archive', label: 'Archive' }
  ];

  const stageItems = [{ id: null, label: 'All stages' }, ...pipelineStages.map((stage) => ({ id: stage, label: stage }))];
  const queueItems = [
    { id: 'all', label: 'All' },
    { id: 'unassigned', label: 'Unassigned' },
    { id: 'mine', label: 'Mine' },
    { id: 'team', label: 'Team' }
  ];

  return (
    <div>
      <h4 className="section-title">Navigation</h4>
      <List
        id="folders"
        dataSource={folders}
        keyExpr="id"
        selectionMode="single"
        selectedItemKeys={[selectedFolder]}
        disabled={view === 'pipeline'}
        onSelectionChanged={(event) => {
          const folder = event.addedItems?.[0]?.id;
          if (folder) onSelectFolder(folder);
        }}
        itemRender={(item) => (
          <span>
            {item.label} <span className="count-muted">({folderCounts[item.id] ?? 0})</span>
          </span>
        )}
      />

      <h4 className="section-title">Queues</h4>
      <List
        id="queues"
        dataSource={queueItems}
        keyExpr="id"
        selectionMode="single"
        selectedItemKeys={[selectedQueue]}
        onSelectionChanged={(event) => {
          const queue = event.addedItems?.[0]?.id;
          if (queue) onSelectQueue(queue);
        }}
        itemRender={(item) => (
          <span>
            {item.label} <span className="count-muted">({queueCounts[item.id] ?? 0})</span>
          </span>
        )}
      />

      <h4 className="section-title">Pipeline Stages</h4>
      <List
        id="pipelineStages"
        dataSource={stageItems}
        selectionMode="none"
        onItemClick={(event) => onOpenPipeline(event.itemData.id ?? null)}
        itemRender={(item) => <span>{item.label}</span>}
      />
    </div>
  );
}
