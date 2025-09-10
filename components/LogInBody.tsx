import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/LogIn.css";



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

    console.log("Logging in with", { username, password });
  };

  return (
    <form className="login-form" onSubmit={handleSubmit}>
      <div className="login-header">
        <div className="login-title">
          <h2>Welcome to PharmaTrack</h2>
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
