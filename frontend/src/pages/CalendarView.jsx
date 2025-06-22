import React, { useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from "@fullcalendar/interaction";
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
                start: task.start_date || task.end_date,
                end: task.end_date,
                backgroundColor: !task.task_state
                    ? getColorByLabel(task.label, task.start_date, task.end_date)
                    : undefined,
                extendedProps: task
            }));
            successCallback(transformed);
        } catch (error) {
            console.error("Error fetching tasks:", error);
            failureCallback(error);
        }
    };


    function renderEventContent(eventInfo) {
        const { task_state, ID } = eventInfo.event.extendedProps;

        const handleCheckboxClick = async (e) => {
            e.stopPropagation(); // prevent calendar click
            try {
                await axios.patch(`/tasks/${ID}/toggle-state`);
                eventInfo.view.calendar.refetchEvents(); // optional: refresh calendar
            } catch (err) {
                console.error('Failed to toggle task state:', err);
            }
        };

        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                color: task_state ? '#999' : 'black', // gray if done
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
    }

    const getColorByLabel = (label, startDate, endDate) => {
        const today = new Date();
        const dueDate = endDate ? new Date(endDate) : (startDate ? new Date(startDate) : null);

        if (dueDate) {
            // Overdue
            if (dueDate < today.setHours(0, 0, 0, 0)) {
                return '#dc3545'; // red
            }
            // Due in 7 days or less
            const diffTime = dueDate - new Date(today.setHours(0, 0, 0, 0));
            const diffDays = diffTime / (1000 * 60 * 60 * 24);
            if (diffDays <= 7) {
                return '#ffc107'; // yellow
            }
        }
        return '#fff'; // white
    };

    const handleEventClick = (info) => {
        const task = info.event.extendedProps;
        const taskWithProjectName = {
            ...task,
            project_name: project.project_name
        };

        openModalForEditTask(taskWithProjectName);
    };

    const handleDateClick = (info) => {
        openModalForNewTask({
            project_id: project.ID,
            start_date: info.dateStr,
            end_date: info.dateStr,
        });
    };


    return (
        <div className="calendar-view">
            <FullCalendar
                plugins={[dayGridPlugin, interactionPlugin]}
                initialView="dayGridMonth"
                events={fetchEvents}
                eventContent={renderEventContent}
                eventTextColor="black"
                eventClick={handleEventClick}
                dateClick={handleDateClick}
                height="auto"
            />
        </div>
    );
}
