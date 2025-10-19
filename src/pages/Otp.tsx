import React from "react";
import "../../styles/LogIn.css";
import OtpBody from "../components/OtpBody";

const Otp: React.FC = () => {
  return (
    <div className="login-page">
      <div className="login-container">
        <OtpBody />
      </div>
    </div>
  );
};

export default Otp;
