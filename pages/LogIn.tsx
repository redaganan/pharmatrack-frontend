import React from "react";
import LoginPage from "@react-login-page/page5";
// blocks
import { Logo, Title, Footer } from "@react-login-page/page5";
// fields
import { Username, Password } from "@react-login-page/page5";
// buttons
import { Submit, } from "@react-login-page/page5";
import reactLogo from "../src/assets/react.svg";

const LogIn: React.FC = () => {
  return (

    <LoginPage>
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
      <Submit>Log In</Submit>
      <Footer>
      </Footer>
    </LoginPage>
  );
};

export default LogIn;
