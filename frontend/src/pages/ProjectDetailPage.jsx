import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from '../services/api';
import KanbanView from './KanbanView';
import CalendarView from './CalendarView';
import '../styles/ProjectDetailPage.css';

const TABS = ['kanban', 'list', 'calendar', 'timeline'];

export default function ProjectDetailPage() {
  const { projectId } = useParams();
  const [project, setProject] = useState(null);
  const [activeTab, setActiveTab] = useState('kanban');

  useEffect(() => {
    axios.get(`/projects/${projectId}`)
      .then(res => setProject(res.data))
      .catch(err => console.error('Failed to load project', err));
  }, [projectId]);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'kanban': return <KanbanView project={project} />;
      case 'list': return <ListView project={project} />;
      case 'calendar': return <CalendarView project={project} />;
      case 'timeline': return <TimelineView project={project} />;
      default: return null;
    }
  };

  if (!project) return <div className="project-detail-page">Đang tải thông tin dự án...</div>;

  return (
    <div className="project-detail-page">
      <div className="project-header">
        <h1>{project.project_name}</h1>
        <div className="project-meta">
          Quản lý: {project.manager_username} | Ngày bắt đầu: {project.start_date} | Ngày kết thúc: {project.end_date}
        </div>
        <div className="project-tags">
          {project.labels?.split(',').map((label, i) => (
            <span key={i}>{label.trim()}</span>
          ))}
        </div>
      </div>

      <div className="project-tabs">
        {TABS.map(tab => (
          <div
            key={tab}
            className={`project-tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab.toUpperCase()}
          </div>
        ))}
      </div>

      <div className="project-view-container">
        {renderTabContent()}
      </div>
    </div>
  );
}
