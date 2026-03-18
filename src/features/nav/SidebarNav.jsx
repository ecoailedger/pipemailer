import List from 'devextreme-react/list';
import PieChart, { Legend, Series } from 'devextreme-react/pie-chart';

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
 *  deals: Array<{stage:string}>,
 *  onFolderChange: (folder: string) => void,
 *  onStageSelect: (stage: string) => void
 * }} props
 */
export default function SidebarNav({ selectedFolder, pipelineStages, selectedStage, deals, onFolderChange, onStageSelect }) {
  const chartData = pipelineStages.map((stage) => ({
    stage,
    count: deals.filter((deal) => deal.stage === stage).length
  }));

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

      <h4 className="section-title">Stage Summary</h4>
      <div id="stageChart">
        <PieChart dataSource={chartData} type="doughnut" palette="Soft" size={{ height: 178 }}>
          <Series argumentField="stage" valueField="count">
          </Series>
          <Legend horizontalAlignment="center" verticalAlignment="bottom" />
        </PieChart>
      </div>
    </div>
  );
}
