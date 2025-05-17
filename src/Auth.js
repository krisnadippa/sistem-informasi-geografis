import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Auth.css";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const toggleForm = () => {
    setIsLogin(!isLogin);
    setError("");
  };

  const validateForm = () => {
    if (isLogin) {
      if (!formData.email || !formData.password) {
        setError("Email dan password harus diisi");
        return false;
      }
    } else {
      if (
        !formData.name ||
        !formData.email ||
        !formData.password ||
        !formData.confirmPassword
      ) {
        setError("Semua kolom harus diisi");
        return false;
      }
      if (formData.password !== formData.confirmPassword) {
        setError("Password tidak cocok");
        return false;
      }
      if (formData.password.length < 6) {
        setError("Password minimal 6 karakter");
        return false;
      }
    }
    return true;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    setTimeout(() => {
      try {
        localStorage.setItem("isAuthenticated", "true");
        localStorage.setItem(
          "user",
          JSON.stringify({
            name: formData.name || "User",
            email: formData.email,
          })
        );
        navigate("/home");
      } catch (error) {
        console.error("Authentication error:", error);
        setError("Terjadi kesalahan saat autentikasi. Silakan coba lagi.");
      } finally {
        setLoading(false);
      }
    }, 1000);
  };

  return (
    <div className="auth-container">
      {/* Bagian Welcome Text */}
      <div className="auth-welcome">
        <h1>Welcome!</h1>
        <p>
          "Explore without limits and embark on an endless journey of discovery,
          where every step unveils new possibilities."
        </p>
      </div>

      {/* Bagian Form Login/Register */}
      <div className={`auth-card ${isLogin ? "login" : "register"}`}>
        <div className="auth-header">
          <h2>{isLogin ? "Login" : "Register"}</h2>
          <p>Sistem Informasi Geografis</p>
        </div>
        {error && <div className="auth-error">{error}</div>}
        <form onSubmit={handleSubmit} className="auth-form">
          {!isLogin && (
            <div className="form-group">
              <label htmlFor="name">Nama</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Masukkan nama lengkap"
                disabled={loading}
              />
            </div>
          )}
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Masukkan email"
              disabled={loading}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Masukkan password"
              disabled={loading}
              required
            />
          </div>
          {!isLogin && (
            <div className="form-group">
              <label htmlFor="confirmPassword">Konfirmasi Password</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Konfirmasi password"
                disabled={loading}
                required
              />
            </div>
          )}
          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? "Loading..." : isLogin ? "Login" : "Register"}
          </button>
        </form>
        <div className="auth-toggle">
          <p>
            {isLogin ? "Belum punya akun?" : "Sudah punya akun?"}
            <span
              onClick={!loading ? toggleForm : undefined}
              style={{ opacity: loading ? 0.7 : 1 }}
            >
              {isLogin ? " Register" : " Login"}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
