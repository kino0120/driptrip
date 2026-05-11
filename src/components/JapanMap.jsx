import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { useState } from 'react';
import Svg, { Polygon, Circle, G, Rect, Text as SvgText } from 'react-native-svg';

const LNG_MIN = 127, LNG_MAX = 146, LAT_MIN = 26, LAT_MAX = 46;

function proj(lng, lat, W, H) {
  const x = (lng - LNG_MIN) / (LNG_MAX - LNG_MIN) * W;
  const y = (LAT_MAX - lat) / (LAT_MAX - LAT_MIN) * H;
  return [x, y];
}

function pts(coords, W, H) {
  return coords.map(([lng, lat]) => proj(lng, lat, W, H).join(',')).join(' ');
}

const ISLANDS = [
  [[141.0,45.5],[143.0,44.5],[145.5,44.2],[145.5,43.5],[143.5,42.5],[142.5,41.5],[141.2,41.3],[140.0,41.5],[139.5,42.5],[140.0,44.0],[141.0,45.5]],
  [[141.5,41.5],[141.5,40.5],[142.0,39.5],[141.8,38.5],[141.5,38.0],[141.0,37.0],[140.7,36.5],[140.7,36.0],[140.9,35.7],[140.6,35.0],[139.9,34.8],[139.5,35.0],[138.8,34.5],[138.5,35.0],[137.5,34.5],[136.5,34.5],[136.0,34.0],[135.5,33.5],[135.0,33.8],[135.0,34.2],[134.5,34.3],[133.5,34.0],[132.5,33.8],[131.5,34.0],[131.0,33.8],[130.8,34.1],[130.8,34.3],[131.5,34.5],[132.0,35.0],[133.0,35.5],[134.0,35.5],[134.5,35.5],[135.0,35.6],[135.3,35.5],[136.0,36.0],[136.5,36.5],[136.8,37.5],[136.5,37.0],[138.0,37.5],[138.8,38.0],[139.5,39.5],[140.0,40.0],[140.5,40.5],[140.8,41.0],[141.0,41.3],[141.5,41.5]],
  [[133.5,34.2],[134.5,34.3],[134.0,33.5],[133.5,33.4],[132.5,33.6],[133.5,34.2]],
  [[130.5,33.8],[131.5,33.5],[132.0,33.0],[131.5,32.5],[131.0,31.5],[130.5,31.2],[130.0,31.5],[129.5,32.0],[129.5,33.0],[130.0,33.5],[130.5,33.8]],
  [[128.3,26.9],[128.5,26.7],[128.4,26.4],[128.1,26.2],[127.8,26.1],[127.7,26.3],[127.8,26.6],[128.1,26.8],[128.3,26.9]],
];

const PREFECTURES = [
  { name: '北海道', lng: 143.2, lat: 43.1 },
  { name: '青森', lng: 140.7, lat: 40.6 },
  { name: '岩手', lng: 141.2, lat: 39.7 },
  { name: '宮城', lng: 141.0, lat: 38.3 },
  { name: '秋田', lng: 140.1, lat: 39.7 },
  { name: '山形', lng: 140.3, lat: 38.2 },
  { name: '福島', lng: 140.4, lat: 37.4 },
  { name: '茨城', lng: 140.3, lat: 36.3 },
  { name: '栃木', lng: 139.9, lat: 36.6 },
  { name: '群馬', lng: 139.1, lat: 36.5 },
  { name: '埼玉', lng: 139.5, lat: 35.9 },
  { name: '千葉', lng: 140.1, lat: 35.6 },
  { name: '東京', lng: 139.7, lat: 35.7 },
  { name: '神奈川', lng: 139.5, lat: 35.4 },
  { name: '新潟', lng: 138.9, lat: 37.5 },
  { name: '富山', lng: 137.2, lat: 36.7 },
  { name: '石川', lng: 136.6, lat: 36.6 },
  { name: '福井', lng: 136.2, lat: 36.1 },
  { name: '山梨', lng: 138.6, lat: 35.7 },
  { name: '長野', lng: 137.9, lat: 36.2 },
  { name: '静岡', lng: 138.3, lat: 35.2 },
  { name: '愛知', lng: 137.0, lat: 35.1 },
  { name: '三重', lng: 136.5, lat: 34.7 },
  { name: '滋賀', lng: 136.0, lat: 35.0 },
  { name: '京都', lng: 135.8, lat: 35.0 },
  { name: '大阪', lng: 135.5, lat: 34.7 },
  { name: '兵庫', lng: 134.8, lat: 34.8 },
  { name: '奈良', lng: 135.8, lat: 34.4 },
  { name: '和歌山', lng: 135.2, lat: 34.2 },
  { name: '鳥取', lng: 134.2, lat: 35.5 },
  { name: '島根', lng: 132.5, lat: 35.5 },
  { name: '岡山', lng: 133.9, lat: 34.7 },
  { name: '広島', lng: 132.5, lat: 34.4 },
  { name: '山口', lng: 131.5, lat: 34.2 },
  { name: '徳島', lng: 134.6, lat: 34.1 },
  { name: '香川', lng: 134.0, lat: 34.3 },
  { name: '愛媛', lng: 132.8, lat: 33.8 },
  { name: '高知', lng: 133.5, lat: 33.6 },
  { name: '福岡', lng: 130.4, lat: 33.6 },
  { name: '佐賀', lng: 130.1, lat: 33.3 },
  { name: '長崎', lng: 129.8, lat: 32.7 },
  { name: '熊本', lng: 130.7, lat: 32.8 },
  { name: '大分', lng: 131.6, lat: 33.2 },
  { name: '宮崎', lng: 131.4, lat: 31.9 },
  { name: '鹿児島', lng: 130.6, lat: 31.6 },
  { name: '沖縄', lng: 127.9, lat: 26.5 },
];

