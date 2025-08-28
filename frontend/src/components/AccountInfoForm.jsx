import { useState } from 'react';
import '../styles/AccountInfoForm.css';
import { BiX } from "react-icons/bi";

function AccountInfoForm({ user, onSave, onClose }) {
    const [formData, setFormData] = useState({
        fullname: user.fullname || '',
        username: user.username || '',
        description: user.description || ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData); // pass updated info to parent or API
    };

    return (
        <div className="archived-panel-overlay">
            <form className="account-info-form" onSubmit={handleSubmit}>
                <button onClick={onClose} className="close-btn"><BiX size={24} /></button>
                <h2>Thông tin tài khoản</h2>

                <div className="form-group">
                    <label htmlFor="fullname">Họ và tên</label>
                    <input
                        type="text"
                        id="fullname"
                        name="fullname"
                        value={formData.fullname}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="username">Tên đăng nhập</label>
                    <input
                        type="text"
                        id="username"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="description">Mô tả</label>
                    <textarea
                        id="description"
                        name="description"
                        rows={3}
                        value={formData.description}
                        onChange={handleChange}
                    />
                </div>

                <button type="submit" className="save-button">Lưu thay đổi</button>
            </form>
        </div>
    );
}

export default AccountInfoForm;
