import css from "./dashboardContent.module.css";

function DashboardSettings() {
  return (
    <div className={css.container}>
      <h2 className={css.subtitle}>Settings</h2>
      <p className={css.description}>
        This is the settings section of your dashboard.
      </p>
    </div>
  );
}
export default DashboardSettings;