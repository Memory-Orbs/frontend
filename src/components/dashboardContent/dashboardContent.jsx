import css from "./dashboardContent.module.css";
import {  Outlet, useParams } from "react-router-dom";

function DashboardContent() {
    // user bu sayfaya geldiğinde eğer bacendde bugüne ait orb varsa history sayfasına yönlendirilir.
    // eğer yoksa dashboard sayfasında kullanıcıya orb oluşturması için today sayfası yönlendirilir.
    //user kendi bilgilerini güncellemesi için settings sayfasına ulaşım butonu herzaman olacak.
    const { userId } = useParams();


    return (
      <>
        <div className={css.container}>
          <h1 className={css.title}>Dashboard</h1>
          <p className={css.description}>Welcome to your dashboard!</p>
        </div>
        <Outlet />
      </>
    );
}
export default DashboardContent;
