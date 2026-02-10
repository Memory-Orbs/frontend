import css from "./dashboardContent.module.css";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import { fetchOrbs } from "../../redux/orb/operations";
import { selectOrbs, selectIsLoading } from "../../redux/orb/selectors";
import styles from "./history.module.css";

function DashboardHistory() {
  const { userId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const orbs = useSelector(selectOrbs);
  const isLoading = useSelector(selectIsLoading);
  const [groupedOrbs, setGroupedOrbs] = useState({});

  useEffect(() => {
    // Tüm orb'ları getir
    dispatch(fetchOrbs());
  }, [dispatch]);

  useEffect(() => {
    // Orb'ları tarihe göre grupla (en yeniden en eskiye)
    const grouped = {};
    const orbsArray = Array.isArray(orbs) ? orbs : [];

    orbsArray.forEach((orb) => {
      const date = new Date(orb.date).toLocaleDateString("tr-TR", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(orb);
    });

    setGroupedOrbs(grouped);
  }, [orbs]);

  const handleEdit = (orbId) => {
    navigate(`/dashboard/${userId}/today`, { state: { editOrbId: orbId } });
  };

  if (isLoading) {
    return (
      <div className={css.container}>
        <h2 className={css.subtitle}>History</h2>
        <p>Yükleniyor...</p>
      </div>
    );
  }

  const dates = Object.keys(groupedOrbs).sort((a, b) => {
    return new Date(b) - new Date(a);
  });

  return (
    <div className={css.container}>
      <h2 className={css.subtitle}>History</h2>
      {dates.length === 0 ? (
        <p className={css.description}>Henüz orb eklenmemiş.</p>
      ) : (
        <div className={styles.historyList}>
          {dates.map((date) => (
            <div key={date} className={styles.dateGroup}>
              <h3 className={styles.dateHeader}>{date}</h3>
              <div className={styles.orbCards}>
                {groupedOrbs[date].map((orb) => (
                  <div key={orb._id} className={styles.orbCard}>
                    <div className={styles.orbContent}>
                      
                      <p className={styles.orbEmotions}>
                        <strong>Duygular:</strong>{" "}
                        {Array.isArray(orb.emotions)
                          ? orb.emotions
                              .map((e) =>
                                typeof e === "object" && e !== null
                                  ? e.name || JSON.stringify(e)
                                  : e,
                              )
                              .join(", ") || "Belirtilmemiş"
                          : "Belirtilmemiş"}
                      </p>
                      <p className={styles.orbNote}>
                        <strong>Not:</strong> {orb.note || "Not eklenmemiş"}
                      </p>
                    </div>
                    <button
                      className={styles.editBtn}
                      onClick={() => handleEdit(orb._id)}
                    >
                      Düzenle
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
export default DashboardHistory;
