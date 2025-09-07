import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LogIn from '../pages/LogIn';
import DashBoard from '../pages/DashBoard';
import Products from '../pages/Products';
import Orders from '../pages/Orders';
import CreateAccount from '../pages/CreateAccount';
import Profile from '../pages/Profile';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LogIn />} />
        <Route path="/login" element={<LogIn />} />
        <Route path="/dashboard" element={<DashBoard />} />
        <Route path="/products" element={<Products />} />
        <Route path="/orders" element={<Orders />} />
  <Route path="/create-account" element={<CreateAccount />} />
  <Route path="/profile" element={<Profile />} />
      </Routes>
    </Router>
  );
};

export default App;