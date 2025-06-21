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

    const [performers, setPerformers] = useState([]);
    const [groups, setGroups] = useState([]);
    console.log("Project id: " + formData.project_id);


    useEffect(() => {
        if (task) {
            setFormData(prev => ({ ...prev, ...task }));
        }
    }, [task]);

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
        if (formData.ID) {
            await axios.put(`/tasks/${formData.ID}`, cleanFormData);
        } else {
            await axios.post('/tasks', cleanFormData);
        }
        closeModal();
        triggerTaskRefresh();
    };

    const handleArchive = async () => {
        if (!formData.ID) return;
        await axios.patch(`/tasks/${formData.ID}/archive`);
        closeModal();
        triggerTaskRefresh();
    };

    const handleDelete = async () => {
        if (!formData.ID) return;
        if (window.confirm('Bạn có chắc chắn muốn xóa công việc này?')) {
            await axios.delete(`/tasks/${formData.ID}`);
            closeModal();
            triggerTaskRefresh();
        }
    };

    function formatDateForInput(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toISOString().split('T')[0]; // "2025-06-04"
    }

    return (
        <form className="task-form" onSubmit={handleSubmit}>
            <div className="task-form-header">
                <input
                    type="text"
                    name="task_name"
                    value={formData.task_name}
                    onChange={handleChange}
                    placeholder="Tên công việc"
                    className="task-title-input"
                />
                <div className="task-meta-top">
                    <span>Trong dự án: <strong>{task?.project_name || 'Không có dự án'}</strong></span>
                </div>
            </div>

            <div className="task-form-body">
                <section className="task-section">
                    <label>Mô tả</label>
                    <textarea
                        name="task_description"
                        value={formData.task_description}
                        onChange={handleChange}
                        placeholder="Thêm mô tả chi tiết..."
                    />
                </section>

                <section className="task-section">
                    <label>Thẻ (Label)</label>
                    <input
                        type="text"
                        name="label"
                        value={formData.label}
                        onChange={handleChange}
                        placeholder="VD: thiết kế, gấp, cần review"
                    />
                </section>

                <section className="task-section">
                    <label>Tiến độ (%)</label>
                    <input
                        type="number"
                        name="progress"
                        min="0"
                        max="100"
                        value={formData.progress}
                        onChange={handleChange}
                    />
                </section>

                <section className="task-section">
                    <label>Ngày bắt đầu</label>
                    <input
                        type="date"
                        name="start_date"
                        value={formatDateForInput(formData.start_date)}
                        onChange={handleChange}
                    />
                </section>

                <section className="task-section">
                    <label>Ngày kết thúc</label>
                    <input
                        type="date"
                        name="end_date"
                        value={formatDateForInput(formData.end_date)}
                        onChange={handleChange}
                    />
                </section>

                <section className="task-section">
                    <label>Người thực hiện</label>
                    {formData.project_id ? (
                        <select name="performer_id" value={formData.performer_id || ''} onChange={handleChange}>
                            <option value="">-- Chọn người --</option>
                            {performers.map(p =>
                                <option key={p.ID} value={p.ID}>{p.username}</option>
                            )}
                        </select>
                    ) : (
                        <p>{user.username}</p>
                    )}
                </section>

                <button type="submit">
                    {selectedTask !== null ? 'Lưu thay đổi' : 'Tạo mới'}
                </button>
                {selectedTask !== null && (
                    <div className="task-form-actions">
                        <button type="button" className="archive-btn" onClick={handleArchive}>📦 Lưu trữ</button>
                        <button type="button" className="delete-btn" onClick={handleDelete}>🗑 Xóa</button>
                    </div>
                )}
            </div>
        </form>

    );
}

export default TaskForm;
