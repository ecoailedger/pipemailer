import List from 'devextreme-react/list';

/**
 * @param {{
 *  selectedFolder: string,
 *  onSelectFolder: (folder: string) => void,
 *  onOpenPipeline: (stage?: string) => void,
 *  folderCounts: Record<string, number>,
 *  pipelineStages: string[]
 * }} props
 */
export default function SidebarNav({ selectedFolder, onSelectFolder, onOpenPipeline, folderCounts, pipelineStages }) {
  const folders = [
    { id: 'inbox', label: 'Inbox' },
    { id: 'sent', label: 'Sent' },
    { id: 'drafts', label: 'Drafts' },
    { id: 'archive', label: 'Archive' }
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
        dataSource={pipelineStages}
        selectionMode="none"
        onItemClick={(event) => onOpenPipeline(event.itemData)}
      />
    </div>
  );
}
