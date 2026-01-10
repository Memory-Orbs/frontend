import { lazy } from 'react';
import css from './App.module.css';


const Home = lazy(() => import('../../pages/homePage/homePage.jsx'));
    
function App() {
    return (
      <>
        <div className={css.appContainer}>
            <Home />
        </div>
      </>
    );
}
export default App;