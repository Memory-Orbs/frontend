import { useState } from "react";
import { useDispatch } from "react-redux";
import { addOrb } from "../../redux/orb/operations";
import css from "./dashboardContent.module.css";

function DashboardToday() {
    const dispatch = useDispatch();
    const [emotions, setEmotions] = useState([
        { name: "", percentage: 50 },
        { name: "", percentage: 50 },
    ]);
    const [error, setError] = useState(null);

    const handleEmotionChange = (index, field, value) => {
        const newEmotions = [...emotions];
        newEmotions[index][field] = value;
        setEmotions(newEmotions);
        setError(null);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const totalPercentage = emotions.reduce(
            (sum, emo) => sum + Number(emo.percentage),
            0
        );

        if (totalPercentage !== 100) {
            setError("Total percentage must be exactly 100%.");
            return;
        }

        if (emotions.some((e) => !e.name.trim())) {
            setError("Please enter names for both emotions.");
            return;
        }

        const payload = {
            date: new Date().toISOString().split("T")[0],
            emotions: emotions.map((e) => ({
                name: e.name,
                percentage: Number(e.percentage),
            })),
        };

        dispatch(addOrb(payload));
    };

    return (
        <div className={css.container}>
            <h2 className={css.subtitle}>Today's Orb</h2>
            <p className={css.description}>
                How are you feeling today? Define your emotions to create today's Orb.
            </p>

            <form onSubmit={handleSubmit} className={css.formContainer}>
                {emotions.map((emotion, index) => (
                    <div key={index} className={css.formGroup}>
                        <div className={css.inputGroup}>
                            <label className={css.label}>Emotion {index + 1}</label>
                            <input
                                type="text"
                                placeholder="e.g. Happy"
                                className={css.input}
                                value={emotion.name}
                                onChange={(e) =>
                                    handleEmotionChange(index, "name", e.target.value)
                                }
                            />
                        </div>
                        <div className={css.inputGroup}>
                            <label className={css.label}>Percentage (%)</label>
                            <input
                                type="number"
                                min="0"
                                max="100"
                                className={css.input}
                                value={emotion.percentage}
                                onChange={(e) =>
                                    handleEmotionChange(index, "percentage", e.target.value)
                                }
                            />
                        </div>
                    </div>
                ))}

                {error && <p className={css.errorMsg}>{error}</p>}

                <button type="submit" className={css.submitBtn}>
                    Create Orb
                </button>
            </form>
        </div>
    );
}

export default DashboardToday;
