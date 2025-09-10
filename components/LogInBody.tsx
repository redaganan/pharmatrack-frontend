import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/LogIn.css";
import { motion } from "framer-motion";

import { loginAccount } from "../src/apis/accountApi";

const LogInBody: React.FC = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Frontend-only mock to simulate an auth roundtrip.
  // Replace this with your real API call when connecting backend.

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // setError("Invalid username or password.");

    try {
      const response = await loginAccount(
        "http://localhost:8000/api/accounts/login",
        {
          username,
          password,
        }
      );
      if (response.status === "success") {
        navigate("/dashboard");
      }
      if (response.status === "error") {
        setError(response.message || "Login failed.");
      }
      console.log(response);
    } catch (error) {
      setError("An error occurred. Please try again.");
    }

    console.log("Logging in with", { username, password });
  };

  return (
    <form className="login-form" onSubmit={handleSubmit}>
      <div className="login-header">
        <div className="login-title">
          <motion.h2
            initial={{ y: 0 }}
            animate={{ y: [0, -12, 0] }}
            transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
          >
            Welcome to PharmaTrack
          </motion.h2>
        </div>
      </div>

      <label htmlFor="username">Username</label>
      <input
        id="username"
        name="username"
        type="text"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        required
      />

      <label htmlFor="password">Password</label>
      <input
        id="password"
        name="password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />

      {error && <div style={{ color: "red", marginBottom: 8 }}>{error}</div>}

      <button type="submit" disabled={loading}>
        {loading ? "Logging in..." : "Log In"}
      </button>
      <div className="login-footer">
        <Link to="/create-account" className="create-account-btn">
          Create Account
        </Link>
      </div>
    </form>
  );
};

export default LogInBody;
