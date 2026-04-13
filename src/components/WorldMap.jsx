import { View, Text, StyleSheet, Dimensions, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { useState } from 'react';
import Svg, { Polygon, Text as SvgText, Circle, G, Rect } from 'react-native-svg';

const W = Dimensions.get('window').width - 32;
const H = W * 0.54;

const TREE_EMOJI = ['', '🌱', '🌿', '🌳', '🌲'];

function proj(lng, lat) {
  const x = ((lng + 180) / 360) * W;
  const y = ((90 - lat) / 180) * H;
  return [x, y];
}

function pts(coords) {
  return coords.map(([lng, lat]) => proj(lng, lat).join(',')).join(' ');
}

const LAND = [
  // ── 北アメリカ ──
  [[-168,72],[-141,70],[-120,69],[-96,73],[-78,72],[-65,48],[-52,47],[-67,44],[-76,35],[-80,25],[-87,15],[-83,10],[-77,8],[-90,16],[-92,20],[-97,19],[-105,20],[-110,24],[-117,32],[-120,34],[-124,38],[-124,47],[-125,50],[-130,55],[-135,57],[-138,60],[-141,60],[-155,59],[-162,63],[-168,66],[-168,72]],
  // ── 中央アメリカ・カリブ ──
  [[-77,8],[-82,8],[-83,10],[-87,15],[-77,8]],
  // ── 南アメリカ ──
  [[-80,9],[-75,11],[-63,11],[-57,6],[-52,4],[-44,2],[-35,-5],[-35,-9],[-38,-13],[-40,-20],[-48,-26],[-50,-33],[-53,-35],[-58,-34],[-62,-39],[-65,-43],[-65,-47],[-66,-52],[-68,-54],[-71,-54],[-74,-47],[-74,-40],[-71,-30],[-70,-18],[-75,-14],[-77,-10],[-80,-3],[-80,9]],
  // ── ヨーロッパ ──
  [[-9,36],[-6,36],[2,37],[5,36],[10,38],[15,38],[16,38],[15,37],[18,40],[20,38],[23,38],[26,38],[28,41],[30,46],[30,52],[24,57],[20,54],[15,54],[10,57],[8,55],[5,58],[3,56],[0,51],[-2,51],[-5,50],[-5,54],[-3,55],[0,58],[-3,58],[-5,58],[-6,58],[1,58],[5,60],[5,62],[5,65],[14,65],[20,68],[25,68],[28,70],[30,69],[27,64],[22,60],[24,59],[22,57],[24,57],[27,55],[22,55],[20,54],[15,54],[10,57],[5,62],[3,56],[0,51],[-3,44],[-1,44],[3,43],[7,44],[7,37],[5,36],[2,37],[-5,36],[-6,37],[-9,39],[-9,36]],
  // ── アフリカ ──
  [[-5,36],[12,37],[24,37],[32,31],[35,30],[37,23],[43,15],[45,12],[51,12],[45,11],[43,5],[42,-1],[40,-10],[36,-17],[35,-25],[33,-27],[27,-34],[18,-35],[16,-29],[14,-22],[12,-17],[9,-5],[2,4],[-3,5],[-9,5],[-15,10],[-17,14],[-17,21],[-15,27],[-17,33],[-5,36]],
  // ── アジア本体 ──
  [[26,72],[40,72],[60,72],[75,72],[100,72],[140,72],[140,65],[135,60],[130,55],[132,44],[126,38],[120,33],[120,22],[110,21],[105,10],[100,3],[95,5],[88,22],[80,12],[75,22],[70,22],[60,22],[55,22],[50,12],[43,15],[37,23],[35,30],[40,36],[36,37],[28,41],[30,46],[30,52],[35,55],[40,55],[60,56],[68,54],[74,50],[80,50],[90,50],[100,50],[110,44],[120,50],[125,52],[130,55],[132,44],[126,38],[120,33],[110,20],[105,10],[100,3],[95,5],[88,22],[80,12],[60,22],[50,12],[43,15],[40,36],[36,37],[28,41],[26,40],[26,72]],
  // ── 東南アジア ──
  [[95,20],[105,20],[110,20],[115,5],[120,2],[110,-8],[105,-8],[98,3],[95,10],[95,20]],
  // ── インドネシア（スマトラ・ジャワ簡略）──
  [[95,6],[108,6],[108,-8],[100,-8],[95,0],[95,6]],
  // ── オーストラリア ──
  [[114,-22],[122,-18],[130,-14],[136,-12],[136,-14],[139,-17],[145,-14],[148,-18],[152,-24],[152,-32],[150,-38],[148,-38],[144,-38],[140,-36],[132,-32],[126,-34],[115,-34],[114,-28],[114,-22]],
  // ── グリーンランド ──
  [[-58,83],[-22,84],[-16,78],[-18,72],[-25,68],[-44,60],[-50,62],[-58,66],[-58,72],[-58,83]],
  // ── 日本（簡略）──
  [[130,31],[132,33],[134,35],[136,36],[139,36],[141,41],[141,44],[140,44],[134,44],[130,40],[130,35],[130,31]],
  // ── ニュージーランド ──
  [[172,-37],[174,-37],[174,-41],[172,-41],[170,-44],[168,-46],[170,-46],[172,-37]],
  // ── スカンジナビア ──
  [[5,58],[5,60],[5,62],[5,65],[8,63],[10,57],[8,56],[5,58]],
  [[14,65],[20,68],[25,68],[28,70],[30,69],[28,64],[22,60],[20,54],[14,54],[14,65]],
  // ── イギリス諸島 ──
  [[-5,50],[-3,51],[0,51],[1,52],[0,53],[-2,54],[-3,55],[0,57],[-2,58],[-5,58],[-5,55],[-5,52],[-5,50]],
  // ── アイルランド ──
  [[-10,52],[-6,52],[-6,55],[-10,55],[-10,52]],
];

const COUNTRY_COORDS = {
  'Ethiopia':   [40.5,  9.1],
  'Kenya':      [37.0, -1.3],
  'Colombia':   [-74.0, 4.0],
  'Brazil':     [-51.9,-14.2],
  'Guatemala':  [-90.2, 15.8],
  'Costa Rica': [-83.8,  9.7],
  'Panama':     [-80.8,  8.5],
  'Yemen':      [48.5,  15.6],
  'Indonesia':  [113.9, -0.8],
  'Vietnam':    [108.3, 14.1],
  'Peru':       [-75.0, -9.2],
  'Honduras':   [-86.2, 15.2],
  'Nicaragua':  [-85.2, 12.9],
  'Mexico':     [-102.6,23.6],
  'Rwanda':     [29.9,  -1.9],
  'Burundi':    [29.9,  -3.4],
  'Tanzania':   [34.9,  -6.4],
  'Uganda':     [32.3,   1.4],
  'India':      [79.0,  20.6],
  'Jamaica':    [-77.3, 18.1],
};

const TOOLTIP_W = 100;
const TOOLTIP_H = 22;

export default function WorldMap({ trees = [] }) {
  const [selected, setSelected] = useState(null); // country string
  const treeMap = {};
  trees.forEach(t => { treeMap[t.country] = t; });

  function handleTreePress(country) {
    setSelected(prev => prev === country ? null : country);
  }

  function openAmazon(country) {
    // アフィリエイトタグ取得後、URLの末尾に &tag=YOUR_TAG を追加してください
    const query = encodeURIComponent(`${country} コーヒー豆`);
    Linking.openURL(`https://www.amazon.co.jp/s?k=${query}`);
  }

  return (
    <View style={styles.wrap}>
      <ScrollView
        maximumZoomScale={4}
        minimumZoomScale={1}
        bouncesZoom
        centerContent
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        onScrollBeginDrag={() => setSelected(null)}
      >
        <View style={{ width: W, height: H }}>
          <Svg width={W} height={H}>
            <Rect width={W} height={H} fill="#C5DBF0" rx={10} />

            {LAND.map((region, i) => (
              <Polygon
                key={i}
                points={pts(region)}
                fill="#DDD3C4"
                stroke="#BFB09E"
                strokeWidth={0.5}
              />
            ))}

            {Object.entries(COUNTRY_COORDS).map(([country, [lng, lat]]) => {
              const [x, y] = proj(lng, lat);
              const tree = treeMap[country];
              if (!tree) return null;
              return (
                <G key={country} onPress={() => handleTreePress(country)}>
                  <Circle cx={x} cy={y} r={14} fill="transparent" />
                  <SvgText x={x} y={y + 6} fontSize={13} textAnchor="middle">
                    {TREE_EMOJI[tree.level] ?? '🌱'}
                  </SvgText>
                </G>
              );
            })}
          </Svg>
        </View>
      </ScrollView>

      {selected && (
        <View style={styles.selectedCard}>
          <Text style={styles.selectedCountry}>{selected}</Text>
          <TouchableOpacity style={styles.amazonBtn} onPress={() => openAmazon(selected)} activeOpacity={0.75}>
            <Text style={styles.amazonBtnText}>この産地の豆を探す →</Text>
          </TouchableOpacity>
        </View>
      )}

      <Text style={styles.hint}>ピンチで拡大 / 木をタップで詳細表示</Text>

      {trees.length > 0 && (
        <View style={styles.legend}>
          {trees.map(t => (
            <View key={t.id} style={styles.legendItem}>
              <Text style={styles.legendEmoji}>{TREE_EMOJI[t.level]}</Text>
              <Text style={styles.legendLabel}>{t.country}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginHorizontal: 16, marginBottom: 16 },
  hint: { fontSize: 11, color: '#aaa', textAlign: 'center', marginTop: 6 },
  selectedCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, marginTop: 8, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6 },
  selectedCountry: { fontSize: 14, fontWeight: '700', color: '#1A1A1A' },
  amazonBtn: { backgroundColor: '#FF9900', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  amazonBtnText: { fontSize: 12, fontWeight: '700', color: '#fff' },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#fff', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4 },
  legendEmoji: { fontSize: 13 },
  legendLabel: { fontSize: 11, color: '#555', fontWeight: '600' },
});
