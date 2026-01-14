import css from "./loginForm.module.css";
import { useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { loginUser } from "../../redux/auth/operations";
import { useDispatch } from "react-redux";
import { toast } from "react-hot-toast";
import { Link } from "react-router-dom";

const LoginForm = () => {
  const dispatch = useDispatch();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const initialValues = {
    email: "",
    password: "",
  };

  const validationSchema = Yup.object({
    email: Yup.string()
      .email("Invalid email address")
      .required("Email is required"),
    password: Yup.string()
      .min(6, "Password must be at least 6 characters")
      .required("Password is required"),
  });

  const handleSubmit = async (values, { resetForm }) => {
    setIsSubmitting(true);
    try {
      await dispatch(loginUser(values)).unwrap();
      toast.success("Login successful!");
      resetForm();
    } catch (error) {
      toast.error("Login failed. Please check your credentials.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={css.loginFormContainer}>
      <h2 className={css.title}>Login</h2>

      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        <Form className={css.loginForm}>
          <label className={css.label}>
            Email
            <Field
              className={css.input}
              type="email"
              name="email"
              placeholder="Enter your email"
            />
            <ErrorMessage className={css.error} name="email" component="div" />
          </label>

          <label className={css.label}>
            Password
            <Field
              className={css.input}
              type="password"
              name="password"
              placeholder="Enter your password"
            />
            <ErrorMessage
              className={css.error}
              name="password"
              component="div"
            />
          </label>

          <button
            className={css.submitButton}
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Logging in..." : "Login"}
          </button>
        </Form>
      </Formik>

      <p className={css.registerText}>
        Forgot your password?{" "}
        <Link className={css.forgotLink} to="/forgot-password">
          Reset here
        </Link>
      </p>

      <p className={css.registerText}>
        Don't have an account?{" "}
        <Link className={css.registerLink} to="/register">
          Register here
        </Link>
      </p>
    </div>
  );
};

export default LoginForm;
