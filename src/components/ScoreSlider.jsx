import { View, Text, StyleSheet, PanResponder } from 'react-native';
import { useRef } from 'react';

const MIN = 0;
const MAX = 5;
const STEP = 0.1;
const TRACK_W = 260;

export default function ScoreSlider({ value, onChange }) {
  const trackRef = useRef(null);
  const trackX = useRef(0);

  function clamp(v) {
    return Math.round(Math.min(MAX, Math.max(MIN, v)) / STEP) * STEP;
  }

  function posToValue(x) {
    const ratio = Math.min(1, Math.max(0, x / TRACK_W));
    return clamp(ratio * MAX);
  }

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => {
        const x = e.nativeEvent.locationX;
        onChange(posToValue(x));
      },
      onPanResponderMove: (e) => {
        const x = e.nativeEvent.pageX - trackX.current;
        onChange(posToValue(x));
      },
    })
  ).current;

  const thumbPos = ((value ?? 0) / MAX) * TRACK_W;
  const stars = Math.round((value ?? 0) * 10) / 10;

  function starDisplay(score) {
    const full = Math.floor(score);
    const partial = score - full;
    return '★'.repeat(full) + (partial >= 0.5 ? '⯨' : partial > 0 ? '☆' : '') + '☆'.repeat(MAX - full - (partial > 0 ? 1 : 0));
  }

  return (
    <View style={styles.container}>
      <Text style={styles.score}>{(value ?? 0).toFixed(1)} <Text style={styles.max}>/ 5.0</Text></Text>
      <View
        style={styles.trackWrap}
        onLayout={(e) => { trackX.current = e.nativeEvent.layout.x; }}
        {...panResponder.panHandlers}
      >
        <View style={styles.track}>
          <View style={[styles.fill, { width: thumbPos }]} />
          <View style={[styles.thumb, { left: thumbPos - 12 }]} />
        </View>
      </View>
      <View style={styles.labels}>
        <Text style={styles.labelText}>0</Text>
        <Text style={styles.labelText}>5</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', marginVertical: 8 },
  score: { fontSize: 32, fontWeight: '800', color: '#6B4226', marginBottom: 12 },
  max: { fontSize: 16, fontWeight: '400', color: '#999' },
  trackWrap: { width: TRACK_W, paddingVertical: 16 },
  track: {
    width: TRACK_W, height: 8, borderRadius: 4,
    backgroundColor: '#E8E8E8', position: 'relative',
  },
  fill: { height: 8, borderRadius: 4, backgroundColor: '#6B4226' },
  thumb: {
    position: 'absolute', top: -10, width: 28, height: 28,
    borderRadius: 14, backgroundColor: '#6B4226',
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  labels: { flexDirection: 'row', justifyContent: 'space-between', width: TRACK_W },
  labelText: { fontSize: 12, color: '#999' },
});
