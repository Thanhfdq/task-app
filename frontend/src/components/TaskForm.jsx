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
        task_state: false,
        label: '',
        start_date: new Date().toISOString(),
        end_date: new Date().toISOString(),
        progress: 0,
        PERFORMER_ID: user.id,
        PROJECT_ID: null,
        GROUP_ID: null,
    });

    const [performers, setPerformers] = useState([]);
    const [groups, setGroups] = useState([]);
    console.log("TaskForm initialized with task:", selectedTask);


    useEffect(() => {
        if (task) {
            const safeTask = {
                ID: task.ID,
                task_name: task.task_name || '',
                task_description: task.task_description || '',
                label: task.label || '',
                start_date: task.start_date || '',
                end_date: task.end_date || '',
                progress: task.progress || 0,
                PERFORMER_ID: task.PERFORMER_ID || user.id,
                PROJECT_ID: task.PROJECT_ID || null,
                GROUP_ID: task.GROUP_ID || null,
                task_state: task.task_state || false
            };
            setFormData(prev => ({ ...prev, ...safeTask }));
        }
    }, [task]);

    useEffect(() => {
        console.log("Have Project id? " + formData.PROJECT_ID);
        if (formData.PROJECT_ID) {
            axios.get(`/projects/${formData.PROJECT_ID}/members`).then(res => setPerformers(res.data));
            axios.get(`/projects/${formData.PROJECT_ID}/groups`).then(res => setGroups(res.data));
        } else {
            setPerformers([]);
            setGroups([]);
        }
    }, [formData.PROJECT_ID]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const updated = { ...prev, [name]: value };
            console.log("Changed:", name, value);
            return updated;
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const cleanFormData = {
            ...formData,
            start_date: formData.start_date ? format(new Date(formData.start_date), 'yyyy-MM-dd') : null,
            end_date: formData.end_date ? format(new Date(formData.end_date), 'yyyy-MM-dd') : null,
        };

        console.log("This is the final performer: " + cleanFormData.PERFORMER_ID);
        console.log("✅ cleanFormData:", cleanFormData);

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
        console.log("Date string: " + dateString?.substring(0, 10) || '');
        return dateString?.substring(0, 10) || '';
    }

    return (
        <form className="task-form" onSubmit={handleSubmit}>
            <div className="task-form-grid">

                {/* Cột trái: 7 phần */}
                <div className="task-left">

                    <div className="task-form-header">
                        <div className="task-title-wrapper">
                            <input
                                type="checkbox"
                                checked={!!formData.task_state}
                                onChange={() =>
                                    setFormData(prev => ({ ...prev, task_state: !prev.task_state }))
                                }
                                style={{ marginRight: '10px' }}
                            />
                            <input
                                type="text"
                                name="task_name"
                                value={formData.task_name}
                                onChange={handleChange}
                                placeholder="Tên công việc"
                                className="task-title-input"
                            />
                        </div>
                        <div className="task-meta-top">
                            <span>Trong danh sách: <strong>{task?.project_name || 'Không có danh sách'}</strong></span>
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

                    </div>
                </div>

                {/* Cột phải: 3 phần */}
                <div className="task-right">
                    <div className="task-form-body">

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
                            {formData.PROJECT_ID ? (
                                <select name="PERFORMER_ID" value={formData.PERFORMER_ID || ''} onChange={handleChange}>
                                    <option value="">-- Chọn người --</option>
                                    {performers.map(p =>
                                        <option key={p.ID} value={p.ID}>{p.username}</option>
                                    )}
                                </select>
                            ) : (
                                <p>{user.username}</p>
                            )}
                        </section>

                        {formData.PROJECT_ID && (
                            <section className="task-section">
                                <label>Nhóm</label>
                                <select name="GROUP_ID" value={formData.GROUP_ID || ''} onChange={handleChange}>
                                    <option value="">-- Chọn nhóm --</option>
                                    {groups.map(g =>
                                        <option key={g.ID} value={g.ID}>{g.group_name}</option>
                                    )}
                                </select>
                            </section>
                        )}

                        <div className="task-form-actions">
                            <button type="button" className="archive-btn" onClick={handleArchive}>📦 Lưu trữ</button>
                            <button type="button" className="delete-btn" onClick={handleDelete}>🗑 Xóa</button>
                        </div>
                    </div>
                </div>
            </div>

            <button type="submit">
                {selectedTask !== null ? 'Lưu thay đổi' : 'Tạo mới'}
            </button>
        </form>


    );
}

export default TaskForm;
