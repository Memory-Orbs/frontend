import { useState } from "react";
import { useDispatch } from "react-redux";
import { addOrb } from "../../redux/orb/operations";
import css from "./dashboardContent.module.css";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";


const EMOTIONS = [
  "joy",
  "sadness",
  "anger",
  "disgust",
  "fear",
  "anxiety",
  "envy",
  "ennui",
  "embarrassment",
];

function DashboardToday() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const userId = useSelector((state) => state.auth.user.id);



  const [emotions, setEmotions] = useState([
    { type: "", percentage: 50 },
    { type: "", percentage: 50 },
  ]);

  const [note, setNote] = useState("");
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleEmotionChange = (index, field, value) => {
    const updated = [...emotions];
    updated[index][field] = value;
    setEmotions(updated);
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const total = emotions.reduce(
      (sum, e) => sum + Number(e.percentage),
      0
    );

    if (total !== 100) {
      setError("Emotion percentages must total 100%.");
      return;
    }

    if (emotions.some((e) => !e.type)) {
      setError("Please select emotion types.");
      return;
    }

    setIsSubmitting(true);

    const payload = {
      date: new Date(), // backend normalizeDate yapıyor
      emotions: emotions.map((e) => ({
        type: e.type,
        percentage: Number(e.percentage),
      })),
      note,
      animationSeed: Math.floor(Math.random() * 100000),
    };

    try {
      await dispatch(addOrb(payload)).unwrap();

      toast.success("Today's orb created successfully");
      navigate(`/dashboard/${userId}/history`);
    } catch (err) {
      setError(
        err?.message || "Today's orb already exists or something went wrong.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={css.container}>
      <h2 className={css.subtitle}>Today's Orb</h2>
      <p className={css.description}>
        Select at least two emotions that describe your day.
      </p>

      <form onSubmit={handleSubmit} className={css.formContainer}>
        {emotions.map((emotion, index) => (
          <div key={index} className={css.formGroup}>
            <div className={css.inputGroup}>
              <label className={css.label}>
                Emotion {index + 1}
              </label>
              <select
                className={css.input}
                value={emotion.type}
                onChange={(e) =>
                  handleEmotionChange(index, "type", e.target.value)
                }
              >
                <option value="">Select emotion</option>
                {EMOTIONS.map((emo) => (
                  <option key={emo} value={emo}>
                    {emo}
                  </option>
                ))}
              </select>
            </div>

            <div className={css.inputGroup}>
              <label className={css.label}>Percentage (%)</label>
              <input
                type="number"
                min="1"
                max="100"
                className={css.input}
                value={emotion.percentage}
                onChange={(e) =>
                  handleEmotionChange(
                    index,
                    "percentage",
                    e.target.value
                  )
                }
              />
            </div>
          </div>
        ))}

        <div className={css.inputGroup}>
          <label className={css.label}>Note (optional)</label>
          <textarea
            className={css.textarea}
            maxLength={500}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        {error && <p className={css.errorMsg}>{error}</p>}

        <button
          type="submit"
          className={css.submitBtn}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Creating..." : "Create Today's Orb"}
        </button>
      </form>
    </div>
  );
}

export default DashboardToday;
