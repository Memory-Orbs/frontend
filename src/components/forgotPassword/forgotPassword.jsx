import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import css from "./forgotPassword.module.css";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { sendPasswordResetEmail } from "../../redux/auth/operations";
import { selectIsPasswordResetSending } from "../../redux/auth/selectors";
import toast from "react-hot-toast";

const ForgotPasswordContent = () => {
  const dispatch = useDispatch();
  const [emailSent, setEmailSent] = useState(false);
  const isSending = useSelector(selectIsPasswordResetSending);

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      await dispatch(sendPasswordResetEmail(values.email)).unwrap();
      setEmailSent(true);
      toast.success("E-posta başarıyla gönderildi!");
    } catch (error) {
      const errorMessage =
        typeof error === "string"
          ? error
          : error?.message || "Şifre sıfırlama başarısız";

      toast.error(errorMessage);
      console.error("Forgot Password Error:", errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={css.container}>
      {emailSent ? (
        <div className={css.message}>
          Şifre sıfırlama bağlantısı e-posta adresinize gönderildi. Lütfen gelen
          kutunuzu kontrol edin.
        </div>
      ) : (
        <Formik
          initialValues={{ email: "" }}
          validationSchema={Yup.object({
            email: Yup.string()
              .email("Geçersiz e-posta adresi")
              .required("*Gerekli"),
          })}
          onSubmit={handleSubmit}
        >
          {({ isSubmitting }) => (
            <Form className={css.form}>
              <div className={css.field}>
                <label htmlFor="email">E-posta Adresi</label>
                <Field type="email" name="email" className={css.input} />
                <ErrorMessage
                  name="email"
                  component="div"
                  className={css.error}
                />
              </div>
              <button
                type="submit"
                className={css.button}
                disabled={isSubmitting || isSending}
              >
                {isSubmitting || isSending
                  ? "Gönderiliyor..."
                  : "Şifre Sıfırlama Bağlantısı Gönder"}
              </button>
            </Form>
          )}
        </Formik>
      )}
    </div>
  );
};

export default ForgotPasswordContent;