const TOOLTIP_W = 120;
const TOOLTIP_H = 24;

export default function JapanMap({ posts = [] }) {
  const { width } = useWindowDimensions();
  const W = width - 32;
  const H = Math.round(W * 1.3);

  const [tooltip, setTooltip] = useState(null); // { name, x, y }

  // lat/lng があるもの → 個別ピン
  const shopPins = posts.filter(p => p.lat && p.lng && p.shop_name);

  // lat/lng なしで prefecture があるもの → 都道府県ドット
  const prefMap = {};
  posts.filter(p => !p.lat && p.prefecture).forEach(p => {
    prefMap[p.prefecture] = (prefMap[p.prefecture] || 0) + 1;
  });

  function handlePinPress(pin, x, y) {
    if (tooltip?.name === pin.shop_name && tooltip?.x === x) {
      setTooltip(null);
    } else {
      // ツールチップが画面端にはみ出さないようにクランプ
      const tx = Math.min(Math.max(x, TOOLTIP_W / 2 + 4), W - TOOLTIP_W / 2 - 4);
      const ty = y - 16 < TOOLTIP_H ? y + 16 : y - 16;
      setTooltip({ name: pin.shop_name, x: tx, y: ty });
    }
  }

  return (
    <View style={styles.wrap}>
      <View style={{ width: W, height: H }}>
        <Svg width={W} height={H}>
            <Rect width={W} height={H} fill="#C5DBF0" rx={10} />
            {ISLANDS.map((region, i) => (
              <Polygon key={i} points={pts(region, W, H)} fill="#DDD3C4" stroke="#BFB09E" strokeWidth={0.5} />
            ))}

            {/* 都道府県ドット（lat/lngなし） */}
            {PREFECTURES.map(pref => {
              const [x, y] = proj(pref.lng, pref.lat, W, H);
              const count = prefMap[pref.name] || 0;
              if (count === 0) return null;
              const r = count >= 5 ? 8 : count >= 3 ? 6 : 5;
              return (
                <G key={pref.name}>
                  <Circle cx={x} cy={y} r={r} fill="#6B4226" opacity={0.6} />
                  <SvgText x={x} y={y + 3.5} fontSize={7} textAnchor="middle" fill="#fff" fontWeight="bold">
                    {count}
                  </SvgText>
                </G>
              );
            })}

            {/* 個別店舗ピン */}
            {shopPins.map((pin, i) => {
              const [x, y] = proj(pin.lng, pin.lat, W, H);
              const isSelected = tooltip?.name === pin.shop_name && Math.abs(tooltip?.x - Math.min(Math.max(x, TOOLTIP_W / 2 + 4), W - TOOLTIP_W / 2 - 4)) < 1;
              return (
                <G key={i} onPress={() => handlePinPress(pin, x, y)}>
                  <Circle cx={x} cy={y} r={7} fill={isSelected ? '#C0392B' : '#6B4226'} opacity={0.9} />
                  <Circle cx={x} cy={y} r={3} fill="#fff" opacity={0.7} />
                </G>
              );
            })}

            {/* ツールチップ */}
            {tooltip && (
              <G>
                <Rect
                  x={tooltip.x - TOOLTIP_W / 2}
                  y={tooltip.y - TOOLTIP_H}
                  width={TOOLTIP_W}
                  height={TOOLTIP_H}
                  fill="#1A1A1A"
                  rx={6}
                  opacity={0.88}
                />
                <SvgText
                  x={tooltip.x}
                  y={tooltip.y - TOOLTIP_H / 2 + 4}
                  fontSize={9}
                  textAnchor="middle"
                  fill="#fff"
                  fontWeight="bold"
                >
                  {tooltip.name.length > 14 ? tooltip.name.slice(0, 14) + '…' : tooltip.name}
                </SvgText>
              </G>
            )}
          </Svg>
      </View>

      <Text style={styles.hint}>ピンをタップで店名表示</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginHorizontal: 16, marginBottom: 16 },
  hint: { fontSize: 11, color: '#aaa', textAlign: 'center', marginTop: 6 },
});
