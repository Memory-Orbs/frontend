import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import {
  selectIsLoggedIn,
  selectIsRefreshing,
} from "../redux/auth/selectors.js";

const PrivateRoute = ({ children }) => {
  const isLoggedIn = useSelector(selectIsLoggedIn);
  const isRefreshing = useSelector(selectIsRefreshing);

  return isRefreshing ? (
    <div>Loading...</div>
  ) : isLoggedIn ? (
    children
  ) : (
    <Navigate to="/" />
  );
};

export default PrivateRoute;
