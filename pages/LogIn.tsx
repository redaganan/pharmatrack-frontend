import React from "react";
import LoginPage from "@react-login-page/page5";
// blocks
import { Logo, Title, Footer } from "@react-login-page/page5";
// fields
import { Username, Password } from "@react-login-page/page5";
// buttons
import { Submit, } from "@react-login-page/page5";

const LogIn: React.FC = () => {
  return (

    <LoginPage>
      <Title>Welcome to PharmaTrack</Title>
      <Username />
      <Password />
      <Submit>Log In</Submit>
      <Footer>
      </Footer>
    </LoginPage>
  );
};

export default LogIn;
