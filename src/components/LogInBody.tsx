import { motion, useAnimationControls } from "framer-motion";
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../../styles/LogIn.css";

import { loginAccount } from "../apis/accountApi";

const LogInBody: React.FC = () => {
  const navigate = useNavigate();
  const titleControls = useAnimationControls();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [num1, setNum1] = useState<number>(0);
  const [num2, setNum2] = useState<number>(0);
  const [captchaAnswer, setCaptchaAnswer] = useState<string>("");

  const generateCaptcha = () => {
    const a = Math.floor(10 + Math.random() * 90); // 10-99
    const b = Math.floor(1 + Math.random() * 19); // 1-20
    setNum1(a);
    setNum2(b);
  };

  useEffect(() => {
    generateCaptcha();
  }, []);

  // Ensure the bouncing animation starts on initial mount and loops
  useEffect(() => {
    titleControls.start({
      y: [0, -12, 0],
      transition: {
        duration: 1.1,
        repeat: Infinity,
        repeatType: "loop",
        ease: "easeInOut",
      },
    });
  }, [titleControls]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // If captcha is empty, prompt the user explicitly
    if (captchaAnswer.trim() === "") {
      setError("Please fill it with the correct value");
      return;
    }
    // Simple arithmetic captcha validation
    const expected = num1 + num2;
    const provided = Number(captchaAnswer);
    if (!Number.isFinite(provided) || provided !== expected) {
      setError("Captcha answer is incorrect. Please try again.");
      setCaptchaAnswer("");
      generateCaptcha();
      return;
    }

    try {
      const response = await loginAccount(
        "http://localhost:8000/api/accounts/login",
        {
          username,
          password,
        }
      );
      console.log("Login response:", response);
      let accountId = null;
      let username1 = null;
      if (response.status === "success") {
        // Try to get accountId from multiple possible locations
        if (response.data && response.data.accountId) {
          accountId = response.data.accountId;
          username1 = response.data.username;
        } else if (response.accountId) {
          accountId = response.accountId;
          username1 = response.username;
        }
        if (accountId) {
          localStorage.setItem("accountId", accountId);
          localStorage.setItem("username", username1);
        }
        navigate("/dashboard");
      }
      if (response.status === "error") {
        setError(response.message || "Login failed.");
      }
    } catch (error) {
      setError("An error occurred. Please try again.");
    }
  };

  return (
    <form className="login-form" onSubmit={handleSubmit}>
      <div className="login-header">
        <div className="login-title">
          <motion.h2 initial={{ y: 0 }} animate={titleControls}>
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

      {/* Arithmetic Captcha */}
      <div className="captcha-row">
        <input
          type="text"
          value={num1}
          readOnly
          className="captcha-input"
          aria-label="First number"
        />
        <span className="captcha-symbol">+</span>
        <input
          type="text"
          value={num2}
          readOnly
          className="captcha-input"
          aria-label="Second number"
        />
        <span className="captcha-symbol">=</span>
        <input
          id="captcha"
          name="captcha"
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={captchaAnswer}
          onChange={(e) => setCaptchaAnswer(e.target.value)}
          placeholder=""
          className="captcha-answer"
          aria-label="Captcha answer"
        />
        <button
          type="button"
          onClick={() => {
            setCaptchaAnswer("");
            generateCaptcha();
            setError("");
          }}
          disabled={loading}
          aria-label="Refresh captcha"
          title="Refresh"
          className="captcha-refresh"
        >
          ↻
        </button>
      </div>

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
