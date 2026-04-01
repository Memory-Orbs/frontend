import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import { selectUser } from "../../redux/auth/selectors";
import { updateUser } from "../../redux/auth/operations";
import toast from "react-hot-toast";
import css from "./dashboardContent.module.css";

function DashboardSettings() {
  const user = useSelector(selectUser);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { userId } = useParams();

  const [formData, setFormData] = useState({
    name: "",
    surname: "",
    email: "",
    gender: "",
    birthDate: "",
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        surname: user.surname || "",
        email: user.email || "",
        gender: user.gender || "",
        birthDate: user.birthDate ? user.birthDate.split("T")[0] : "",
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const updateData = {
      name: formData.name,
      surname: formData.surname,
      gender: formData.gender,
      birthDate: formData.birthDate,
    };

    try {
      await dispatch(updateUser({ id: userId, data: updateData })).unwrap();
      toast.success("Profile updated successfully!");
    } catch (error) {
      toast.error(error || "Failed to update profile.");
    }
  };

  return (
    <div className={css.container}>
      <div className={css.settingsHeader}>
        <p className={css.description}>
          Update your personal information below. Your email address cannot be changed.
        </p>
      </div>

      <form className={css.formContainer} onSubmit={handleSubmit}>
        <div className={css.formGrid}>
          <div className={css.inputGroup}>
            <label className={css.label}>Name</label>
            <input
              className={css.input}
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Your Name"
              required
            />
          </div>

          <div className={css.inputGroup}>
            <label className={css.label}>Surname</label>
            <input
              className={css.input}
              type="text"
              name="surname"
              value={formData.surname}
              onChange={handleChange}
              placeholder="Your Surname"
              required
            />
          </div>

          <div className={css.inputGroup}>
            <label className={css.label}>Email Address</label>
            <input
              className={`${css.input} ${css.disabledInput}`}
              type="email"
              name="email"
              value={formData.email}
              disabled
            />
          </div>

          <div className={css.inputGroup}>
            <label className={css.label}>Gender</label>
            <select
              className={css.input}
              name="gender"
              value={formData.gender}
              onChange={handleChange}
            >
              <option value="">Select Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className={css.inputGroup}>
            <label className={css.label}>Birth Date</label>
            <input
              className={css.input}
              type="date"
              name="birthDate"
              value={formData.birthDate}
              onChange={handleChange}
            />
          </div>
        </div>

        <button type="submit" className={css.submitBtn}>
          Save Changes
        </button>
      </form>
    </div>
  );
}

export default DashboardSettings;