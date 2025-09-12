import React from "react";
import Sidebar from "../components/Sidebar";
import "../../styles/DashBoard.css";
import "../../styles/LogIn.css";
import ProfileBody from "../components/ProfileBody";

const Profile: React.FC = () => {
  return (
    <div className="dashboard-container">
      <Sidebar />
      <main className="main-content">
        <h1>Profile</h1>
        <ProfileBody />
      </main>
    </div>
  );
};

export default Profile;
