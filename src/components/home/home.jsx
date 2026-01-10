import css from "./home.module.css";
import { Link } from "react-router-dom";

function Home() {
  return (
    <>
      <div className={css.appContainer}>
        <div className={css.logoContainer}>
          <img
            src="/public/images/logo.png"
            alt="Memory Orbs Logo"
            className={css.logo}
          />
          <h1 className={css.logoText}>MEMORY ORBS</h1>
        </div>
        <h1>DUYGULARINI GÖRSELLEŞTİR</h1>
        <h2>
          Memory Orbs, günlük duygu durumunu renkli anı kürelerine dönüştürür.
        </h2>
        <h2>HOW DO YOU FEEL TODAY?</h2>
        <Link to="/" className={css.getStartedButton}>
          GET STARTED
        </Link>
      </div>
    </>
  );
}
export default Home;
