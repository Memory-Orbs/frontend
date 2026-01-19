import css from "./dashboardContent.module.css";

function DashboardToday() {
    return (
        <div className={css.container}>
            <h2 className={css.subtitle}>Today</h2>
            <p className={css.description}>
                This is the today's section of your dashboard.
            </p>
        </div>
    );
}
export default DashboardToday;