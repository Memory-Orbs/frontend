import { lazy } from "react";
import css from "./App.module.css";
import { useDispatch, useSelector } from "react-redux";
import { Routes, Route } from "react-router-dom";
import { Suspense } from "react";
import { selectIsRefreshing } from "../../redux/auth/selectors";

const Home = lazy(() => import("../../pages/homePage/homePage.jsx"));
const LoginPage = lazy(() => import("../../pages/LoginPage/LoginPage.jsx"));

function App() {
  const dispatch = useDispatch();
  const isLoggedIn = useSelector((state) => state.auth);
  const isRefreshing = useSelector(selectIsRefreshing);

  return (
    <div className={css.appContainer}>
      <Suspense fallback={"loading..."}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<LoginPage />} />
        </Routes>
      </Suspense>
    </div>
  );
}
export default App;
