import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { useUser } from '../contexts/UserContext';
import { useTaskModal } from '../contexts/TaskModalContext';
import { IoIosClose } from 'react-icons/io';
import { CiFileOn } from "react-icons/ci";
import axios from '../services/api';
import URL from '../constants/url';
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

  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [projectManagerId, setProjectManagerId] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [projects, setProjects] = useState([]);
  const [performers, setPerformers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [attachedFiles, setAttachedFiles] = useState([]);


  const getAttachedFiles = async () => {
    console.log("Fetching attached files for task ID:", formData.ID);
    if (formData.ID) {
      try {
        await axios.get(`/tasks/${formData.ID}/files`).then(res => {
          setAttachedFiles(res.data.files || []);

          console.log("Attached files:", res.data);
          console.log("Attached files state updated:", attachedFiles);
        });
      } catch (error) {
        console.error("Error fetching attached files:", error);
      }
    }
  };

  useEffect(() => {
    getAttachedFiles();
  }, [formData.ID]);
  useEffect(() => {
    console.log("Attached files state updated:", attachedFiles);
  }, [attachedFiles]);


  const handleFileChange = async (e) => {
    const formdata = new FormData();
    const files = e.target.files;

    for (let i = 0; i < files.length; i++) {
      formdata.append("files", files[i]); // append each file individually
    }
    const res = await axios.post(`/tasks/upload-files/${formData.ID}`, formdata, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    if (res.status === 200) {
      console.log('Files uploaded successfully');
      getAttachedFiles();
    } else {
      console.error('Upload failed');
    }
  };

  const handleRemoveFile = (taskId, fileName) => {
    axios.delete(`/tasks/files/${taskId}/${fileName}`)
      .then(() => {
        getAttachedFiles(); // Refresh the list of attached files
      })
      .catch(error => {
        console.error("Error removing file:", error);
      });
  };


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
    const fetchProjects = async () => {
      try {
        const res = await axios.get(`/projects/owner/${user.id}?isArchived=0`);
        setProjects(res.data);
      } catch (error) {
        console.error("Error fetching projects:", error);
      }
    };
    fetchProjects();
  }, []);

  useEffect(() => {
    console.log("Have Project id? " + formData.PROJECT_ID);
    if (formData.PROJECT_ID) {
      axios.get(`/projects/${formData.PROJECT_ID}/members`).then(res => setPerformers(res.data));
      axios.get(`/projects/${formData.PROJECT_ID}/groups`).then(res => setGroups(res.data));
      axios.get(`/projects/${formData.PROJECT_ID}`).then(res => setProjectManagerId(res.data.manager_id));
      console.log("Project manager ID: " + projectManagerId);
    }
  }, [formData.PROJECT_ID]);

  useEffect(() => {
    if (formData.ID) {
      axios.get(`/tasks/${formData.ID}/comments`).then(res => setComments(res.data));
      console.log("List of comments for task ID " + formData.ID + ": ", comments);
    }
  }, [formData.ID]);

  const isAllowedToComment = user.id === formData.PERFORMER_ID || user.id === projectManagerId;


  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
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

    if (formData.ID) {
      await axios.put(`/tasks/${formData.ID}`, cleanFormData);
    } else {
      await axios.post('/tasks', cleanFormData);
    }
    closeModal();
    triggerTaskRefresh();
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    await axios.post(`/tasks/${formData.ID}/comments`, {
      user_id: user.id,
      content: newComment
    });
    setNewComment('');
    const res = await axios.get(`/tasks/${formData.ID}/comments`);
    setComments(res.data);
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
              <span>Trong danh sách:
                <select name="PROJECT_ID" value={formData.PROJECT_ID || ''} onChange={handleChange}>
                  <option value="">-- Chọn dự án --</option>
                  {projects.map(p => (
                    <option key={p.PROJECT_ID} value={p.PROJECT_ID}>{p.project_name}</option>
                  ))}
                </select>
              </span>
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
              <label>Đính kèm tệp</label>
              <input
                type="file"
                multiple
                onChange={handleFileChange}
              />
              <ul className="attached-files-list">
                {attachedFiles.map((file) => (
                  <li key={file.ID}>
                    <span>
                      <CiFileOn style={{ marginRight: '5px' }} />
                        <a href={`${URL.BACK_END_URL}${"/api/tasks/files/"}${file.ID}${"/download"}`} target="_blank" rel="noopener noreferrer">
                        {file.file_name}
                      </a>
                    </span>
                    <button type="button" onClick={() => handleRemoveFile(file.task_id, file.file_name)}><IoIosClose /></button>
                  </li>
                ))}
              </ul>
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
            {/* Comment Section */}
            {isAllowedToComment && (
              <div className="comment-section">
                <h3>Chat</h3>
                <div className="comments-list">
                  {comments.map(c => (
                    <div className="comment" key={c.id}>
                      <span className="comment-meta">{c.username}</span>
                      <span className="comment-timestamp">{new Date(c.created_at).toLocaleString()}</span>
                      <p>{c.content}</p>
                    </div>
                  ))}
                </div>

                <div className="comment-form">
                  <textarea
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                    placeholder="Viết lời nhắn..."
                  />
                  <button type='button' onClick={handleAddComment}>Thêm lời nhắn</button>
                </div>
              </div>
            )}
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
