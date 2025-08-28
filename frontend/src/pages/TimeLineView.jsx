import React, { useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import timelinePlugin from '@fullcalendar/resource-timeline';
import interactionPlugin from "@fullcalendar/interaction";
import viLocale from '@fullcalendar/core/locales/vi';
import axios from '../services/api';
import '../styles/TimeLineView.css';
import { useTaskModal } from '../contexts/TaskModalContext';

export default function TimelineView({ project }) {
  const [resourceReloadKey, setResourceReloadKey] = useState(0);
  const [resources, setResources] = useState([]);
  const [taskFilter, setTaskFilter] = useState('all'); // 'done', 'undone', 'archive', 'all'
  const { openModalForEditTask, openModalForNewTask } = useTaskModal();

  useEffect(() => {
    fetchResources();
  }, [resourceReloadKey]);

  const fetchResources = async () => {
    try {
      const resGroups = await axios.get(`/projects/${project.ID}/groups`);
      const resTasks = await axios.get(`/projects/${project.ID}/tasks`);

      const grouped = resGroups.data.map(group => {
        const taskResources = resTasks.data
          .filter(task => task.GROUP_ID === group.ID)
          .map(task => ({
            id: `${task.ID}`,
            title: task.task_name,
            extendedProps: { task }
          }));

        // ➕ Add button as a "fake" resource
        const addResource = {
          id: `add-${group.ID}`,
          title: '+ Thêm công việc',
          extendedProps: {
            isAddButton: true,
            groupId: group.ID
          }
        };

        return {
          id: `group-${group.ID}`,
          title: group.group_name,
          children: [...taskResources, addResource]
        };
      });

      setResources(grouped);

    } catch (err) {
      console.error('Error building collapsible resources:', err);
    }
  };


  const fetchEvents = async (info, successCallback, failureCallback) => {
    try {
      const res = await axios.get(`/projects/${project.ID}/tasks`);
      const transformed = res.data
        .filter(task => {
          if (taskFilter === 'done') return task.task_state === true;
          if (taskFilter === 'undone') return task.task_state === false;
          if (taskFilter === 'archive') return task.is_archive;
          return true;
        })
        .map(task => ({
          id: task.ID,
          title: task.task_name,
          start: task.start_date,
          end: task.end_date ? addOneDay(task.end_date) : null,
          resourceId: `${task.ID}`,
          allDay: true,
          extendedProps: task
        }));
      successCallback(transformed);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      failureCallback(error);
    }
  };

  const handleDateClick = (info) => {
    openModalForNewTask({
      PROJECT_ID: project.ID,
      start_date: info.dateStr,
      end_date: info.dateStr,
    });
  };


  function parseLocalDate(dateStr) {
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d);
  }

  function formatDate(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  function addOneDay(dateStr) {
    const date = parseLocalDate(dateStr);
    date.setDate(date.getDate() + 1);
    return formatDate(date);
  }

  function handleEventColor(info) {
    const { task_state, start_date, end_date} = info.event.extendedProps;

    const today = new Date().toISOString().split('T')[0];
    const due = end_date || start_date;

    let color = '#fff';
    if (due < today) color = '#dc3545';
    else {
      const diff = (new Date(due) - new Date(today)) / (1000 * 60 * 60 * 24);
      if (diff <= 7) color = '#ffc107';
    }

    info.el.style.backgroundColor = task_state ? '#ccc' : color;
    info.el.style.color = 'black';
    info.el.style.border = 'none';
  }

  const handleEventClick = (info) => {
    const task = info.event.extendedProps;
    openModalForEditTask({ ...task, project_name: project.project_name });
  };

  return (
    <div className="calendar-view">
      <select value={taskFilter} onChange={e => setTaskFilter(e.target.value)}>
        <option value="all">Tất cả</option>
        <option value="undone">Chưa hoàn thành</option>
        <option value="done">Đã hoàn thành</option>
        <option value="archive">Đã lưu trữ</option>
      </select>
      <FullCalendar
        plugins={[timelinePlugin, interactionPlugin]}
        initialView="resourceTimelineMonth"
        resources={resources}
        locale={viLocale}
        events={fetchEvents}
        eventClick={handleEventClick}
        height="auto"
        slotMinHeight={20}
        slotMaxHeight={20}
        expandRows={true}
        resourceAreaWidth="50%"
        eventTextColor="black"
        eventDidMount={handleEventColor}
        resourceAreaColumns={[
          {
            field: 'title',
            headerContent: 'Công việc',
            cellContent: (args) => {
              const task = args.resource?.extendedProps?.task;
              const isAddButton = args.resource?.extendedProps?.isAddButton;
              const groupId = args.resource?.extendedProps?.groupId;

              console.log("isAddButton:", isAddButton, "Group ID:", groupId);
              if (isAddButton) {
                return (
                  console.log("Add button clicked for group:", groupId),
                  <button className="add-card"
                    onClick={(e) => {
                      e.stopPropagation();
                      openModalForNewTask({
                        PROJECT_ID: project.ID,
                        GROUP_ID: groupId,
                        project_name: project.project_name,
                        start_date: new Date().toISOString().split('T')[0],
                        end_date: new Date().toISOString().split('T')[0]
                      });
                    }}
                  >
                    + Thêm công việc
                  </button>
                );
              }

              if (!task) return args.resource.title;

              const handleCheckboxClick = async (e) => {
                e.stopPropagation();
                try {
                  await axios.patch(`/tasks/${task.ID}/toggle-state`);
                  setResourceReloadKey(prev => prev + 1);
                } catch (err) {
                  console.error("Failed to toggle task", err);
                }
              };

              return (
                <div>
                  <input
                    type="checkbox"
                    checked={task.task_state}
                    onChange={handleCheckboxClick}
                    style={{ marginRight: '6px' }}
                  />
                  <span
                    style={{
                      color: task.task_state ? '#999' : 'black',
                      textDecoration: task.task_state ? 'line-through' : 'none',
                      fontWeight: 500
                    }}
                  >
                    {task.task_name}
                  </span>
                </div>
              );
            }
          },
          {
            headerContent: 'Ngày bắt đầu',
            field: 'start_date',
            cellContent: (args) => {
              const task = args.resource?.extendedProps?.task;
              return task !== null ? task?.start_date : '';
            }
          },
          {
            headerContent: 'Ngày kết thúc',
            field: 'end_date',
            cellContent: (args) => {
              const task = args.resource?.extendedProps?.task;
              return task !== null ? task?.end_date : '';
            }
          },
          {
            headerContent: 'Tiến độ',
            field: 'progress',
            cellContent: (args) => {
              const task = args.resource?.extendedProps?.task;
              return task?.progress != null ?
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${task.progress}%` }} />
                </div>
                : '';
            }
          }
        ]}
      />

    </div>
  );
}
