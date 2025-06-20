import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { useUser } from '../contexts/UserContext';
import { useTaskModal } from '../contexts/TaskModalContext';
import axios from '../services/api';
import '../styles/TaskForm.css';

function TaskForm({ task = {} }) {
    const { user } = useUser();
    const { selectedTask, closeModal, triggerTaskRefresh } = useTaskModal();
    const [formData, setFormData] = useState({
        task_name: '',
        task_description: '',
        label: '',
        start_date: '',
        end_date: '',
        progress: 0,
        performer_id: user.id,
        project_id: null,
        group_id: null,
    });

    const [projects, setProjects] = useState([]);
    const [performers, setPerformers] = useState([]);
    const [groups, setGroups] = useState([]);
    console.log("Project id: " + formData.project_id);


    useEffect(() => {
        if (task) {
            setFormData(prev => ({ ...prev, ...task }));
        }
    }, [task]);

    useEffect(() => {
        axios.get('/projects').then(res => setProjects(res.data));
    }, []);

    useEffect(() => {
        console.log("Have Project id? " + formData.project_id);
        if (formData.project_id) {
            axios.get(`/projects/${formData.project_id}/members`).then(res => setPerformers(res.data));
            axios.get(`/projects/${formData.project_id}/groups`).then(res => setGroups(res.data));
        } else {
            setPerformers([]);
            setGroups([]);
        }
    }, [formData.project_id]);

    useEffect(() => {
        if (!formData.project_id && user?.id) {
            setFormData(prev => ({
                ...prev,
                performer_id: user.id
            }));
        }
    }, [formData.project_id, user?.id]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        console.log(formData);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const cleanFormData = {
            ...formData,
            start_date: formData.start_date ? format(new Date(formData.start_date), 'yyyy-MM-dd') : null,
            end_date: formData.end_date ? format(new Date(formData.end_date), 'yyyy-MM-dd') : null,
        };

        console.log("This is the final performer: " + cleanFormData.performer_id);
        if (selectedTask !== null) {
            await axios.put(`/tasks/${formData.ID}`, cleanFormData);
        } else {
            await axios.post('/tasks', cleanFormData);
        }
        closeModal();
        triggerTaskRefresh();
    };

    function formatDateForInput(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toISOString().split('T')[0]; // "2025-06-04"
    }

    return (
        <form className="task-form" onSubmit={handleSubmit}>
            <h3>{selectedTask !== null ? 'Chỉnh sửa công việc' : 'Tạo công việc mới'}</h3>

            <label>Tên công việc</label>
            <input type="text" name="task_name" value={formData.task_name} onChange={handleChange} required />

            <label>Mô tả</label>
            <textarea name="task_description" value={formData.task_description} onChange={handleChange} />

            <label>Nhãn (phân cách bằng dấu phẩy)</label>
            <input type="text" name="label" value={formData.label} onChange={handleChange} />

            <label>Ngày bắt đầu (Tháng/Ngày/Năm)</label>
            <input type="date" name="start_date" value={formatDateForInput(formData.start_date)} onChange={handleChange} />

            <label>Ngày kết thúc (Tháng/Ngày/Năm)</label>
            <input type="date" name="end_date" value={formatDateForInput(formData.end_date)} onChange={handleChange} />

            <label>Tiến độ (%)</label>
            <input type="number" name="progress" min="0" max="100" value={formData.progress} onChange={handleChange} />

            {/* <label>Người thực hiện</label>
            {formData.project_id ? (
                <select name="performer_id" value={formData.performer_id || ''} onChange={handleChange}>
                    <option value="">-- Chọn người --</option>
                    {performers.map(p =>
                        <option key={p.ID} value={p.ID}>{p.username}</option>
                    )}
                </select>
            ) : (
                <p>{user.username}</p>
            )} */}

            <label>Dự án</label>
            <p>{task ? task.project_name : "Không có dự án"}</p>

            <button type="submit">{selectedTask !== null ? 'Lưu thay đổi' : 'Tạo mới'}</button>
        </form>
    );
}

export default TaskForm;
