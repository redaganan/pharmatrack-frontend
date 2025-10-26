import React, { useRef, useState, useEffect } from "react";
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
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const timerRef = useRef<number | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!email || !username || !password || !confirm) {
      setError("Please fill out all fields.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setSubmitting(true);
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
        setSuccess("Account created successfully.");
        // Give a short confirmation window, then redirect to login
        if (timerRef.current) window.clearTimeout(timerRef.current);
        timerRef.current = window.setTimeout(() => {
          navigate("/login");
        }, 1800);
      }
      if (response.status === "error") {
        setError(response.message || "Account creation failed.");
      }
    } catch (error) {
      setError("An error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <form className="login-form" onSubmit={handleSubmit}>
      <h2>Create Account</h2>
      {success && (
        <div
          role="status"
          aria-live="polite"
          style={{
            background: "#e6ffed",
            color: "#1a7f37",
            border: "1px solid #a7f3d0",
            padding: 8,
            borderRadius: 6,
            marginBottom: 8,
            fontWeight: 600,
          }}
        >
          {success} Redirecting to login…
        </div>
      )}

      <label htmlFor="email">Email</label>
      <input
        id="email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={submitting}
      />

      <label htmlFor="username">Username</label>
      <input
        id="username"
        type="text"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        disabled={submitting}
      />

      <label htmlFor="password">Password</label>
      <input
        id="password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        disabled={submitting}
      />

      <label htmlFor="confirm">Confirm Password</label>
      <input
        id="confirm"
        type="password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        disabled={submitting}
      />

      {error && <div style={{ color: "red", marginBottom: 8 }}>{error}</div>}

      <button type="submit" disabled={submitting}>
        {submitting ? "Creating…" : "Create Account"}
      </button>
      <button
        type="button"
        onClick={() => navigate("/login")}
        style={{ marginTop: 8, background: "#ccc", color: "#000" }}
        disabled={submitting}
      >
        Cancel
      </button>
    </form>
  );
};

export default CreateAccountBody;
