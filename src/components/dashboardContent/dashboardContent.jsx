import css from "./dashboardContent.module.css";
import { Outlet, useParams, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchOrbByDate } from "../../redux/orb/operations";
import { selectCurrentOrb } from "../../redux/orb/selectors";

function DashboardContent() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const currentOrb = useSelector(selectCurrentOrb);

  useEffect(() => {
    // Bugünün tarihini al (YYYY-MM-DD formatında)
    const today = new Date().toISOString().split("T")[0];

    // Backend'den bugüne ait orb'u kontrol et
    dispatch(fetchOrbByDate(today)).then((result) => {
      // Eğer orb varsa history sayfasına, yoksa today sayfasına yönlendir
      if (result.payload) {
        navigate(`/dashboard/${userId}/history`);
      } else {
        navigate(`/dashboard/${userId}/today`);
      }
    });
  }, [userId, navigate, dispatch]);

  return (
    <>
      <div className={css.container}>
        <div className={css.headerWrapper}>
          <h1 className={css.title}>Dashboard</h1>
          <button
            className={css.settingsBtn}
            onClick={() => navigate(`/dashboard/${userId}/settings`)}
          >
             Settings
          </button>
        </div>
        <p className={css.description}>Welcome to your dashboard!</p>
      </div>
      <Outlet />
    </>
  );
}
export default DashboardContent;
