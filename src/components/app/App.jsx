import { lazy, useEffect } from "react";
import css from "./App.module.css";
import { useSelector } from "react-redux";
import { Routes, Route } from "react-router-dom";
import { Suspense } from "react";
import { Toaster } from "react-hot-toast";
import PrivateRoute from "../../routes/PrivateRoute.jsx";
import { selectToken } from "../../redux/auth/selectors.js";
import { setAuthHeader } from "../../redux/auth/operations.js";

const Home = lazy(() => import("../../pages/homePage/homePage.jsx"));
const LoginPage = lazy(() => import("../../pages/LoginPage/LoginPage.jsx"));
const RegisterPage = lazy(
  () => import("../../pages/registerPage/RegisterPage.jsx"),
);
const ForgotPasswordPage = lazy(
  () => import("../../pages/forgotPassword/ForgotPassword.jsx"),
);
const ResetPasswordPage = lazy(
  () => import("../../pages/forgotPassword/ResetPassword.jsx"),
);
const DashboardContent = lazy(
  () => import("../../components/dashboardContent/dashboardContent.jsx"),
);
const DashboardToday = lazy(
  () => import("../../components/dashboardContent/dashboardToday.jsx"),
);
const DashboardHistory = lazy(
  () => import("../../components/dashboardContent/dashboardHistory.jsx"),
);
const DashboardSettings = lazy(
  () => import("../../components/dashboardContent/dashboardSettings.jsx"),
);

function App() {
  const token = useSelector(selectToken);

  useEffect(() => {
    if (token) {
      setAuthHeader(token);
    }
  }, [token]);

  return (
    <div className={css.appContainer}>
      <Suspense fallback={"loading..."}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route
            path="/dashboard/:userId"
            element={
              <PrivateRoute>
                <DashboardContent />
              </PrivateRoute>
            }
          >
            <Route path="today" element={<DashboardToday />} />
            <Route path="history" element={<DashboardHistory />} />
            <Route path="settings" element={<DashboardSettings />} />
          </Route>
        </Routes>
      </Suspense>
      <Toaster position="top-center" reverseOrder={false} />
    </div>
  );
}
export default App;
