import css from "./dashboardContent.module.css";
import { Outlet, useParams, useNavigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchOrbByDate } from "../../redux/orb/operations";
import { selectCurrentOrb } from "../../redux/orb/selectors";
import { selectUserName } from "../../redux/auth/selectors";
import { logoutUser } from "../../redux/auth/operations";


function DashboardContent() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const currentOrb = useSelector(selectCurrentOrb);
  const username = useSelector(selectUserName);

  const location = useLocation();

  const handleLogout = async () => {
    try {
      await dispatch(logoutUser()).unwrap();
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  useEffect(() => {
    // Only redirect if we are strictly on the dashboard root path
    // This prevents infinite loops and unwanted redirects from sub-pages
    const isDashboardRoot =
      location.pathname === `/dashboard/${userId}` ||
      location.pathname === `/dashboard/${userId}/`;

    if (!isDashboardRoot) return;

    // Bugünün tarihini al (YYYY-MM-DD formatında)
    const today = new Date().toISOString().split("T")[0];

    // Backend'den bugüne ait orb'u kontrol et
    dispatch(fetchOrbByDate(today)).then((result) => {
      // result.meta.requestStatus === 'fulfilled' indicates success (orb found/returned)
      // result.meta.requestStatus === 'rejected' indicates failure (likely 404/no orb)
      // We also check result.payload just to be safe if backend returns null on success
      if (result.meta.requestStatus === "fulfilled" && result.payload) {
        navigate(`/dashboard/${userId}/history`, { replace: true });
      } else {
        navigate(`/dashboard/${userId}/today`, { replace: true });
      }
    });
  }, [userId, navigate, dispatch, location.pathname]);

  return (
    <>
      <div className={css.container}>
        <div className={css.headerWrapper}>
          <h1 className={css.title}>Welcome {username || ""}</h1>
          <div className={css.navButtons}>
            <button
              className={`${css.navBtn} ${location.pathname.includes("/history") ? css.activeNavBtn : ""}`}
              onClick={() => navigate(`/dashboard/${userId}/history`)}
            >
              History
            </button>
            <button
              className={`${css.navBtn} ${location.pathname.includes("/settings") ? css.activeNavBtn : ""}`}
              onClick={() => navigate(`/dashboard/${userId}/settings`)}
            >
              Settings
            </button>
            <button
              className={css.logoutBtn}
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        </div>

      </div>
      <Outlet />
    </>
  );
}
export default DashboardContent;
