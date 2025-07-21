import { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { setUser, User as ReduxUser } from './store/authSlice';
import { RootState } from './store';

import Layout from './components/Layout';
import HomePage from './components/HomePage';
import Dashboard from './components/Dashboard';
import Portfolio from './components/Portfolio';
import StrategyManager from './components/StrategyManager';
import TradingInterface from './components/TradingInterface';
import Watchlist from './components/Watchlist';
import Settings from './components/Settings';
import AuthModal from './components/AuthModal';
import ProtectedRoute from './routes/ProtectedRoute';

import { authService } from './services/authService';
import { Order } from './types';

function App() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.auth.user);

  const [orders, setOrders] = useState<Order[]>([]);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Sync auth state from Firebase/localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem('authUser');
    if (storedUser) {
      dispatch(setUser(JSON.parse(storedUser)));
    }

    const unsubscribe = authService.onAuthStateChanged((firebaseUser) => {
      if (firebaseUser) {
        const newUser: ReduxUser = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          name: firebaseUser.displayName || '',
        };
        dispatch(setUser(newUser));
        localStorage.setItem('authUser', JSON.stringify(newUser));
      } else {
        dispatch(setUser(null));
        localStorage.removeItem('authUser');
      }
    });

    return unsubscribe;
  }, [dispatch]);

  const handleLogin = async (email: string, password: string) => {
    const firebaseUser = await authService.login(email, password);
    const newUser = {
      uid: firebaseUser.uid,
      email: firebaseUser.email || '',
      name: firebaseUser.displayName || '',
    };
    dispatch(setUser(newUser));
    localStorage.setItem('authUser', JSON.stringify(newUser));
    setShowAuthModal(false);
    navigate('/dashboard');
  };

  const handleSignup = async (email: string, password: string, name: string) => {
    const firebaseUser = await authService.signup(email, password, name);
    const newUser = {
      uid: firebaseUser.uid,
      email: firebaseUser.email || '',
      name,
    };
    dispatch(setUser(newUser));
    localStorage.setItem('authUser', JSON.stringify(newUser));
    setShowAuthModal(false);
    navigate('/dashboard');
  };

  const handleLogout = async () => {
    await authService.logout();
    dispatch(setUser(null));
    localStorage.removeItem('authUser');
    navigate('/');
  };

  const handleOrderPlaced = (order: Order) => {
    setOrders([...orders, order]);
  };

  return (
    <>
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onLogin={handleLogin}
        onSignup={handleSignup}
      />

      <Routes>
        <Route
          path="/"
          element={
            user ? (
              <Navigate to="/dashboard" />
            ) : (
              <HomePage
                onGetStarted={() => setShowAuthModal(true)}
                onShowAuth={() => setShowAuthModal(true)}
              />
            )
          }
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Layout onLogout={handleLogout}>
                <Dashboard onOrderPlaced={handleOrderPlaced} />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders"
          element={
            <ProtectedRoute>
              <Layout onLogout={handleLogout}>
                <TradingInterface onOrderPlaced={handleOrderPlaced} />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/portfolio"
          element={
            <ProtectedRoute>
              <Layout onLogout={handleLogout}>
                <Portfolio />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/strategy"
          element={
            <ProtectedRoute>
              <Layout onLogout={handleLogout}>
                <StrategyManager />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/watchlist"
          element={
            <ProtectedRoute>
              <Layout onLogout={handleLogout}>
                <Watchlist />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/history"
          element={
            <ProtectedRoute>
              <Layout onLogout={handleLogout}>
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Order History</h2>
                    <p className="text-gray-600 mt-2">View all your past trading orders and their status</p>
                  </div>
                  <TradingInterface onOrderPlaced={handleOrderPlaced} />
                </div>
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Layout onLogout={handleLogout}>
                <Settings />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
}

export default App;
