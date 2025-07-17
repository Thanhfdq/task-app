import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from '../services/api';
import '../styles/ProjectsPage.css';
import Drawer from '../components/Drawer';
import ProjectForm from '../components/ProjectForm.jsx';
import { FaPen, FaPlus } from 'react-icons/fa';

function ProjectsPage() {
    const [showDrawer, setShowDrawer] = useState(false);
    const [editingProject, setEditingProject] = useState(null);
    const [projects, setProjects] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState('start_date');
    const [sortOrder, setSortOrder] = useState('desc');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

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
        axios.get('/projects').then(res => {
            const visibleProjects = res.data.filter(p => !p.is_archive);
            setProjects(visibleProjects);
        });
        console.log("Projects reloaded:", projects);
    }

    useEffect(() => {
        reloadProjectList();
    }, []);

    useEffect(() => {
        let temp = [...projects];

        if (search.trim()) {
            const keyword = search.toLowerCase();
            temp = temp.filter(p =>
                p.project_name.toLowerCase().includes(keyword) ||
                p.manager_username.toLowerCase().includes(keyword) ||
                p.description?.toLowerCase().includes(keyword)
            );
        }

        temp.sort((a, b) => {
            if (sortOrder === 'asc') {
                return a[sortBy] > b[sortBy] ? 1 : -1;
            } else {
                return a[sortBy] < b[sortBy] ? 1 : -1;
            }
        });

        setFiltered(temp);
        setCurrentPage(1); // reset page when filter changes
    }, [search, sortBy, sortOrder, projects]);

    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
        <div className="projects-page">
            <h2>Tất cả danh sách của bạn</h2>

            <div className="projects-controls">
                <input
                    type="text"
                    placeholder="Tìm kiếm theo tên, mô tả, người quản lý..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
                <div className="sort-controls">
                    <p>Sắp xếp theo : </p>
                    <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
                        <option value="start_date">Ngày bắt đầu</option>
                        <option value="project_name">Tên danh sách</option>
                    </select>

                    <select value={sortOrder} onChange={e => setSortOrder(e.target.value)}>
                        <option value="asc">Tăng dần</option>
                        <option value="desc">Giảm dần</option>
                    </select>
                </div>
            </div>

            <ul className="project-list">
                {paginated.map(p => (
                    <li key={p.ID} className="project-card">
                        <div className="project-card-header">
                            <h3>{p.project_name}</h3>
                            <button onClick={() => openEditDrawer(p)} className="edit-btn"><FaPen style={{ fontSize: '1rem' }} /></button>
                        </div>
                        <p><strong>Người quản lý:</strong> {p.manager_username}</p>
                        <p><strong>Ngày bắt đầu:</strong> {p.start_date}</p>
                        <p><strong>Ngày kết thúc:</strong> {p.end_date}</p>
                        <p><strong>Label:</strong> {p.label || 'Không có'}</p>
                        <p><strong>Trạng thái:</strong> {p.project_state ? 'Đã đóng' : 'Đang mở'}</p>
                        <Link to={`/projects/${p.ID}`} className="overlay-link" />
                    </li>
                ))}

                <li className="project-card add-card">
                    <button className="add-card"
                        onClick={openCreateDrawer}>
                        <div className="add-project-content">
                            <FaPlus style={{ fontSize: '2rem' }} />
                            <p>Tạo danh sách mới</p>
                        </div>
                    </button>
                </li>
            </ul>


            <div className="pagination">
                {Array.from({ length: totalPages }, (_, i) => (
                    <button
                        key={i}
                        onClick={() => setCurrentPage(i + 1)}
                        className={i + 1 === currentPage ? 'active' : ''}>
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
