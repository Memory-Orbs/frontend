import css from "./dashboardContent.module.css";
import { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { fetchOrbs } from "../../redux/orb/operations";
import { selectOrbs, selectIsLoading } from "../../redux/orb/selectors";
import styles from "./history.module.css";

import * as THREE from "three";
import OrbCanvas from "../Orbs/OrbCanvas";
import Orb from "../Orbs/Orb";
import { TubeStructure, AnimatedTubeOrb } from "../Orbs/Tube";
import { EMOTION_COLORS } from "../../utils/colorUtils";

// Shelf position calculator
const calculateShelfPosition = (index) => {
  const itemsPerRow = 5;
  const startX = -6;
  const startY = 3;
  const xGap = 3;
  const yGap = 2.5;

  const row = Math.floor(index / itemsPerRow);
  const col = index % itemsPerRow;

  return new THREE.Vector3(startX + col * xGap, startY - row * yGap, -3); // slight depth
};

function DashboardHistory() {
  const { userId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const orbs = useSelector(selectOrbs);
  const isLoading = useSelector(selectIsLoading);

  const incomingOrbState = location.state?.incomingOrb || null;
  const [animatingIncoming, setAnimatingIncoming] = useState(!!incomingOrbState);
  const [incomingTubeDone, setIncomingTubeDone] = useState(false);

  useEffect(() => {
    dispatch(fetchOrbs());
  }, [dispatch]);

  // Generate a mock 30-day view
  const shelfDays = useMemo(() => {
    const days = [];
    const today = new Date();
    // Start from top-left, going back in time
    for (let i = 0; i < 30; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      days.push({
        dateStr: d.toDateString(),
        index: i,
        position: calculateShelfPosition(i),
      });
    }
    return days;
  }, []);

  const getOrbPropsForDay = (dayStr, index) => {
    // Check if real orb exists
    const orbsArray = Array.isArray(orbs) ? orbs : [];
    const found = orbsArray.find((o) => {
      const parsed = new Date(o.date);
      return !isNaN(parsed) && parsed.toDateString() === dayStr;
    });

    // If this is the incoming orb, we handle it separately
    if (incomingOrbState) {
      const incomingParsed = new Date(incomingOrbState.date);
      if (!isNaN(incomingParsed) && incomingParsed.toDateString() === dayStr) {
        if (animatingIncoming) {
          // Render it specially
          return null;
        } else {
          // Finished animating, render normal but with data
          return parseOrbData(incomingOrbState);
        }
      }
    }

    if (found) {
      return parseOrbData(found);
    }

    // Empty space
    return {
      color1: EMOTION_COLORS.empty,
      color2: EMOTION_COLORS.empty,
      ratio: 0.5,
      fill: 0,
    };
  };

  const parseOrbData = (orb) => {
    const validEmotions = (orb.emotions || []).filter((e) => e.type !== "");
    const defaultColor = "#e2e8f0";

    if (validEmotions.length === 0) return { color1: defaultColor, color2: defaultColor, pct1: 0, pct2: 0, fill: 1.0 };
    if (validEmotions.length === 1) return { color1: EMOTION_COLORS[validEmotions[0].type], color2: defaultColor, pct1: Number(validEmotions[0].percentage) / 100, pct2: 0, fill: 1.0 };
    
    return {
      color1: EMOTION_COLORS[validEmotions[0].type] || defaultColor,
      color2: EMOTION_COLORS[validEmotions[1].type] || defaultColor,
      pct1: Number(validEmotions[0].percentage) / 100,
      pct2: Number(validEmotions[1].percentage) / 100,
      fill: 1.0,
    };
  };

  const handleOrbClick = (dayStr) => {
    // Navigate to Today view with an edit state
    // The requirement says: "veri girme olsun çünkü today sayfasındaki gibi animasyon yapacağız"
    navigate(`/dashboard/${userId}/today`, { state: { editDay: dayStr } });
  };

  if (isLoading && orbs.length === 0) {
    return (
      <div className={css.pageContent}>
        <h2 className={css.subtitle}>History (Orb Bookshelf)</h2>
        <p>Yükleniyor...</p>
      </div>
    );
  }

  // Incoming Orb Props
  const incomingProps = incomingOrbState ? parseOrbData(incomingOrbState) : null;

  return (
    <div className={css.pageContent}>
      <h2 className={css.subtitle}>Orb Bookshelf</h2>
      <p className={css.description}>
        Her küre bir günü temsil eder. Güncellemek için tıklayın.
      </p>

      {/* 3D Canvas rendering the Shelf */}
      <OrbCanvas hideControls={false}>
        {/* Render Tube only if animating */}
        {animatingIncoming && <TubeStructure visible={true} />}
        
        {/* Render incoming orb */}
        {animatingIncoming && incomingProps && (
          !incomingTubeDone ? (
            <AnimatedTubeOrb 
              reverse={true} // Comes out towards the camera/shelf
              onComplete={() => setIncomingTubeDone(true)}
              duration={2.5}
            >
              <Orb {...incomingProps} scale={1} />
            </AnimatedTubeOrb>
          ) : (
            // After tube is done, lerp to shelf
            <Orb 
              {...incomingProps} 
              scale={1} 
              isAnimating={true}
              position={[0,0,2]} // Tube exit point approximately
              targetPosition={shelfDays[0].position} // Assuming it represents Today
              onAnimationComplete={() => setAnimatingIncoming(false)}
            />
          )
        )}

        {/* Render static bookshelf */}
        {shelfDays.map((day) => {
          const props = getOrbPropsForDay(day.dateStr, day.index);
          if (!props) return null; // skipped because it's currently incoming
          
          return (
            <Orb
              key={day.dateStr}
              {...props}
              position={[day.position.x, day.position.y, day.position.z]}
              scale={0.8}
              onClick={(e) => {
                e.stopPropagation();
                handleOrbClick(day.dateStr);
              }}
            />
          );
        })}
      </OrbCanvas>
    </div>
  );
}

export default DashboardHistory;
