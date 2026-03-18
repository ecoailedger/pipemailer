import List from 'devextreme-react/list';

/**
 * @param {{
 *  view: 'email' | 'pipeline',
 *  selectedFolder: string,
 *  onSelectFolder: (folder: string) => void,
 *  onOpenPipeline: (stage?: string | null) => void,
 *  folderCounts: Record<string, number>,
 *  pipelineStages: string[]
 * }} props
 */
export default function SidebarNav({ view, selectedFolder, onSelectFolder, onOpenPipeline, folderCounts, pipelineStages }) {
  const folders = [
    { id: 'inbox', label: 'Inbox' },
    { id: 'sent', label: 'Sent' },
    { id: 'drafts', label: 'Drafts' },
    { id: 'archive', label: 'Archive' }
  ];

  const stageItems = [{ id: null, label: 'All stages' }, ...pipelineStages.map((stage) => ({ id: stage, label: stage }))];

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
