import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import css from "./forgotPassword.module.css";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { sendPasswordResetEmail } from "../../redux/auth/operations";
import {
  selectPasswordResetMessage,
  selectIsPasswordResetSending,
} from "../../redux/auth/selectors";
import toast from "react-hot-toast";

const ForgotPasswordContent = ({ setMode}) => {
  const dispatch = useDispatch();
  const [emailSent, setEmailSent] = useState(false);
  const isSending = useSelector(selectIsPasswordResetSending);
  const message = useSelector(selectPasswordResetMessage);


  const handleSubmit = async (values, { setSubmitting }) => {
      try {
        const result = await dispatch(sendPasswordResetEmail(values.email));
        if (result.meta.requestStatus === "fulfilled") {
          setEmailSent(true);
          toast.success("E-mail sent successfully!");
        } else {
          // Eğer payload bir nesneyse içindeki mesajı al, değilse kendisini kullan
          const errorToShow =
            typeof result.payload === "string"
              ? result.payload
              : result.payload && typeof result.payload === "object"
              ? result.payload.message || JSON.stringify(result.payload)
              : "E-mail could not be sent";

          toast.error(errorToShow);
        }
      }  finally {
        setSubmitting(false);
      }
  };
  
  return (
    <div className={css.container}>
      {emailSent ? (
        <div className={css.message}>
          Reset password link has been sent to your email. Please check your inbox.
        </div>
      ) : (
        <Formik
          initialValues={{ email: "" }}
          validationSchema={Yup.object({
            email: Yup.string()
              .email("Invalid email address")
              .required("Required"),
          })}
          onSubmit={handleSubmit}
        >
          {({ isSubmitting, values }) => (
            <Form className={css.form}>
              <div className={css.field}>
                <label htmlFor="email">Email Address</label>
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
                  ? "Sending..."
                  : "Send Reset Password Link"}
              </button>
            </Form>
          )}
        </Formik>
      )}
    </div>
  );
};

export default ForgotPasswordContent;
