import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import css from "./forgotPassword.module.css";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import { resetPassword } from "../../redux/auth/operations";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  selectIsPasswordResetSending,
  selectPasswordResetMessage,
  selectIsPasswordResetSuccess,
} from "../../redux/auth/selectors";

export const ResetPasswordContent = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const isSending = useSelector(selectIsPasswordResetSending);
  const resetMessage = useSelector(selectPasswordResetMessage);
  const resetSuccess = useSelector(selectIsPasswordResetSuccess);

  const initialValues = {
    newPassword: "",
    confirmPassword: "",
  };

  const validationSchema = Yup.object({
    newPassword: Yup.string()
      .min(6, "Password must be at least 6 characters long")
      .required("New password is required"),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref("newPassword"), null], "Passwords do not match")
      .required("Confirm password is required"),
  });

  const handleSubmit = async (values, { resetForm }) => {
    if (!token) {
      toast.error("Geçersiz veya eksik token.");
      return;
    }

    const result = await dispatch(
      resetPassword({ token, newPassword: values.newPassword })
    );

    if (resetPassword.fulfilled.match(result)) {
      toast.success(result.payload?.message || "Password updated successfully");
      resetForm();

      // YÖNLENDİRME
      setTimeout(() => {
        navigate("/");
      }, 800);
    } else {
      const errorMessage = typeof result.payload === 'string'
        ? result.payload
        : result.payload?.message || "Password reset failed";
      toast.error(errorMessage);
    }
  };

  return (
    <div className={css.container}>
      <h2 className={css.message}>Set New Password</h2>

      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        <Form className={css.form}>
          <div className={css.field}>
            <label>New Password</label>
            <Field type="password" name="newPassword" className={css.input} />
            <ErrorMessage
              name="newPassword"
              component="div"
              className={css.error}
            />
          </div>

          <div className={css.field}>
            <label>Confirm Password</label>
            <Field
              type="password"
              name="confirmPassword"
              className={css.input}
            />
            <ErrorMessage
              name="confirmPassword"
              component="div"
              className={css.error}
            />
          </div>

          <button type="submit" className={css.button} disabled={isSending}>
            {isSending ? " Saving..." : "Save"}
          </button>
        </Form>
      </Formik>

      {resetMessage && (
        <p className={resetSuccess ? css.success : css.errorMsg}>
          {resetMessage}
        </p>
      )}
    </div>
  );
};

export default ResetPasswordContent;
