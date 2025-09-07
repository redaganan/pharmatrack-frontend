import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import LoginPage from '@react-login-page/page5';
// blocks
import { Logo, Title, Footer } from '@react-login-page/page5';
// fields
import { Username, Password } from '@react-login-page/page5';
// buttons
import { Submit } from '@react-login-page/page5';
import reactLogo from '../src/assets/react.svg';
import '../styles/LogIn.css';

const LogInBody: React.FC = () => {
  const navigate = useNavigate();
  const handleLogin = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate('/dashboard');
  };

  return (
    <>
      <div className="login-header">
        <Logo>
          <img src={reactLogo} alt="PharmaTrack" className="login-logo" />
        </Logo>
        <div className="login-title">
          <Title>Welcome to PharmaTrack</Title>
        </div>
      </div>
      <Username />
      <Password />
      <Submit onClick={handleLogin}>Log In</Submit>
      <div className="login-footer">
        <Link to="/create-account" className="create-account-btn">Create Account</Link>
      </div>
      <Footer></Footer>
    </>
  );
};

export default LogInBody;
