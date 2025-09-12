import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/LogIn.css";

import { createAccount } from "../apis/accountApi";

const CreateAccountBody: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email || !username || !password || !confirm) {
      setError("Please fill out all fields.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    try {
      const response = await createAccount(
        "http://localhost:8000/api/accounts/create-account",
        {
          email,
          username,
          password,
        }
      );
      console.log(response);
      if (response.status === "success") {
        navigate("/login");
      }
      if (response.status === "error") {
        setError(response.message || "Account creation failed.");
      }
    } catch (error) {
      setError("An error occurred. Please try again.");
    }
  };

  return (
    <form className="login-form" onSubmit={handleSubmit}>
      <h2>Create Account</h2>

      <label htmlFor="email">Email</label>
      <input
        id="email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <label htmlFor="username">Username</label>
      <input
        id="username"
        type="text"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />

      <label htmlFor="password">Password</label>
      <input
        id="password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <label htmlFor="confirm">Confirm Password</label>
      <input
        id="confirm"
        type="password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
      />

      {error && <div style={{ color: "red", marginBottom: 8 }}>{error}</div>}

      <button type="submit">Create Account</button>
      <button
        type="button"
        onClick={() => navigate("/login")}
        style={{ marginTop: 8, background: "#ccc", color: "#000" }}
      >
        Cancel
      </button>
    </form>
  );
};

export default CreateAccountBody;
