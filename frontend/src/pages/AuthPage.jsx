import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "../styles/AuthForm.css";

export default function AuthPage({ onAuthSuccess }) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [form, setForm] = useState({ username: "", password: "" });

  const toggleForm = () => setIsRegistering(!isRegistering);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const endpoint = isRegistering ? "/register" : "/login";
      const res = await api.post(`/auth${endpoint}`, form, {
        withCredentials: true,
      });
      if (res.data && res.data.success) {
        sessionStorage.setItem("user", JSON.stringify(res.data.user));
        onAuthSuccess(res.data.user);
        navigate("/projects");
      } else {
        alert("Login/Register failed.");
      }
    } catch (err) {
      alert("Error: " + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="auth-container">
      <h3 className="login-app-name">Task Management</h3>
      <div className="auth-box">
        <h2>{isRegistering ? "Tạo tài khoản mới" : "Chào mừng trở lại"}</h2>
        <form className="auth-form" onSubmit={handleSubmit}>
          {isRegistering && (
            <section>
              <input
                name="user_fullname"
                value={form.user_fullname}
                onChange={handleChange}
                placeholder="Tên người dùng"
              />
              <input
                name="user_description"
                value={form.user_description}
                onChange={handleChange}
                placeholder="Thông tin chi tiết"
              />
            </section>
          )}
          <input
            name="username"
            value={form.username}
            onChange={handleChange}
            placeholder="Tên đăng nhập"
            required
          />
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            placeholder="Mật khẩu"
            required
          />
          <button type="submit" className="primary-button">
            {isRegistering ? "Đăng ký" : "Đăng nhập"}
          </button>
        </form>
        <button className="switch-button" onClick={toggleForm}>
          {isRegistering
            ? "Đã có tài khoản? Đăng nhập"
            : "Chưa có tài khoản? Đăng ký"}
        </button>
      </div>
    </div>
  );
}
