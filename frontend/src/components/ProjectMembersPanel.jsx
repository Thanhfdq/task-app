import React, { useEffect, useState } from 'react';
import Drawer from './Drawer';
import axios from '../services/api';
import { useUser } from '../contexts/UserContext';
import '../styles/ProjectMembersPanel.css';

export default function ProjectMembersPanel({ isOpen, onClose, project }) {
    const [members, setMembers] = useState([]);
    const [search, setSearch] = useState('');
    const [results, setResults] = useState([]);
    const { user } = useUser();

    useEffect(() => {
        if (isOpen) fetchMembers();
    }, [isOpen]);

    const fetchMembers = async () => {
        try {
            const res = await axios.get(`/projects/${project.ID}/members-with-task-count`);
            setMembers(res.data);
        } catch (err) {
            console.error("Lỗi khi lấy thành viên:", err);
        }
    };

    const handleSearch = async () => {
        if (!search.trim()) return;
        try {
            const res = await axios.get(`/users/search-users?keyword=${search}`);
            setResults(res.data);
        } catch (err) {
            console.error("Lỗi tìm người dùng:", err);
        }
    };

    const addMember = async (userIdToAdd) => {
        try {
            await axios.post(`/projects/${project.ID}/members`, { userIdToAdd });
            setSearch('');
            setResults([]);
            fetchMembers();
        } catch (err) {
            alert("Không thể thêm người dùng.");
        }
    };

    const removeMember = async (userId) => {
        if (!window.confirm("Xóa người dùng này khỏi danh sách?")) return;
        try {
            await axios.delete(`/projects/${project.ID}/members/${userId}`);
            fetchMembers();
        } catch (err) {
            alert(err.response?.data?.message || "Không thể xóa người dùng.");
        }
    };

    return (
        <Drawer isOpen={isOpen} onClose={onClose}>
            <h3 className="project-member-header">Thành viên danh sách</h3>
            <ul className="member-list">
                {members.map(m => (
                    <li key={m.ID} style={{ marginBottom: '8px' }}>
                        <div>
                            {m.ID === project.manager_id && <div className='manager-label'>Quản lý</div>}
                            <div>{m.username}</div>
                            <strong>{m.user_fullname}</strong>
                            {m.ID === user.id && <span style={{ color: '#888' }}> (Bạn)</span>}
                        </div>
                        <em>{m.task_count} công việc</em>
                        {m.ID !== user.id && m.task_count === 0 && (
                            <button className='remove-btn' onClick={() => removeMember(m.ID)} style={{ marginLeft: '12px', color: 'red' }}>
                                Xóa
                            </button>
                        )}
                    </li>
                ))}
            </ul>

            <hr />
            <input
                type="text"
                placeholder="Tìm username..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
            />
            <button className='search-btn' onClick={handleSearch}>Tìm</button>

            <ul className="search-results">
                {results.map(u => {
                    const alreadyInProject = members.some(m => m.ID === u.ID);
                    return (
                        <li key={u.ID}>
                            {u.username} ({u.user_fullname})
                            {!alreadyInProject && (
                                <button onClick={() => addMember(u.ID)} style={{ marginLeft: '10px' }}>Thêm</button>
                            )}
                            {alreadyInProject && (
                                <span style={{ marginLeft: '10px', color: 'gray' }}>Đã có trong danh sách</span>
                            )}
                        </li>
                    );
                })}
            </ul>
        </Drawer>
    );
}
