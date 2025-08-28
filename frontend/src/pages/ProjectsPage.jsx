import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "../services/api";
import "../styles/ProjectsPage.css";
import Drawer from "../components/Drawer";
import ProjectForm from "../components/ProjectForm.jsx";
import { BiBook,BiSort, BiCalendar, BiAt, BiEdit, BiPlus } from "react-icons/bi";

function ProjectsPage({ user }) {
  const [showDrawer, setShowDrawer] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [projects, setProjects] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("start_date");
  const [sortOrder, setSortOrder] = useState("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const openCreateDrawer = () => {
    setEditingProject(null);
    setShowDrawer(true);
  };

  const openEditDrawer = (project) => {
    setEditingProject(project);
    setShowDrawer(true);
  };

  const closeDrawer = () => setShowDrawer(false);

  const reloadProjectList = () => {
    axios.get("/projects").then((res) => {
      setProjects(res.data);
    });
  };

  useEffect(() => {
    reloadProjectList();
  }, [showArchived]);

  useEffect(() => {
    let temp = [...projects];

    if (!showArchived) {
      temp = temp.filter((p) => !p.is_archive);
    }

    if (search.trim()) {
      const keyword = search.toLowerCase();
      temp = temp.filter(
        (p) =>
          p.project_name.toLowerCase().includes(keyword) ||
          p.manager_username.toLowerCase().includes(keyword) ||
          p.description?.toLowerCase().includes(keyword)
      );
    }

    temp.sort((a, b) => {
      if (sortOrder === "asc") {
        return a[sortBy] > b[sortBy] ? 1 : -1;
      } else {
        return a[sortBy] < b[sortBy] ? 1 : -1;
      }
    });

    setFiltered(temp);
    setCurrentPage(1); // reset page when filter changes
  }, [search, sortBy, sortOrder, projects, showArchived]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="projects-page">
      <h2>Tất cả danh sách</h2>

      <div className="projects-controls">
        <input
          type="text"
          placeholder="Tìm kiếm theo tên, mô tả, người quản lý..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="sort-controls">
          <BiSort />
          <p>Sắp xếp theo: </p>
          {sortBy == "start_date" ? (
            <BiCalendar style={{ fontSize: "20px" }} />
          ) : (
            <BiAt style={{ fontSize: "20px" }} />
          )}
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="start_date">Ngày bắt đầu</option>
            <option value="project_name">Tên danh sách</option>
          </select>

          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
          >
            <option value="asc">Tăng dần</option>
            <option value="desc">Giảm dần</option>
          </select>
        </div>
        <label className="archive-toggle">
          <input
            type="checkbox"
            checked={showArchived}
            onChange={() => setShowArchived((prev) => !prev)}
          />
          Danh sách đã lưu trữ
        </label>
      </div>

      <ul className="project-list">
        {paginated.map((p) => (
          <li
            key={p.ID}
            className={`project-card ${p.is_archive ? "archived" : ""}`}
          >
            <BiBook style={{ fontSize: "40px", marginBottom: "10px" }} />
            <div className="project-card-header">
              <h3>{p.project_name}</h3>
              {user.id === p.MANAGER_ID && (
                <button className="edit-btn" onClick={() => openEditDrawer(p)}>
                  <BiEdit style={{ fontSize: "20px" }} />
                </button>
              )}
            </div>
            <p>
              <strong>{p.task_count} Công việc</strong>
            </p>
            <p>
              <strong>{p.member_count} Thành viên</strong>
            </p>
            <p>
              <strong>Người quản lý:</strong> {p.manager_username}
            </p>
            <p>
              {p.project_state ? "Đã đóng" : "Đang mở"}{" "}
              {p.is_archive ? "(Lưu trữ)" : ""}
            </p>
            {p.label && <span className="label-pill">{p.label}</span>}
            <Link to={`/projects/${p.ID}`} className="overlay-link" />
          </li>
        ))}

        <li className="project-card add-card">
          <button className="add-card" onClick={openCreateDrawer}>
            <div className="add-project-content">
              <BiPlus style={{ fontSize: "2rem" }} />
              <p>Tạo danh sách mới</p>
            </div>
          </button>
        </li>
      </ul>

      <div className="pagination">
        Trang{" "}
        {Array.from({ length: totalPages }, (_, i) => (
          <button
            key={i}
            onClick={() => setCurrentPage(i + 1)}
            className={i + 1 === currentPage ? "active" : ""}
          >
            {i + 1}
          </button>
        ))}
      </div>

      <Drawer isOpen={showDrawer} onClose={closeDrawer}>
        <ProjectForm
          project={editingProject}
          onSuccess={() => {
            closeDrawer();
            reloadProjectList();
          }}
          onCancel={closeDrawer}
        />
      </Drawer>
    </div>
  );
}

export default ProjectsPage;
