import React from 'react';
import '../styles/LogIn.css';
import CreateAccountBody from '../components/CreateAccountBody';

const CreateAccount: React.FC = () => {
  return (
    <div className="login-page">
      <div className="login-container">
        <CreateAccountBody />
      </div>
    </div>
  );
};

export default CreateAccount;
