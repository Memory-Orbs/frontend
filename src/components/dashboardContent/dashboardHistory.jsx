import css from "./dashboardContent.module.css";

function DashboardHistory() {
  return (
    <div className={css.container}>
      <h2 className={css.subtitle}>History</h2>
      <p className={css.description}>
        This is the history section of your dashboard.
      </p>
      {/* Geçmiş verilerinizi burada görüntüleyebilirsiniz */}
    </div>
  );
}
export default DashboardHistory;