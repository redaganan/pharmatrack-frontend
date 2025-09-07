import React from "react";
import LoginPage from "@react-login-page/page5";
import { useNavigate } from 'react-router-dom';
import LogInBody from "../components/LogInBody";

const LogIn: React.FC = () => {
  const navigate = useNavigate();
  const handleLogin = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate('/dashboard');
  };
  return (
    <div className="login-page">
    <LoginPage>
      <LogInBody />
    </LoginPage>
    </div>
  );
};

export default LogIn;
