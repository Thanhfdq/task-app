import React, { useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import timelinePlugin from '@fullcalendar/resource-timeline';
import viLocale from '@fullcalendar/core/locales/vi';
import axios from '../services/api';
import '../styles/TimelineView.css';
import { useTaskModal } from '../contexts/TaskModalContext';

export default function TimelineView({ project }) {
    const [resourceReloadKey, setResourceReloadKey] = useState(0);
    const [resources, setResources] = useState([]);
    const [groupBy, setGroupBy] = useState('group'); // 'group' or 'user'
    const [taskFilter, setTaskFilter] = useState('all'); // 'done', 'undone', 'archive', 'all'
    const { openModalForEditTask } = useTaskModal();

    useEffect(() => {
        fetchResources();
    }, [groupBy,resourceReloadKey]);

    const fetchResources = async () => {
        try {
            if (groupBy === 'group') {
                const resGroups = await axios.get(`/projects/${project.ID}/groups`);
                const resTasks = await axios.get(`/projects/${project.ID}/tasks`);

                const grouped = resGroups.data.map(group => ({
                    id: `group-${group.ID}`,
                    title: group.group_name,
                    children: resTasks.data
                        .filter(task => task.GROUP_ID === group.ID)
                        .map(task => ({
                            id: `${task.ID}`,
                            title: task.task_name,
                            extendedProps: { task }
                        }))
                }));

                setResources(grouped);
            } else {
                const resUsers = await axios.get(`/projects/${project.ID}/members`);
                const resTasks = await axios.get(`/projects/${project.ID}/tasks`);

                const grouped = resUsers.data.map(user => ({
                    id: `user-${user.ID}`,
                    title: user.user_fullname || user.username,
                    children: resTasks.data
                        .filter(task => task.PERFORMER_ID === user.ID)
                        .map(task => ({
                            id: `${task.ID}`,
                            title: task.task_name,
                            extendedProps: { task }
                        }))
                }));

                setResources(grouped);
            }
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
        const { task_state, start_date, end_date, label } = info.event.extendedProps;

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
            <div style={{ marginBottom: '1rem', display: 'flex', gap: '1rem' }}>
                <label>
                    Nhóm theo:
                    <select value={groupBy} onChange={e => setGroupBy(e.target.value)}>
                        <option value="group">Nhóm công việc</option>
                        <option value="user">Người thực hiện</option>
                    </select>
                </label>
                <label>
                    Lọc công việc:
                    <select value={taskFilter} onChange={e => setTaskFilter(e.target.value)}>
                        <option value="all">Tất cả</option>
                        <option value="undone">Chưa hoàn thành</option>
                        <option value="done">Đã hoàn thành</option>
                        <option value="archive">Đã lưu trữ</option>
                    </select>
                </label>
            </div>
            <FullCalendar
                plugins={[timelinePlugin]}
                initialView="resourceTimelineMonth"
                resources={resources}
                locale={viLocale}
                events={fetchEvents}
                eventClick={handleEventClick}
                height="auto"
                expandRows={true}
                eventTextColor="black"
                eventDidMount={handleEventColor}
                resourceAreaHeaderContent="Nhóm"
                resourceAreaColumns={[
                    {
                        field: 'title',
                        headerContent: 'Công việc',
                        cellContent: (args) => {
                            const task = args.resource?._resource?.extendedProps?.task;
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
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center', height: '100%'
                                }}>
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
                        headerContent: 'Label',
                        field: 'label',
                        cellContent: (args) => {
                            const task = args.resource?.extendedProps?.task;
                            return task?.label || '';
                        }
                    },
                    {
                        headerContent: 'Tiến độ',
                        field: 'progress',
                        cellContent: (args) => {
                            const task = args.resource?.extendedProps?.task;
                            return task?.progress != null ? `${task.progress}%` : '';
                        }
                    }
                ]}
            />

        </div>
    );
}
