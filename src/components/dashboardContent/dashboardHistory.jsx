import css from "./dashboardContent.module.css";
import { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { fetchOrbs } from "../../redux/orb/operations";
import { selectOrbs, selectIsLoading } from "../../redux/orb/selectors";
import { Html } from "@react-three/drei";

import * as THREE from "three";
import OrbCanvas from "../Orbs/OrbCanvas";
import Orb from "../Orbs/Orb";
import { TubeStructure, AnimatedTubeOrb } from "../Orbs/Tube";
import { EMOTION_COLORS } from "../../utils/colorUtils";

// Improved Shelf position calculator for high-fidelity browse experience
const calculateShelfPosition = (index, total, viewRange) => {
  let itemsPerRow = 5;
  let xGap = 3.5;
  let yGap = 4.0;
  
  if (viewRange === 'month') {
    itemsPerRow = 7;
    xGap = 2.8;
    yGap = 3.0;
  } else if (viewRange === 'year') {
    itemsPerRow = 15;
    xGap = 1.4;
    yGap = 1.6;
  }
  
  const col = index % itemsPerRow;
  const row = Math.floor(index / itemsPerRow);
  const totalRows = Math.ceil(total / itemsPerRow);
  
  const startX = -((itemsPerRow - 1) * xGap) / 2;
  const startY = ((totalRows - 1) * yGap) / 2;

  return new THREE.Vector3(startX + col * xGap, startY - row * yGap, 0);
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

  // View range state (week, month, year)
  const [viewRange, setViewRange] = useState('month');

  useEffect(() => {
    dispatch(fetchOrbs());
  }, [dispatch]);

  const shelfDays = useMemo(() => {
    const days = [];
    const today = new Date();
    let totalDays = viewRange === 'year' ? 365 : viewRange === 'month' ? 30 : 7;
    
    for (let i = 0; i < totalDays; i++) {
      const d = new Date(today);
      // Change: Calculate date such that i=0 is the oldest day in the range
      d.setDate(d.getDate() - (totalDays - 1 - i));
      days.push({
        dateStr: d.toDateString(),
        dayLabel: d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }),
        index: i,
        position: calculateShelfPosition(i, totalDays, viewRange),
      });
    }
    return days;
  }, [viewRange]);

  const parseOrbData = (orb) => {
    const validEmotions = (orb.emotions || []).filter((e) => e.type !== "");
    const defaultColor = "#e2e8f0";

    if (validEmotions.length === 0) return { color1: defaultColor, color2: defaultColor, pct1: 0, pct2: 0, fill: 1.0 };
    if (validEmotions.length === 1) return { color1: EMOTION_COLORS[validEmotions[0].type.toLowerCase()] || defaultColor, color2: defaultColor, pct1: Number(validEmotions[0].percentage) / 100, pct2: 0, fill: 1.0 };
    
    return {
      color1: EMOTION_COLORS[validEmotions[0].type.toLowerCase()] || defaultColor,
      color2: EMOTION_COLORS[validEmotions[1].type.toLowerCase()] || defaultColor,
      pct1: Number(validEmotions[0].percentage) / 100,
      pct2: Number(validEmotions[1].percentage) / 100,
      fill: 1.0,
    };
  };

  const getOrbPropsForDay = (dayStr) => {
    const orbsArray = Array.isArray(orbs) ? orbs : [];
    const found = orbsArray.find((o) => {
      const parsed = new Date(o.date);
      return !isNaN(parsed) && parsed.toDateString() === dayStr;
    });

    if (incomingOrbState) {
      const incomingParsed = new Date(incomingOrbState.date);
      if (!isNaN(incomingParsed) && incomingParsed.toDateString() === dayStr) {
        return animatingIncoming ? null : parseOrbData(incomingOrbState);
      }
    }

    if (found) return parseOrbData(found);

    // Empty space (unrecorded day)
    return {
      color1: EMOTION_COLORS.empty || "#ffffff",
      color2: EMOTION_COLORS.empty || "#ffffff",
      ratio: 0.5,
      fill: 0,
    };
  };

  const handleOrbClick = (dayStr) => {
    navigate(`/dashboard/${userId}/today`, { state: { editDay: dayStr } });
  };

  const incomingProps = incomingOrbState ? parseOrbData(incomingOrbState) : null;

  const orbScale = viewRange === 'week' ? 0.9 : viewRange === 'month' ? 0.65 : 0.35;
  const cameraZ = viewRange === 'week' ? 20 : viewRange === 'month' ? 22 : 35;
  const canvasHeight = viewRange === 'week' ? '500px' : viewRange === 'month' ? '1200px' : '4000px';

  return (
    <div className={css.pageContent}>
      <div className={css.historyHeader}>
        <div>
          <h2 className={css.subtitle}>Hafıza Arşivi</h2>
          <p className={css.description}>
            Duygusal yolculuğun, cam kürelerde saklı.
          </p>
        </div>
        <div className={css.viewSelector}>
          {['week', 'month', 'year'].map((range) => (
            <button
              key={range}
              className={`${css.selectorBtn} ${viewRange === range ? css.activeBtn : ''}`}
              onClick={() => setViewRange(range)}
            >
              {range === 'week' ? 'Hafta' : range === 'month' ? 'Ay' : 'Yıl'}
            </button>
          ))}
        </div>
      </div>

      <div className={css.canvasWrapper}>
        <OrbCanvas 
          hideControls={true} 
          height={canvasHeight}
          cameraZ={cameraZ}
        >
          {animatingIncoming && <TubeStructure visible={true} />}
          
          {animatingIncoming && incomingProps && (
            !incomingTubeDone ? (
              <AnimatedTubeOrb 
                reverse={true}
                onComplete={() => setIncomingTubeDone(true)}
                duration={2.5}
              >
                <Orb {...incomingProps} scale={orbScale} />
              </AnimatedTubeOrb>
            ) : (
              <Orb 
                {...incomingProps} 
                scale={orbScale} 
                isAnimating={true}
                position={[0,0,2]}
                targetPosition={shelfDays[shelfDays.length - 1].position}
                onAnimationComplete={() => setAnimatingIncoming(false)}
              />
            )
          )}

          {shelfDays.map((day) => {
            const props = getOrbPropsForDay(day.dateStr);
            if (!props) return null;
            
            return (
              <group key={day.dateStr} position={[day.position.x, day.position.y, day.position.z]}>
                <Orb
                  {...props}
                  scale={orbScale}
                  idle={false}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOrbClick(day.dateStr);
                  }}
                />
                <Html position={[0, -2, 0]} center>
                  <div className={css.orbLabel}>
                    {day.dayLabel}
                  </div>
                </Html>
              </group>
            );
          })}
        </OrbCanvas>
      </div>

      {isLoading && orbs.length === 0 && (
        <div className={css.loadingOverlay}>
          <div className={css.spinner}></div>
          <p>Yükleniyor...</p>
        </div>
      )}
    </div>
  );
}

export default DashboardHistory;
