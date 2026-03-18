import List from 'devextreme-react/list';

const folders = [
  { id: 'inbox', text: 'Inbox' },
  { id: 'sent', text: 'Sent' },
  { id: 'drafts', text: 'Drafts' }
];

/**
 * @param {{
 *  selectedFolder: string,
 *  pipelineStages: string[],
 *  selectedStage: string,
 *  onFolderChange: (folder: string) => void,
 *  onStageSelect: (stage: string) => void
 * }} props
 */
export default function SidebarNav({ selectedFolder, pipelineStages, selectedStage, onFolderChange, onStageSelect }) {
  return (
    <div>
      <h4 className="section-title">Folders</h4>
      <List
        id="folders"
        dataSource={folders}
        keyExpr="id"
        selectionMode="single"
        selectedItemKeys={[selectedFolder]}
        displayExpr="text"
        onSelectionChanged={(event) => {
          const folder = event.addedItems?.[0]?.id;
          if (folder) onFolderChange(folder);
        }}
      />

      <h4 className="section-title">Pipeline Stages</h4>
      <List
        id="pipelineStages"
        dataSource={pipelineStages.map((stage) => ({ id: stage, text: stage }))}
        keyExpr="id"
        selectionMode="single"
        selectedItemKeys={[selectedStage]}
        displayExpr="text"
        onSelectionChanged={(event) => {
          const stage = event.addedItems?.[0]?.id;
          if (stage) onStageSelect(stage);
        }}
      />
    </div>
  );
}
