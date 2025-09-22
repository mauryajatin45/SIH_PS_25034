import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import WelcomePage from "./pages/WelcomePage";
import ProfilePage from "./pages/ProfilePage";
import ResultsPage from "./pages/ResultsPage";
import InternshipDetailsPage from "./pages/InternshipDetailsPage";
import FeedbackPage from "./pages/FeedbackPage";
import AboutPage from "./pages/AboutPage";
import ApiTest from "./components/ApiTest";
import Login from "./pages/Login";
import Signup from "./pages/Signup";

function AppRoutes() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const profileComplete = localStorage.getItem('udaan_profile_complete');
    const redirectablePaths = new Set(["/", "/login", "/signup", "/profile"]);

    if (token && profileComplete && redirectablePaths.has(location.pathname)) {
      navigate('/results', { replace: true });
    }
  }, [location.pathname, navigate]);

  return (
    <Routes>
      <Route path="/" element={<WelcomePage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/results" element={<ResultsPage />} />
      <Route path="/result" element={<ResultsPage />} />
      <Route path="/internship/:id" element={<InternshipDetailsPage />} />
      <Route path="/feedback" element={<FeedbackPage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/api-test" element={<ApiTest />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <div className="app">
        <AppRoutes />
      </div>
    </Router>
  );
}

export default App;
