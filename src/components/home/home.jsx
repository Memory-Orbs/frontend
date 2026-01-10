import css from "./home.module.css";
import { Link } from "react-router-dom";

function Home() {
  return (
    <>
      <div className={css.appContainer}>
        <h1>WELCOME</h1>
        <h2>HOW DO YOU FEEL TODAY?</h2>
        <Link to="/" className={css.getStartedButton}>GET STARTED</Link>
      </div>
    </>
  );
}
export default Home;
