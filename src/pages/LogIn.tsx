import React from "react";
import "../../styles/LogIn.css";
import LogInBody from "../components/LogInBody";

const LogIn: React.FC = () => {
  return (
    <div className="login-page">
      <div className="login-container">
        <LogInBody />
      </div>
    </div>
  );
};

export default LogIn;
