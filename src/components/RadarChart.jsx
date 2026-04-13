import { useRef } from 'react';
import { View, PanResponder } from 'react-native';
import Svg, { Polygon, Line, Text as SvgText, Circle } from 'react-native-svg';

const DEFAULT_SIZE = 280;

const AXES = [
  { key: 'bitterness', label: '苦味' },
  { key: 'acidity',    label: '酸味' },
  { key: 'sweetness',  label: '甘み' },
  { key: 'body',       label: 'コク' },
  { key: 'aroma',      label: '香り' },
  { key: 'aftertaste', label: '後味' },
];

function angle(i) {
  return (i * 60 - 90) * (Math.PI / 180);
}

export default function RadarChart({ ratings, onChange, onTouchStart, onTouchEnd, size = DEFAULT_SIZE }) {
  const CENTER = size / 2;
  const MAX_RADIUS = size * 0.321; // ~90 for size=280

  function point(value, i) {
    const r = (value / 10) * MAX_RADIUS;
    return { x: CENTER + r * Math.cos(angle(i)), y: CENTER + r * Math.sin(angle(i)) };
  }

  function gridPoints(level) {
    return AXES.map((_, i) => {
      const r = (level / 10) * MAX_RADIUS;
      return `${CENTER + r * Math.cos(angle(i))},${CENTER + r * Math.sin(angle(i))}`;
    }).join(' ');
  }

  function labelPos(i) {
    const r = MAX_RADIUS + size * 0.079; // ~22 for size=280
    return { x: CENTER + r * Math.cos(angle(i)), y: CENTER + r * Math.sin(angle(i)) };
  }

  const dataPoints = AXES.map((a, i) => point(ratings[a.key], i));
  const polygonPoints = dataPoints.map(p => `${p.x},${p.y}`).join(' ');

  const panResponder = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => !!onChange,
    onMoveShouldSetPanResponder: () => !!onChange,
    onPanResponderGrant: (e) => { onTouchStart?.(); handleTouch(e.nativeEvent.locationX, e.nativeEvent.locationY); },
    onPanResponderMove: (e) => handleTouch(e.nativeEvent.locationX, e.nativeEvent.locationY),
    onPanResponderRelease: () => onTouchEnd?.(),
    onPanResponderTerminate: () => onTouchEnd?.(),
  })).current;

  function handleTouch(lx, ly) {
    const dx = lx - CENTER;
    const dy = ly - CENTER;
    let deg = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
    if (deg < 0) deg += 360;
    const axisIndex = Math.round(deg / 60) % 6;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const value = Math.max(1, Math.min(10, Math.round((dist / MAX_RADIUS) * 10)));
    onChange(AXES[axisIndex].key, value);
  }

  return (
    <View {...panResponder.panHandlers}>
      <Svg width={size} height={size}>
        {/* Grid */}
        {[2, 4, 6, 8, 10].map(level => (
          <Polygon
            key={level}
            points={gridPoints(level)}
            fill="none"
            stroke="#E0D8D0"
            strokeWidth="1"
          />
        ))}

        {/* Axis lines */}
        {AXES.map((_, i) => {
          const end = point(10, i);
          return (
            <Line
              key={i}
              x1={CENTER} y1={CENTER}
              x2={end.x} y2={end.y}
              stroke="#E0D8D0"
              strokeWidth="1"
            />
          );
        })}

        {/* Data polygon */}
        <Polygon
          points={polygonPoints}
          fill="rgba(107, 66, 38, 0.25)"
          stroke="#6B4226"
          strokeWidth="2"
        />

        {/* Data points */}
        {dataPoints.map((p, i) => (
          <Circle key={i} cx={p.x} cy={p.y} r={size > 200 ? 5 : 3} fill="#6B4226" />
        ))}

        {/* Labels */}
        {AXES.map((a, i) => {
          const lp = labelPos(i);
          return (
            <SvgText
              key={i}
              x={lp.x}
              y={lp.y}
              fontSize={size > 200 ? 12 : 9}
              fill="#555"
              textAnchor="middle"
              alignmentBaseline="middle"
            >
              {a.label}
            </SvgText>
          );
        })}
      </Svg>
    </View>
  );
}
