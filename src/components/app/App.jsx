import { lazy } from "react";
import css from "./App.module.css";
import { useDispatch, useSelector } from "react-redux";
import { Routes, Route } from "react-router-dom";
import { Suspense } from "react";
import { selectIsRefreshing } from "../../redux/auth/selectors";
import { Toaster } from "react-hot-toast";


const Home = lazy(() => import("../../pages/homePage/homePage.jsx"));
const LoginPage = lazy(() => import("../../pages/LoginPage/LoginPage.jsx"));
const RegisterPage = lazy(() => import("../../pages/registerPage/RegisterPage.jsx"));
const ForgotPasswordPage = lazy(() => import("../../pages/forgotPassword/ForgotPassword.jsx"));
const ResetPasswordPage = lazy(() => import("../../pages/forgotPassword/ResetPassword.jsx"));

function App() {
  const dispatch = useDispatch();
  const isLoggedIn = useSelector((state) => state.auth);
  // const isRefreshing = useSelector(selectIsRefreshing);

  return (
    <div className={css.appContainer}>
      <Suspense fallback={"loading..."}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
        </Routes>
      </Suspense>
      <Toaster position="top-center" reverseOrder={false} />
    </div>
  );
}
export default App;
