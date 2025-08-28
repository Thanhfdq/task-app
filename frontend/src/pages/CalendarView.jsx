import React, { useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from "@fullcalendar/interaction";
import viLocale from '@fullcalendar/core/locales/vi';
import axios from '../services/api';
import '../styles/CalendarView.css';
import { useTaskModal } from '../contexts/TaskModalContext';

export default function CalendarView({ project }) {
    const [events, setEvents] = useState([]);
    const { openModalForEditTask, openModalForNewTask } = useTaskModal();

    const fetchEvents = async (info, successCallback, failureCallback) => {
        try {
            const res = await axios.get(`/projects/${project.ID}/tasks`);
            const transformed = res.data.map(task => ({
                id: task.ID,
                title: task.task_name,
                start: task.start_date,
                end: task.end_date ? addOneDay(task.end_date) : undefined, // FC end is exclusive
                backgroundColor: getColorByDueDate(task.task_state, task.start_date, task.end_date),
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
        return new Date(y, m - 1, d); // không có giờ → mặc định là 00:00 LOCAL TIME
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

    function subtractOneDay(dateStr) {
        const date = parseLocalDate(dateStr);
        date.setDate(date.getDate() - 1);
        return formatDate(date);
    }

    const renderEventContent = (eventInfo) => {
        const { task_state, ID } = eventInfo.event.extendedProps;

        const handleCheckboxClick = async (e) => {
            e.stopPropagation();
            try {
                await axios.patch(`/tasks/${ID}/toggle-state`);
                eventInfo.view.calendar.refetchEvents();
            } catch (err) {
                console.error('Failed to toggle task state:', err);
            }
        };

        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                color: task_state ? '#999' : 'black',
                fontWeight: 'bold',
                textDecoration: task_state ? 'line-through' : 'none'
            }}>
                <input
                    type="checkbox"
                    checked={task_state}
                    onChange={handleCheckboxClick}
                    style={{ marginRight: '6px' }}
                />
                <span>{eventInfo.event.title}</span>
            </div>
        );
    };

    const getColorByDueDate = (task_state, startDateStr, endDateStr) => {
        if (!task_state) {
            const todayStr = new Date().toISOString().split('T')[0];
            const dueStr = endDateStr || startDateStr;
            if (!dueStr) return '#fff';

            if (dueStr < todayStr) return '#dc3545'; // ❌ overdue - red
            const diffDays = Math.floor(
                (new Date(dueStr) - new Date(todayStr)) / (1000 * 60 * 60 * 24)
            );

            if (diffDays <= 7) return '#ffc107'; // ⚠️ due soon - yellow
        }
        return '#fff'; // ✅ ok - white
    };

    const handleEventClick = (info) => {
        const task = info.event.extendedProps;
        console.log("Startday" + task.start_date + " Endday: " + task.end_date);
        openModalForEditTask({ ...task, project_name: project.project_name });
    };

    const handleDateClick = (info) => {
        openModalForNewTask({
            PROJECT_ID: project.ID,
            start_date: info.dateStr,
            end_date: info.dateStr,
        });
    };

    const handleEventDrop = async (info) => {
        const { id, start, end } = info.event;
        try {
            await axios.put(`/tasks/${id}`, {
                start_date: formatDate(start),
                end_date: end ? subtractOneDay(formatDate(end)) : null,
            });
            info.view.calendar.refetchEvents();
            console.log("Startday" + start + " Endday: " + end);
            console.log("Startday" + start?.toISOString().split('T')[0] + " Endday: " + end?.toISOString().split('T')[0]);
        } catch (err) {
            console.error('Failed to update task date:', err);
            info.revert();
        }
    };

    const handleEventResize = async (info) => {
        const { id, start, end } = info.event;
        try {
            await axios.put(`/tasks/${id}`, {
                start_date: formatDate(start),
                end_date: end ? subtractOneDay(formatDate(end)) : null,
            });
            info.view.calendar.refetchEvents();
        } catch (err) {
            console.error('Failed to resize task:', err);
            info.revert();
        }
    };

    return (
        <div className="calendar-view">
            <FullCalendar
                plugins={[dayGridPlugin, interactionPlugin]}
                initialView="dayGridMonth"
                contentHeight="100%"
                expandRows={true}
                locale={viLocale}
                events={fetchEvents}
                eventContent={renderEventContent}
                eventTextColor="black"
                eventClick={handleEventClick}
                dateClick={handleDateClick}
                height="auto"
                editable={true}
                eventResizableFromStart={true}
                eventDrop={handleEventDrop}
                eventResize={handleEventResize}
            />
        </div>
    );
}
