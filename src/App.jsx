import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LogIn from '../pages/LogIn';
import DashBoard from '../pages/DashBoard';
import Products from '../pages/Products';
import Categories from '../pages/Categories';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LogIn />} />
        <Route path="/login" element={<LogIn />} />
        <Route path="/dashboard" element={<DashBoard />} />
        <Route path="/products" element={<Products />} />
        <Route path="/categories" element={<Categories />} />
      </Routes>
    </Router>
  );
};

export default App;