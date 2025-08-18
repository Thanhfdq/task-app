import { useEffect, useState, useRef } from "react";
import { format } from "date-fns";
import { useUser } from "../contexts/UserContext";
import { useTaskModal } from "../contexts/TaskModalContext";
import { IoIosClose } from "react-icons/io";
import { CiFileOn } from "react-icons/ci";
import axios from "../services/api";
import URL from "../constants/url";
import "../styles/TaskForm.css";
import {
  FiMoreVertical,
  FiUser,
  FiPaperclip,
  FiSend,
  FiTag,
  FiPlus,
  FiArchive,
  FiTrash,
  FiBook,
  FiFile,
  FiTrello,
  FiClock,
  FiArrowRight,
  FiAlignLeft,
  FiMessageSquare,
} from "react-icons/fi";

function TaskForm({ task = {} }) {
  const { user } = useUser();
  const { selectedTask, closeModal, triggerTaskRefresh } = useTaskModal();
  const [formData, setFormData] = useState({
    task_name: "",
    task_description: "",
    task_state: false,
    label: "",
    start_date: new Date().toISOString(),
    end_date: new Date().toISOString(),
    progress: 0,
    PERFORMER_ID: user.id,
    PROJECT_ID: null,
    GROUP_ID: null,
  });

  const moreRef = useRef();

  const [moreOpen, setMoreOpen] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [projectManagerId, setProjectManagerId] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [projects, setProjects] = useState([]);
  const [performers, setPerformers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [attachedFiles, setAttachedFiles] = useState([]);

  const [progress, setProgress] = useState(task.progress || 0);
  const progressRef = useRef(null);

  const handleProgressDrag = (e) => {
    const rect = progressRef.current.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    let newProgress = Math.max(0, Math.min(100, (offsetX / rect.width) * 100));
    formData.progress = Math.round(newProgress);
  };

  const handleMouseDown = () => {
    const onMouseMove = (e) => handleProgressDrag(e);
    const onMouseUp = (e) => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
      handleChange(e);
    };
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  };

  const handleSendComment = () => {
    if (!newComment.trim()) return;
    console.log("New comment:", newComment);
    setNewComment("");
  };

  const getAttachedFiles = async () => {
    console.log("Fetching attached files for task ID:", formData.ID);
    if (formData.ID) {
      try {
        await axios.get(`/tasks/${formData.ID}/files`).then((res) => {
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
    const res = await axios.post(
      `/tasks/upload-files/${formData.ID}`,
      formdata,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    if (res.status === 200) {
      console.log("Files uploaded successfully");
      getAttachedFiles();
    } else {
      console.error("Upload failed");
    }
  };

  const handleRemoveFile = (taskId, fileName) => {
    axios
      .delete(`/tasks/files/${taskId}/${fileName}`)
      .then(() => {
        getAttachedFiles(); // Refresh the list of attached files
      })
      .catch((error) => {
        console.error("Error removing file:", error);
      });
  };

  useEffect(() => {
    if (task) {
      const safeTask = {
        ID: task.ID,
        task_name: task.task_name || "",
        task_description: task.task_description || "",
        label: task.label || "",
        start_date: task.start_date || "",
        end_date: task.end_date || "",
        progress: task.progress || 0,
        PERFORMER_ID: task.PERFORMER_ID || user.id,
        PROJECT_ID: task.PROJECT_ID || null,
        GROUP_ID: task.GROUP_ID || null,
        task_state: task.task_state || false,
      };
      setFormData((prev) => ({ ...prev, ...safeTask }));
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
      axios
        .get(`/projects/${formData.PROJECT_ID}/members`)
        .then((res) => setPerformers(res.data));
      axios
        .get(`/projects/${formData.PROJECT_ID}/groups`)
        .then((res) => setGroups(res.data));
      axios
        .get(`/projects/${formData.PROJECT_ID}`)
        .then((res) => setProjectManagerId(res.data.manager_id));
      console.log("Project manager ID: " + projectManagerId);
    }
  }, [formData.PROJECT_ID]);

  useEffect(() => {
    if (formData.ID) {
      axios
        .get(`/tasks/${formData.ID}/comments`)
        .then((res) => setComments(res.data));
      console.log(
        "List of comments for task ID " + formData.ID + ": ",
        comments
      );
    }
  }, [formData.ID]);

  const isAllowedToComment =
    user.id === formData.PERFORMER_ID || user.id === projectManagerId;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanFormData = {
      ...formData,
      start_date: formData.start_date
        ? format(new Date(formData.start_date), "yyyy-MM-dd")
        : null,
      end_date: formData.end_date
        ? format(new Date(formData.end_date), "yyyy-MM-dd")
        : null,
    };

    if (formData.ID) {
      await axios.put(`/tasks/${formData.ID}`, cleanFormData);
    } else {
      await axios.post("/tasks", cleanFormData);
    }
    closeModal();
    triggerTaskRefresh();
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    await axios.post(`/tasks/${formData.ID}/comments`, {
      user_id: user.id,
      content: newComment,
    });
    setNewComment("");
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
    if (window.confirm("Bạn có chắc chắn muốn xóa công việc này?")) {
      await axios.delete(`/tasks/${formData.ID}`);
      closeModal();
      triggerTaskRefresh();
    }
  };

  function formatDateForInput(dateString) {
    console.log("Date string: " + dateString?.substring(0, 10) || "");
    return dateString?.substring(0, 10) || "";
  }

  return (
    <form className="task-form" onSubmit={handleSubmit}>
      <div className="scroll-pane">
        <div className="row">
          <div className="task-header-left">
            <input
              className="task-state"
              type="checkbox"
              checked={!!formData.task_state}
              onChange={() =>
                setFormData((prev) => ({
                  ...prev,
                  task_state: !prev.task_state,
                }))
              }
              style={{ marginRight: "10px" }}
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
          <div className="task-header-right">
            <div className="task-menu-wrapper">
              <FiMoreVertical
                className="button-icon"
                onClick={() => setMoreOpen(!moreOpen)}
              />
              {moreOpen && (
                <ul className="dropdown">
                  <li onClick={handleArchive}>
                    <FiArchive /> Lưu trữ
                  </li>
                  <li onClick={handleDelete}>
                    <FiTrash /> Xóa
                  </li>
                </ul>
              )}
            </div>
          </div>
        </div>

        <div className="row">
          <div className="project">
            <label>
              <FiBook className="icon" />
            </label>
            <select
              name="PROJECT_ID"
              value={formData.PROJECT_ID || ""}
              onChange={handleChange}
            >
              <option value="">-- Chọn dự án --</option>
              {projects.map((p) => (
                <option key={p.PROJECT_ID} value={p.PROJECT_ID}>
                  {p.project_name}
                </option>
              ))}
            </select>
            <label>
              <FiTrello className="icon" />
            </label>
            {formData.PROJECT_ID && (
              <select
                name="GROUP_ID"
                value={formData.GROUP_ID || ""}
                onChange={handleChange}
              >
                <option value="">-- Chọn nhóm --</option>
                {groups.map((g) => (
                  <option key={g.ID} value={g.ID}>
                    {g.group_name}
                  </option>
                ))}
              </select>
            )}
          </div>
          <label>
            <FiUser className="icon" />
          </label>
          {formData.PROJECT_ID ? (
            <select
              className="assignee"
              name="PERFORMER_ID"
              value={formData.PERFORMER_ID || ""}
              onChange={handleChange}
            >
              <option value="">-- Chọn người --</option>
              {performers.map((p) => (
                <option key={p.ID} value={p.ID}>
                  {p.username}
                </option>
              ))}
            </select>
          ) : (
            <p>{user.username}</p>
          )}
        </div>

        <div className="row" style={{ margin: "12px 0" }}>
          <div className="task-dates">
            <label>
              <FiClock className="icon" />
            </label>
            <input
              type="date"
              name="start_date"
              value={formatDateForInput(formData.start_date)}
              onChange={handleChange}
            />
            <label>
              <FiArrowRight className="icon" />
            </label>
            <input
              type="date"
              name="end_date"
              value={formatDateForInput(formData.end_date)}
              onChange={handleChange}
            />
          </div>

          <div className="progress-group">
            <span className="progress-text">{formData.progress}%</span>
            <div
              className="progress-container"
              ref={progressRef}
              onClick={handleProgressDrag}
            >
              <div
                className="progress-bar-modify"
                style={{ width: `${formData.progress}%` }}
              />
              <div
                className="progress-thumb"
                style={{ left: `${formData.progress}%` }}
                name="progress"
                value={formData.progress}
                onMouseDown={handleMouseDown}
              />
            </div>
          </div>
        </div>

        <div className="task-description">
          <div className="description-title">
            <label>
              <FiAlignLeft className="icon" />
            </label>
            <span>Mô tả</span>
          </div>
          <textarea
            name="task_description"
            value={formData.task_description}
            onChange={handleChange}
            placeholder="Không có mô tả"
          />
        </div>

        <div className="chat-title">
          <label>
            <FiMessageSquare className="icon" />
          </label>
          <span>Trò chuyện</span>
        </div>
        {isAllowedToComment && (
          <div className="comments-list">
            {comments.map((c) => (
              <div className="comment" key={c.id}>
                <span className="comment-meta">{c.username}</span>
                <span className="comment-timestamp">
                  {new Date(c.created_at).toLocaleString()}
                </span>
                <p>{c.content}</p>
              </div>
            ))}
          </div>
        )}
        <div className="comment-bar">
          <textarea
            type="text"
            placeholder="Viết lời nhắn..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
          />
          <button
            className="send-message"
            type="button"
            onClick={handleAddComment}
          >
            <FiSend className="button-icon" />
          </button>
        </div>
      </div>

      {/* Tag & Attachment Row */}
      <div
        className="row"
        style={{ borderTop: "1px solid #eee", padding: "10px 30px" }}
      >
        <div className="additional-info">
          {/* Attachment */}
          <div className="attachment-pill">
            <FiPaperclip className="icon" />
            {attachedFiles.length > 0 && (
              <>
                <span className="file-count">{attachedFiles.length}</span>
                <ul className="attached-files-list">
                  {attachedFiles.map((file) => (
                    <a
                      key={file.ID}
                      title={file.file_name}
                      href={`${URL.BACK_END_URL}/api/tasks/files/${file.ID}/download`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="file-item"
                    >
                      <FiFile />
                      <button
                        className="remove-btn"
                        type="button"
                        onClick={() =>
                          handleRemoveFile(file.task_id, file.file_name)
                        }
                      >
                        ✕
                      </button>
                    </a>
                  ))}
                </ul>
              </>
            )}
            <label htmlFor="file-upload" className="file-add-btn">
              <FiPlus className="button-icon" />
            </label>
            <input
              id="file-upload"
              type="file"
              multiple
              onChange={handleFileChange}
              hidden
            />
          </div>
        </div>

        {/* Submit */}
        <button type="submit" className="save-btn">
          {selectedTask !== null ? "Lưu" : "Tạo"}
        </button>
      </div>
    </form>
  );
}

export default TaskForm;
