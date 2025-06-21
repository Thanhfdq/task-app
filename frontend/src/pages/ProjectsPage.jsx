import React, { useEffect, useState } from 'react';
import axios from '../services/api';
import '../styles/ProjectsPage.css';

function ProjectsPage({ user }) {
    const [projects, setProjects] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState('start_date');
    const [sortOrder, setSortOrder] = useState('desc');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    useEffect(() => {
        axios.get('/projects').then(res => {
            const visibleProjects = res.data.filter(p => !p.is_archive);
            setProjects(visibleProjects);
        });
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
            <h2>Tất cả dự án của bạn</h2>

            <div className="projects-controls">
                <input
                    type="text"
                    placeholder="Tìm kiếm theo tên, mô tả, người quản lý..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />

                <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
                    <option value="start_date">Ngày bắt đầu</option>
                    <option value="project_name">Tên dự án</option>
                </select>

                <select value={sortOrder} onChange={e => setSortOrder(e.target.value)}>
                    <option value="asc">Tăng dần</option>
                    <option value="desc">Giảm dần</option>
                </select>
            </div>

            <ul className="project-list">
                {paginated.map(p => (
                    <li key={p.ID} className="project-card">
                        <h3>{p.project_name}</h3>
                        <p><strong>Người quản lý:</strong> {p.manager_username}</p>
                        <p><strong>Ngày bắt đầu:</strong> {p.start_date}</p>
                        <p><strong>Ngày kết thúc:</strong> {p.end_date}</p>
                        <p><strong>Mô tả:</strong> {p.description || 'Không có mô tả'}</p>
                        <p><strong>Trạng thái:</strong> {p.is_archive ? 'Đã lưu trữ' : 'Đang hoạt động'}</p>
                    </li>
                ))}
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
        </div>
    );
}

export default ProjectsPage;
