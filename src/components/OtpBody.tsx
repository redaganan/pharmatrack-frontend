import React, { useEffect, useRef, useState } from "react";
import "../../styles/LogIn.css";
import { useNavigate } from "react-router-dom";
import { verifyOtp } from "../apis/accountApi";

// Simple 4-digit OTP input with focus management
const OtpBody: React.FC = () => {
  const navigate = useNavigate();
  const [otp, setOtp] = useState<string[]>(["", "", "", ""]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>("");
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    inputsRef.current[0]?.focus();
  }, []);

  const handleChange = (idx: number, val: string) => {
    const v = val.replace(/\D/g, "").slice(0, 1);
    const next = [...otp];
    next[idx] = v;
    setOtp(next);
    if (v && idx < inputsRef.current.length - 1) {
      inputsRef.current[idx + 1]?.focus();
    }
  };

  const handleKeyDown = (
    idx: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Backspace" && otp[idx] === "" && idx > 0) {
      inputsRef.current[idx - 1]?.focus();
    }
  };

  const code = otp.join("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (code.length !== 4) {
      setError("Please enter the 4-digit code sent to your email.");
      return;
    }
    try {
      setSubmitting(true);
      const res = await verifyOtp(
        `http://localhost:8000/api/accounts/login-otp?username=${localStorage.getItem("username")}`,
        { otp: code }
      );
      if (res?.status === "success") {
        navigate("/dashboard");
      } else {
        setError(res?.message || "Invalid or expired code.");
      }
    } catch (err) {
      setError("Could not verify OTP. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="login-form" onSubmit={onSubmit}>
      <div className="login-header">
        <div className="login-title">
          <h2 className="title">Verify OTP</h2>
          <div style={{ color: "#6b6b6b", fontSize: 14 }}>
            Enter the 4-digit code sent to your email
          </div>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: 8,
          margin: "16px 0",
        }}
      >
        {otp.map((v, i) => (
          <input
            key={i}
            ref={(el) => {
              inputsRef.current[i] = el;
            }}
            className="captcha-input" // reuse small input style
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={1}
            value={v}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            aria-label={`Digit ${i + 1}`}
            style={{ width: 48, textAlign: "center", fontSize: 18 }}
          />
        ))}
      </div>

      {error && (
        <div style={{ color: "#b94a48", marginBottom: 8 }}>{error}</div>
      )}

      <button type="submit" disabled={submitting}>
        {submitting ? "Verifying..." : "Verify"}
      </button>
    </form>
  );
};

export default OtpBody;
