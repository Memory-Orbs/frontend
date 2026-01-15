import css from "./RegisterForm.module.css";
import { useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { registerUser } from "../../redux/auth/operations";
import { useDispatch } from "react-redux";
import { toast } from "react-hot-toast";
import { Link } from "react-router-dom";

const RegisterForm = () => {
  const dispatch = useDispatch();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const initialValues = {
    name: "",
    surname: "",
    email: "",
    password: "",
  };

  const validationSchema = Yup.object({
    name: Yup.string()
      .min(2, "Name must be at least 2 characters")
      .required("Name is required"),
    surname: Yup.string()
      .min(2, "Surname must be at least 2 characters")
      .required("Surname is required"),
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
      await dispatch(registerUser(values)).unwrap();
      toast.success("Registration successful!");
      resetForm();
    } catch (error) {
      toast.error(error.message || "Registration failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={css.registerFormContainer}>
      <h2 className={css.title}>Register</h2>

      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        <Form className={css.registerForm}>
          <label className={css.label}>
            Name
            <Field
              className={css.input}
              type="text"
              name="name"
              placeholder="Enter your name"
            />
            <ErrorMessage className={css.error} name="name" component="div" />
          </label>

          <label className={css.label}>
            Surname
            <Field
              className={css.input}
              type="text"
              name="surname"
              placeholder="Enter your surname"
            />
            <ErrorMessage
              className={css.error}
              name="surname"
              component="div"
            />
          </label>

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
            {isSubmitting ? "Registering..." : "Register"}
          </button>
        </Form>
      </Formik>

      <p className={css.loginText}>
        Already have an account?{" "}
        <Link className={css.loginLink} to="/login">
          Login here
        </Link>
      </p>
    </div>
  );
};

export default RegisterForm;
