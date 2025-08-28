import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import axios from "../services/api";
import ProjectMembersPanel from "../components/ProjectMembersPanel.jsx";
import { useUser } from "../contexts/UserContext";
import "../styles/ProjectForm.css"; // thêm CSS nếu cần
import {
  BiGroup,
  BiCalendarCheck,
  BiCalendarAlt,
  BiCalendarWeek,
  BiXCircle,
  BiArchiveIn,
  BiBookBookmark
} from "react-icons/bi";

export default function ProjectForm({ project = null, onSuccess, onCancel }) {
  const [showMemberDrawer, setShowMemberDrawer] = useState(false);
  const { user } = useUser();

  const [formData, setFormData] = useState({
    project_name: "",
    project_description: "",
    start_date: new Date().toISOString().split("T")[0], // format YYYY-MM-DD
    end_date: "",
    complete_date: "",
    label: "",
    is_archive: false,
    project_state: false,
  });

  useEffect(() => {
    if (project) {
      setFormData({
        project_name: project.project_name || "",
        project_description: project.project_description || "",
        start_date: project.start_date || "",
        end_date: project.end_date || "",
        complete_date: project.complete_date || null,
        label: project.label || "",
        is_archive: project.is_archive || false,
        project_state: project.project_state || false,
      });
    }
  }, [project]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
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
      complete_date: formData.complete_date
        ? format(new Date(formData.complete_date), "yyyy-MM-dd")
        : null,
    };
    try {
      if (project) {
        await axios.put(`/projects/${project.ID}`, cleanFormData);
      } else {
        const res = await axios.post("/projects", cleanFormData);
        const newProject = res.data;

        // 👇 Thêm user hiện tại vào project mới
        await axios.post(`/projects/${newProject.ID}/members`, {
          userIdToAdd: user.id,
        });

        // Create default task group for the new project
        await axios.post(`/projects/${newProject.ID}/groups`, {
          name: "Cột 1",
        });
      }
      onSuccess();
    } catch (err) {
      console.error("Failed to save project:", err);
      alert("Đã có lỗi xảy ra");
    }
  };

  return (
    <div className="project-form-container">
      <form className="project-form" onSubmit={handleSubmit}>
        <BiBookBookmark style={{fontSize:"20px"}}/> 
        <input
          className="project-name"
          name="project_name"
          value={formData.project_name}
          onChange={handleChange}
          placeholder="Tên danh sách"
          required
        />
        <textarea
          name="project_description"
          value={formData.project_description}
          placeholder="Mô tả danh sách..."
          onChange={handleChange}
        />
        <button
          type="button"
          onClick={() => setShowMemberDrawer(true)}
          className="member_btn"
        >
          <BiGroup style={{ fontSize: "20px" }} /> Thành viên
        </button>
        <label>
          <BiCalendarAlt style={{ fontSize: "20px" }} /> Ngày bắt đầu:
        </label>
        <input
          type="date"
          name="start_date"
          value={formData.start_date}
          onChange={handleChange}
          required
        />

        <label>
          <BiCalendarWeek style={{ fontSize: "20px" }} /> Ngày kết thúc:
        </label>
        <input
          type="date"
          name="end_date"
          value={formData.end_date}
          onChange={handleChange}
        />

        <label>
          <BiCalendarCheck style={{ fontSize: "20px" }} /> Ngày hoàn thành:
        </label>
        <input
          type="date"
          name="complete_date"
          value={formData.complete_date}
          onChange={handleChange}
        />
        <label>
          <input
            type="checkbox"
            name="project_state"
            checked={formData.project_state}
            onChange={handleChange}
          />
          <BiXCircle style={{fontSize:"20px"}}/> Đóng danh sách
        </label>

        <label>
          <input
            type="checkbox"
            name="is_archive"
            checked={formData.is_archive}
            onChange={handleChange}
          />
          <BiArchiveIn style={{fontSize:"20px"}}/> Lưu trữ
        </label>

        <div className="project-form-buttons">
          <button type="submit">{project ? "Lưu" : "Tạo mới"}</button>
          {onCancel && (
            <button type="button" onClick={onCancel}>
              Hủy
            </button>
          )}
        </div>
      </form>
      <ProjectMembersPanel
        isOpen={showMemberDrawer}
        onClose={() => setShowMemberDrawer(false)}
        project={project ? project : null}
      />
    </div>
  );
}
