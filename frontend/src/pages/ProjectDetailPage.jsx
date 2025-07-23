import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from '../services/api';
import KanbanView from './KanbanView';
import CalendarView from './CalendarView';
import TimelineView from './TimeLineView';
import Drawer from '../components/Drawer';
import ProjectForm from '../components/ProjectForm.jsx';
import '../styles/ProjectDetailPage.css';
import { MdViewKanban, MdCalendarMonth, MdTimeline } from 'react-icons/md';
import ArchivedTasksPanel from '../components/ArchivedTasksPanel.jsx';

const TABS = [
  { label: 'Xem trên bảng', icon: <MdViewKanban size={20} style={{ verticalAlign: 'middle' }} /> },
  { label: 'Xem trên lịch', icon: <MdCalendarMonth size={20} style={{ verticalAlign: 'middle' }} /> },
  { label: 'Dòng thời gian', icon: <MdTimeline size={20} style={{ verticalAlign: 'middle' }} /> }
];

export default function ProjectDetailPage() {
  const { projectId } = useParams();
  const [project, setProject] = useState(null);
  const [showDrawer, setShowDrawer] = useState(false);
  const [showArchivedTasksPanel, setShowArchivedTasksPanel] = useState(false);
  const [editingProject, setEditingProject] = useState(null);

  useEffect(() => {
    refetchProject();
  }, [projectId]);

  const refetchProject = () => {
    axios.get(`/projects/${projectId}`)
      .then(res => setProject(res.data))
      .catch(err => console.error('Failed to reload project', err));
  }

  const [activeTab, setActiveTab] = useState(TABS[0].label);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'Xem trên bảng': return <KanbanView project={project} />;
      case 'Xem trên lịch': return <CalendarView project={project} />;
      case 'Dòng thời gian': return <TimelineView project={project} />;
      default: return null;
    }
  };

  const openEditDrawer = (project) => {
    setEditingProject(project);
    setShowDrawer(true);
  };

  const closeDrawer = () => setShowDrawer(false);

  if (!project) return <div className="project-detail-page">Đang tải thông tin danh sách...</div>;

  return (
    <div className="project-detail-page">
      <div className="project-header">
        <h3>{project.project_name}</h3>
        <section className="project-info">
          <button onClick={() => openEditDrawer(project)} className="edit-btn">Thông tin</button>
          <button onClick={() => setShowArchivedTasksPanel(true)} className="archive-btn">Danh sách lưu trữ</button>
        </section>
      </div>

      <div className="project-tabs">
        {TABS.map(tab => (
          <div
            key={tab.label}
            className={`project-tab ${activeTab === tab.label ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.label)}
          >
            <span style={{ marginRight: 6 }}>{tab.icon}</span>
            {tab.label.toUpperCase()}
          </div>
        ))}
      </div>

      <div className="project-view-container">
        {renderTabContent()}
      </div>
      <Drawer isOpen={showDrawer} onClose={closeDrawer}>
        <ProjectForm
          project={editingProject}
          onSuccess={() => {
            closeDrawer();
            refetchProject();
          }}
          onCancel={closeDrawer}
        />
      </Drawer>
      <ArchivedTasksPanel
        isOpen={showArchivedTasksPanel}
        onClose={() => setShowArchivedTasksPanel(false)}
        projectId={project ? project.ID : null}
      />
    </div>
  );
}
