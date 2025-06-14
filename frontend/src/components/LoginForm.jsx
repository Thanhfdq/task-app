import React, { useState } from "react";
import '../styles/AuthForm.css'

function LoginForm({ onSwitchToRegister, onLoginSuccess }) {
  const [form, setForm] = useState({ username: "", password: "" });
  const [msg, setMsg] = useState("");

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      onLoginSuccess(data.user || form); // simulate user
    } catch (err) {
      setMsg(err.message);
    }
  };

  return (
    <div className="auth-container">
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <input name="username" placeholder="Username" onChange={handleChange} required />
        <input name="password" type="password" placeholder="Password" onChange={handleChange} required />
        <button type="submit">Login</button>
      </form>
      <p>
        Don’t have an account?{" "}
        <span onClick={onSwitchToRegister}>Register here</span>
      </p>
      {msg && <div className="message">{msg}</div>}
    </div>
  );
}

export default LoginForm;
