import React, { useState } from "react";
import axios from "../services/api";

export default function AuthPage({ onAuthSuccess }) {
    const [isRegistering, setIsRegistering] = useState(false);
    const [form, setForm] = useState({ username: "", password: "" });

    const toggleForm = () => setIsRegistering(!isRegistering);

    const handleChange = e => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async e => {
        e.preventDefault();
        console.log('📝 Form data:', form);
        try {
            const endpoint = isRegistering ? "/register" : "/login";
            const res = await axios.post(`/auth${endpoint}`, form, {
                withCredentials: true
            });
            if (res.data && res.data.success) {
                localStorage.setItem('user', JSON.stringify(res.data.user));
                onAuthSuccess(res.data.user); // navigate to main screen
            } else {
                alert("Login/Register failed.");
            }
        } catch (err) {
            alert("Error: " + err.response?.data?.message || err.message);
        }
    };

    return (
        <div>
            <h2>{isRegistering ? "Register" : "Login"}</h2>
            <form onSubmit={handleSubmit}>
                <input
                    name="username"
                    value={form.username}
                    onChange={handleChange}
                    placeholder="Username"
                    required
                />
                <input
                    type="password"
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Password"
                    required
                />
                <button type="submit">{isRegistering ? "Register" : "Login"}</button>
            </form>
            <button onClick={toggleForm}>
                {isRegistering ? "Already have an account? Login" : "New here? Register"}
            </button>
        </div>
    );
}
