import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { addOrb } from "../../redux/orb/operations";
import css from "./dashboardContent.module.css";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { EMOTIONS, EMOTION_COLORS } from "../../utils/colorUtils";
import OrbCanvas from "../Orbs/OrbCanvas";
import Orb from "../Orbs/Orb";
import { TubeStructure, AnimatedTubeOrb } from "../Orbs/Tube";

function DashboardToday() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const userId = useSelector((state) => state.auth.user._id);

  const [emotions, setEmotions] = useState([
    { type: "", percentage: 50 },
    { type: "", percentage: 50 },
  ]);

  const [note, setNote] = useState("");
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleEmotionChange = (index, field, value) => {
    console.log("Emotion changed:", index, field, value);
    const updated = emotions.map((emo, i) => 
      i === index ? { ...emo, [field]: value } : emo
    );
    setEmotions(updated);
    setError(null);
  };

  const getOrbState = () => {
    const defaultColor = "#e2e8f0";
    const validEmotions = emotions.filter((e) => e.type !== "");

    if (validEmotions.length === 0) {
      return {
        color1: defaultColor,
        color2: defaultColor,
        pct1: 0,
        pct2: 0,
        fill: 1.0,
      };
    } else if (validEmotions.length === 1) {
      return {
        color1: EMOTION_COLORS[validEmotions[0].type.toLowerCase()],
        color2: defaultColor,
        pct1: Number(validEmotions[0].percentage) / 100,
        pct2: 0,
        fill: 1.0,
      };
    } else {
      const type1 = validEmotions[0].type;
      const type2 = validEmotions[1].type;
      const pct1 = Number(validEmotions[0].percentage) / 100;
      const pct2 = Number(validEmotions[1].percentage) / 100;

      return {
        color1: EMOTION_COLORS[type1.toLowerCase()],
        color2: EMOTION_COLORS[type2.toLowerCase()],
        pct1: pct1,
        pct2: pct2,
        fill: 1.0,
      };
    }
  };

  const orbState = getOrbState();

  const handleAnimationComplete = async () => {
    const filteredEmotions = emotions.filter(e => e.type !== "");
    
    console.log("Filtered Emotions:", filteredEmotions);

    if (filteredEmotions.length === 0) {
      setError("Please select at least one emotion.");
      setIsSubmitting(false);
      setIsAnimating(false);
      return;
    }

    const payload = {
      date: new Date().toISOString().split("T")[0],
      emotions: filteredEmotions.map((e) => ({
        type: e.type,
        percentage: Number(e.percentage),
      })),
      note: note.trim(),
      animationSeed: Math.floor(Math.random() * 100000),
    };

    console.log("Final Payload being dispatched:", JSON.stringify(payload, null, 2));

    try {
      await dispatch(addOrb(payload)).unwrap();
      toast.success("Today's orb created successfully");
      navigate(`/dashboard/${userId}/history`, { state: { incomingOrb: payload } });
    } catch (err) {
      console.error("Add orb failed. Server response:", err);
      setError(err?.message || "Today's orb already exists or something went wrong.");
      setIsSubmitting(false);
      setIsAnimating(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const filteredEmotions = emotions.filter(e => e.type !== "");
    
    if (filteredEmotions.length === 0) {
      setError("Please select at least one emotion.");
      return;
    }

    const total = filteredEmotions.reduce((sum, e) => sum + Number(e.percentage), 0);

    if (total !== 100) {
      setError("Selected emotion percentages must total 100%.");
      return;
    }

    setIsSubmitting(true);
    setIsAnimating(true); // Starts the 3D tube vanishing animation
  };

  return (
    <div className={css.pageContent}>
      <h2 className={css.subtitle}>Today's Orb</h2>
      <p className={css.description}>
        Select at least two emotions that describe your day. Watch your orb fill!
      </p>

      {/* 3D Canvas rendering the Orb and Tube */}
      <OrbCanvas cameraZ={6}>
        <TubeStructure visible={isAnimating} />
        
        {isAnimating ? (
          <AnimatedTubeOrb onComplete={handleAnimationComplete} duration={2.5}>
            <Orb {...orbState} scale={1} />
          </AnimatedTubeOrb>
        ) : (
          <Orb {...orbState} scale={1.2} />
        )}
      </OrbCanvas>

      <form onSubmit={handleSubmit} className={css.formContainer} style={{ opacity: isAnimating ? 0.3 : 1, pointerEvents: isAnimating ? 'none' : 'auto', transition: 'all 0.5s ease' }}>
        {emotions.map((emotion, index) => (
          <div key={index} className={css.formGroup}>
            <div className={css.inputGroup}>
              <label className={css.label}>Emotion {index + 1}</label>
              <select
                className={css.input}
                value={emotion.type}
                onChange={(e) => handleEmotionChange(index, "type", e.target.value)}
              >
                <option value="">Select emotion</option>
                {EMOTIONS.map((emo) => (
                  <option key={emo} value={emo}>
                    {emo.charAt(0).toUpperCase() + emo.slice(1)}
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
                onChange={(e) => handleEmotionChange(index, "percentage", e.target.value)}
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

        <button type="submit" className={css.submitBtn} disabled={isSubmitting}>
          {isAnimating ? "Animating..." : isSubmitting ? "Creating..." : "Create Today's Orb"}
        </button>
      </form>
    </div>
  );
}

export default DashboardToday;
