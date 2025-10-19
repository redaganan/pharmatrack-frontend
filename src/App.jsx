import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';

// Lazy loaded pages for code-splitting (under src/pages)
const LogIn = lazy(() => import('./pages/LogIn'));
const DashBoard = lazy(() => import('./pages/DashBoard'));
const Products = lazy(() => import('./pages/Products'));
const Orders = lazy(() => import('./pages/Orders'));
const History = lazy(() => import('./pages/History'));
const Categories = lazy(() => import('./pages/Categories'));
const CreateAccount = lazy(() => import('./pages/CreateAccount'));
const Profile = lazy(() => import('./pages/Profile'));
const Otp = lazy(() => import('./pages/Otp'));

// Simple fallback (blank) – spinner removed per request
const Fallback = () => null;

const PageTransitions = () => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<MotionWrap><LogIn /></MotionWrap>} />
        <Route path="/login" element={<MotionWrap><LogIn /></MotionWrap>} />
        <Route path="/dashboard" element={<MotionWrap><DashBoard /></MotionWrap>} />
        <Route path="/products" element={<MotionWrap><Products /></MotionWrap>} />
        <Route path="/orders" element={<MotionWrap><Orders /></MotionWrap>} />
    <Route path="/history" element={<MotionWrap><History /></MotionWrap>} />
  <Route path="/categories" element={<MotionWrap><Categories /></MotionWrap>} />
        <Route path="/create-account" element={<MotionWrap><CreateAccount /></MotionWrap>} />
        <Route path="/profile" element={<MotionWrap><Profile /></MotionWrap>} />
        <Route path="/otp" element={<MotionWrap><Otp /></MotionWrap>} />
      </Routes>
    </AnimatePresence>
  );
};

const MotionWrap = ({ children }) => (
  <motion.div
    style={{ height: '100%', width: '100%' }}
    initial={{ opacity: 0, x: 40, scale: 0.985 }}
    animate={{ opacity: 1, x: 0, scale: 1 }}
    exit={{ opacity: 0, x: -40, scale: 0.985 }}
    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
  >
    {children}
  </motion.div>
);

const App = () => (
  <Router>
    <Suspense fallback={<Fallback />}> 
      <PageTransitions />
    </Suspense>
  </Router>
);

// Spinner & keyframes removed.

export default App;