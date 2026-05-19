import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, Image, Modal, Dimensions } from 'react-native';
import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import TextRecognition, { TextRecognitionScript } from '@react-native-ml-kit/text-recognition';
import { supabase } from '../lib/supabase';
import RadarChart from '../components/RadarChart';
import ScoreSlider from '../components/ScoreSlider';
import { COUNTRIES, normalizeCountry } from '../lib/countries';

function calcLevel(count) {
  return count >= 10 ? 4 : count >= 6 ? 3 : count >= 3 ? 2 : 1;
}

async function syncOriginTrees(userId, oldOriginsStr, newOriginsStr) {
  const oldOrigins = oldOriginsStr ? oldOriginsStr.split(',').map(s => normalizeCountry(s.trim())).filter(Boolean) : [];
  const newOrigins = newOriginsStr ? newOriginsStr.split(',').map(s => normalizeCountry(s.trim())).filter(Boolean) : [];

  if (oldOrigins.length > 0) {
    const fraction = 1 / oldOrigins.length;
    for (const country of oldOrigins) {
      const { data: tree } = await supabase.from('origin_trees').select().eq('user_id', userId).eq('country', country).maybeSingle();
      if (tree) {
        const newCount = Math.max(0, tree.count - fraction);
        if (newCount <= 0) {
          await supabase.from('origin_trees').delete().eq('id', tree.id);
        } else {
          await supabase.from('origin_trees').update({ count: newCount, level: calcLevel(newCount) }).eq('id', tree.id);
        }
      }
    }
  }

  if (newOrigins.length > 0) {
    const fraction = 1 / newOrigins.length;
    for (const country of newOrigins) {
      const { data: tree } = await supabase.from('origin_trees').select().eq('user_id', userId).eq('country', country).maybeSingle();
      if (tree) {
        const newCount = tree.count + fraction;
        await supabase.from('origin_trees').update({ count: newCount, level: calcLevel(newCount) }).eq('id', tree.id);
      } else {
        await supabase.from('origin_trees').insert({ user_id: userId, country, count: fraction, level: calcLevel(fraction) });
      }
    }
  }
}

const ROAST_LEVELS = ['浅煎り', '中浅煎り', '中煎り', '中深煎り', '深煎り', '極深煎り'];
const BREW_METHODS = ['drip', 'espresso', 'latte', 'cappuccino', 'pour_over', 'french_press', 'aeropress', 'cold_brew', 'other'];
const JAPAN_PREFECTURES = ['北海道','青森','岩手','宮城','秋田','山形','福島','茨城','栃木','群馬','埼玉','千葉','東京','神奈川','新潟','富山','石川','福井','山梨','長野','静岡','愛知','三重','滋賀','京都','大阪','兵庫','奈良','和歌山','鳥取','島根','岡山','広島','山口','徳島','香川','愛媛','高知','福岡','佐賀','長崎','熊本','大分','宮崎','鹿児島','沖縄'];
const SCREEN_W = Dimensions.get('window').width;
const IMG_DISPLAY_W = SCREEN_W - 40;

export default function EditPostScreen({ route, navigation }) {
  const { post } = route.params;

  const [shopName, setShopName] = useState(post.shop_name ?? '');
  const [beanName, setBeanName] = useState(post.bean_name ?? '');
  const [origins, setOrigins] = useState(post.origin_country ? post.origin_country.split(',').map(s => s.trim()).filter(Boolean) : []);
  const [originInput, setOriginInput] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [roast, setRoast] = useState(post.roast_level ?? '中煎り');
  const [brew, setBrew] = useState(post.brew_method ?? 'drip');
  const [memo, setMemo] = useState(post.memo ?? '');
  const [ratings, setRatings] = useState({
    bitterness: post.ratings?.[0]?.bitterness ?? 5,
    acidity: post.ratings?.[0]?.acidity ?? 5,
    sweetness: post.ratings?.[0]?.sweetness ?? 5,
    body: post.ratings?.[0]?.body ?? 5,
    aroma: post.ratings?.[0]?.aroma ?? 5,
    aftertaste: post.ratings?.[0]?.aftertaste ?? 5,
  });
  const [score, setScore] = useState(post.ratings?.[0]?.score ?? null);
  const [prefecture, setPrefecture] = useState(post.prefecture ?? '');
  const [prefInput, setPrefInput] = useState('');
  const [prefSuggestions, setPrefSuggestions] = useState([]);
  const [photoUrl, setPhotoUrl] = useState(post.photo_url ?? null);
  const [newImage, setNewImage] = useState(null); // { uri, base64, ext, width, height }
  const [ocrBlocks, setOcrBlocks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [ocrModalVisible, setOcrModalVisible] = useState(false);
  const [photoPreviewVisible, setPhotoPreviewVisible] = useState(false);
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const [selectedIndices, setSelectedIndices] = useState(new Set());
  const [multiSelectMode, setMultiSelectMode] = useState(false);

  const displayUri = newImage?.uri ?? photoUrl;
  const hasPhoto = !!displayUri;

  async function pickImage() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('カメラロールへのアクセスを許可してください'); return; }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 5],
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      const ext = asset.uri.split('.').pop().toLowerCase();
      setNewImage({ uri: asset.uri, base64: asset.base64, ext, width: asset.width, height: asset.height });
      analyzeImage(asset.uri);
    }
  }

  async function analyzeImage(uri) {
    try {
      setLoading(true);
      const result = await TextRecognition.recognize(uri, TextRecognitionScript.JAPANESE);
      const lines = (result.blocks ?? []).flatMap(b => b.lines ?? []);
      setOcrBlocks(lines);
      const detected = normalizeCountry(result.text);
      if (detected) setOrigins(prev => prev.includes(detected) ? prev : [...prev, detected]);
    } catch (e) {
      console.log('OCR error:', e.message);
    } finally {
      setLoading(false);
    }
  }

  function applyText(text) {
    Alert.alert(text, null, [
      { text: 'お店の名前として使う', onPress: () => { setShopName(text); closeOcrModal(); } },
      { text: '豆の名前として使う', onPress: () => { setBeanName(text); closeOcrModal(); } },
      {
        text: '国として使う', onPress: () => {
          const c = normalizeCountry(text);
          if (c) setOrigins(prev => prev.includes(c) ? prev : [...prev, c]);
          closeOcrModal();
        },
      },
      { text: 'キャンセル', style: 'cancel' },
    ]);
  }

  function closeOcrModal() {
    setOcrModalVisible(false);
    setSelectedIndices(new Set());
    setMultiSelectMode(false);
  }

  function onBlockTap(i) {
    if (multiSelectMode) {
      setSelectedIndices(prev => {
        const next = new Set(prev);
        if (next.has(i)) next.delete(i); else next.add(i);
        return next;
      });
    } else {
      applyText(ocrBlocks[i].text);
    }
  }

  function onBlockLongPress(i) {
    setMultiSelectMode(true);
    setSelectedIndices(new Set([i]));
  }

  function confirmMultiSelect() {
    const sorted = [...selectedIndices].sort((a, b) => {
      const fa = ocrBlocks[a].frame, fb = ocrBlocks[b].frame;
      return fa.top !== fb.top ? fa.top - fb.top : fa.left - fb.left;
    });
    applyText(sorted.map(i => ocrBlocks[i].text).join(' '));
  }

  function decode(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes.buffer;
  }

  async function uploadNewImage(userId) {
    if (!newImage) return photoUrl;
    const path = `${userId}/${Date.now()}.${newImage.ext}`;
    const contentType = newImage.ext === 'png' ? 'image/png' : 'image/jpeg';
    const { error } = await supabase.storage.from('posts').upload(path, decode(newImage.base64), { contentType });
    if (error) throw error;
    const { data } = supabase.storage.from('posts').getPublicUrl(path);
    return data.publicUrl;
  }

  async function handleSave() {
    if (!shopName.trim()) { Alert.alert('お店の名前を入力してください'); return; }
    if (origins.length === 0) { Alert.alert('国を1つ以上入力してください'); return; }

    setLoading(true);
    let saved = false;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const newPhotoUrl = await uploadNewImage(user.id);
      const shopNameChanged = shopName.trim() !== (post.shop_name ?? '');

      const { error: postError } = await supabase
        .from('posts')
        .update({
          shop_name: shopName,
          bean_name: beanName,
          origin_country: origins.join(','),
          roast_level: roast,
          brew_method: brew,
          memo,
          photo_url: newPhotoUrl,
          prefecture: prefecture || null,
          ...(shopNameChanged ? { lat: null, lng: null, place_id: null } : {}),
        })
        .eq('id', post.id);

      if (postError) throw postError;

      const ratingId = post.ratings?.[0]?.id;
      if (ratingId) {
        await supabase.from('ratings').update({ ...ratings, score }).eq('id', ratingId);
      } else {
        await supabase.from('ratings').insert({ post_id: post.id, ...ratings, score });
      }

      await syncOriginTrees(user.id, post.origin_country ?? '', origins.join(','));
      saved = true;
    } catch (e) {
      Alert.alert('エラー', e.message);
    } finally {
      setLoading(false);
    }
    if (saved) {
      Alert.alert('更新しました');
      navigation.goBack();
    }
  }

  async function handleDelete() {
    Alert.alert('削除しますか？', 'この投稿を削除します。取り消せません。', [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: '削除', style: 'destructive', onPress: async () => {
          setLoading(true);
          try {
            const { data: { user } } = await supabase.auth.getUser();
            const { error } = await supabase.from('posts').delete().eq('id', post.id);
            if (error) throw error;
            await syncOriginTrees(user.id, post.origin_country ?? '', '');
            navigation.goBack();
          } catch (e) {
            Alert.alert('エラー', e.message);
            setLoading(false);
          }
        }
      },
    ]);
  }

  function scaledFrame(frame, imgW, imgH, displayW) {
    const scale = displayW / imgW;
    return {
      left: frame.left * scale,
      top: frame.top * scale,
      width: frame.width * scale,
      height: frame.height * scale,
    };
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} scrollEnabled={scrollEnabled}>

      <TouchableOpacity style={styles.imagePicker} onPress={hasPhoto ? () => setPhotoPreviewVisible(true) : pickImage}>
        {hasPhoto ? (
          <>
            <Image source={{ uri: displayUri }} style={styles.imagePreview} />
            {loading && <View style={styles.imageOverlay}><Text style={styles.imageOverlayText}>解析中...</Text></View>}
          </>
        ) : (
          <Text style={styles.imagePickerText}>写真を追加</Text>
        )}
      </TouchableOpacity>

      {hasPhoto && (
        <View style={styles.imageActions}>
          <TouchableOpacity onPress={pickImage}>
            <Text style={styles.changeImageText}>写真を変更</Text>
          </TouchableOpacity>
          {ocrBlocks.length > 0 && (
            <TouchableOpacity onPress={() => setOcrModalVisible(true)}>
              <Text style={styles.ocrBtnText}>テキスト選択</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <Modal visible={photoPreviewVisible} animationType="fade" onRequestClose={() => setPhotoPreviewVisible(false)}>
        <View style={styles.photoPreviewContainer}>
          <Image source={{ uri: displayUri }} style={styles.photoPreviewImage} resizeMode="contain" />
          <TouchableOpacity style={styles.photoPreviewClose} onPress={() => setPhotoPreviewVisible(false)}>
            <Text style={styles.photoPreviewCloseText}>✕</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      <Modal visible={ocrModalVisible} animationType="slide" onRequestClose={closeOcrModal}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalHint}>
            {multiSelectMode ? `${selectedIndices.size}行選択中 — タップで追加/解除` : '長押しで複数行選択、タップで単独選択'}
          </Text>
          {newImage && (
            <View style={{ width: IMG_DISPLAY_W, height: IMG_DISPLAY_W * (newImage.height / newImage.width), position: 'relative' }}>
              <Image source={{ uri: newImage.uri }} style={{ width: '100%', height: '100%' }} />
              {ocrBlocks.map((block, i) => {
                const { left, top, width, height } = scaledFrame(block.frame, newImage.width, newImage.height, IMG_DISPLAY_W);
                const selected = selectedIndices.has(i);
                return (
                  <TouchableOpacity
                    key={i}
                    style={[styles.ocrBlock, { left, top, width, height }, selected && styles.ocrBlockSelected]}
                    onPress={() => onBlockTap(i)}
                    onLongPress={() => onBlockLongPress(i)}
                    delayLongPress={400}
                  >
                    <Text style={[styles.ocrBlockText, selected && styles.ocrBlockTextSelected]} numberOfLines={1}>{block.text}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
          <View style={styles.modalActions}>
            {multiSelectMode && selectedIndices.size > 0 && (
              <TouchableOpacity style={styles.modalConfirm} onPress={confirmMultiSelect}>
                <Text style={styles.modalConfirmText}>選択した行を使う</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.modalClose} onPress={closeOcrModal}>
              <Text style={styles.modalCloseText}>閉じる</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Input label="お店の名前" value={shopName} onChangeText={setShopName} placeholder="例：Blue Bottle Coffee" />

      <View style={{ marginBottom: 16 }}>
        <Text style={styles.label}>都道府県（任意）</Text>
        {prefecture ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            <View style={styles.originTag}>
              <Text style={styles.originTagText}>{prefecture}</Text>
              <TouchableOpacity onPress={() => setPrefecture('')}>
                <Text style={styles.originTagRemove}>×</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <>
            <TextInput
              style={styles.input}
              value={prefInput}
              onChangeText={v => {
                setPrefInput(v);
                setPrefSuggestions(v.length >= 1 ? JAPAN_PREFECTURES.filter(p => p.includes(v)).slice(0, 5) : []);
              }}
              placeholder="例：東京"
              returnKeyType="done"
              onSubmitEditing={() => {
                const match = JAPAN_PREFECTURES.find(p => p === prefInput || p.startsWith(prefInput));
                if (match) { setPrefecture(match); setPrefInput(''); setPrefSuggestions([]); }
              }}
            />
            {prefSuggestions.length > 0 && (
              <View style={styles.suggestList}>
                {prefSuggestions.map(p => (
                  <TouchableOpacity key={p} style={styles.suggestItem} onPress={() => { setPrefecture(p); setPrefInput(''); setPrefSuggestions([]); }}>
                    <Text style={styles.suggestJa}>{p}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </>
        )}
      </View>

      <Text style={styles.label}>国 <Text style={styles.required}>（必須1つ以上）</Text></Text>
      {origins.length > 0 && (
        <View style={styles.row}>
          {origins.map((o, i) => (
            <View key={i} style={styles.originTag}>
              <Text style={styles.originTagText}>{COUNTRIES.find(c => c.en === o)?.ja ?? o}</Text>
              <TouchableOpacity onPress={() => setOrigins(prev => prev.filter((_, idx) => idx !== i))}>
                <Text style={styles.originTagRemove}>×</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
      <View style={styles.originInputRow}>
        <TextInput
          style={[styles.input, { flex: 1 }]}
          value={originInput}
          onChangeText={v => {
            setOriginInput(v);
            if (v.trim().length >= 1) {
              const q = v.trim().toLowerCase();
              setSuggestions(COUNTRIES.filter(c => c.ja.includes(v.trim()) || c.en.toLowerCase().includes(q)).slice(0, 5));
            } else {
              setSuggestions([]);
            }
          }}
          placeholder="例：エチオピア"
          returnKeyType="done"
          onSubmitEditing={() => {
            const c = normalizeCountry(originInput.trim());
            if (c) { setOrigins(prev => prev.includes(c) ? prev : [...prev, c]); setOriginInput(''); setSuggestions([]); }
          }}
        />
        <TouchableOpacity
          style={styles.originAddBtn}
          onPress={() => {
            const c = normalizeCountry(originInput.trim());
            if (c) { setOrigins(prev => prev.includes(c) ? prev : [...prev, c]); setOriginInput(''); setSuggestions([]); }
          }}
        >
          <Text style={styles.originAddBtnText}>+</Text>
        </TouchableOpacity>
      </View>
      {suggestions.length > 0 && (
        <View style={styles.suggestList}>
          {suggestions.map(c => (
            <TouchableOpacity
              key={c.en}
              style={styles.suggestItem}
              onPress={() => {
                setOrigins(prev => prev.includes(c.en) ? prev : [...prev, c.en]);
                setOriginInput('');
                setSuggestions([]);
              }}
            >
              <Text style={styles.suggestJa}>{c.ja}</Text>
              <Text style={styles.suggestEn}>{c.en}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <Input label="豆の名前" value={beanName} onChangeText={setBeanName} placeholder="例：エチオピア イルガチェフェ" />

      <Text style={styles.label}>焙煎度</Text>
      <View style={styles.row}>
        {ROAST_LEVELS.map(r => (
          <TouchableOpacity key={r} style={[styles.chip, roast === r && styles.chipActive]} onPress={() => setRoast(r)}>
            <Text style={[styles.chipText, roast === r && styles.chipTextActive]}>{r}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>抽出方法</Text>
      <View style={styles.row}>
        {BREW_METHODS.map(b => (
          <TouchableOpacity key={b} style={[styles.chip, brew === b && styles.chipActive]} onPress={() => setBrew(b)}>
            <Text style={[styles.chipText, brew === b && styles.chipTextActive]}>{b}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>評価（チャートをなぞって入力）</Text>
      <View style={styles.radarContainer}>
        <RadarChart
          ratings={ratings}
          onChange={(key, value) => setRatings(r => ({ ...r, [key]: value }))}
          onTouchStart={() => setScrollEnabled(false)}
          onTouchEnd={() => setScrollEnabled(true)}
        />
      </View>

      <Text style={styles.label}>総合スコア</Text>
      <ScoreSlider value={score ?? 0} onChange={setScore} />

      <Input label="メモ" value={memo} onChangeText={setMemo} placeholder="感想など..." multiline />

      <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={handleSave} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? '更新中...' : '保存する'}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete} disabled={loading}>
        <Text style={styles.deleteBtnText}>この投稿を削除</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function Input({ label, ...props }) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput style={[styles.input, props.multiline && { height: 80 }]} {...props} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAF8' },
  content: { padding: 20, paddingBottom: 60 },
  label: { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 6 },
  required: { fontSize: 11, fontWeight: '400', color: '#999' },
  imagePicker: {
    height: (SCREEN_W - 40) * 1.25, borderRadius: 12, borderWidth: 1.5, borderColor: '#DDD',
    borderStyle: 'dashed', backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
    overflow: 'hidden',
  },
  imagePreview: { width: '100%', height: '100%' },
  imagePickerText: { color: '#999', fontSize: 14 },
  imageOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(0,0,0,0.45)', paddingVertical: 6, alignItems: 'center',
  },
  imageOverlayText: { color: '#fff', fontSize: 12 },
  imageActions: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  changeImageText: { fontSize: 12, color: '#6B4226' },
  ocrBtnText: { fontSize: 12, color: '#4A7C59' },
  photoPreviewContainer: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  photoPreviewImage: { width: '100%', height: '100%' },
  photoPreviewClose: { position: 'absolute', top: 56, right: 20, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 20, width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
  photoPreviewCloseText: { color: '#fff', fontSize: 16 },
  originInputRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  originAddBtn: { backgroundColor: '#6B4226', borderRadius: 10, paddingHorizontal: 16, justifyContent: 'center' },
  originAddBtnText: { color: '#fff', fontSize: 20, fontWeight: '700' },
  originTag: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#6B4226', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 },
  originTagText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  originTagRemove: { color: 'rgba(255,255,255,0.7)', fontSize: 16, lineHeight: 18 },
  suggestList: { backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: '#E8E8E8', marginTop: -8, marginBottom: 12, overflow: 'hidden' },
  suggestItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  suggestJa: { fontSize: 14, color: '#1A1A1A', fontWeight: '600' },
  suggestEn: { fontSize: 12, color: '#999' },
  input: { backgroundColor: '#fff', borderRadius: 10, padding: 12, fontSize: 15, borderWidth: 1, borderColor: '#E8E8E8' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#DDD', backgroundColor: '#fff' },
  chipActive: { backgroundColor: '#6B4226', borderColor: '#6B4226' },
  chipText: { fontSize: 12, color: '#666' },
  chipTextActive: { color: '#fff' },
  radarContainer: { alignItems: 'center', marginBottom: 8 },
  button: { backgroundColor: '#6B4226', borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 24 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  deleteBtn: { marginTop: 16, alignItems: 'center', padding: 12 },
  deleteBtnText: { fontSize: 14, color: '#E53E3E' },
  modalContainer: { flex: 1, backgroundColor: '#111', alignItems: 'center', justifyContent: 'center', padding: 20 },
  modalHint: { color: '#ccc', fontSize: 13, marginBottom: 12 },
  ocrBlock: { position: 'absolute', borderWidth: 1.5, borderColor: '#FFD700', backgroundColor: 'rgba(255,215,0,0.15)', borderRadius: 3, justifyContent: 'center', paddingHorizontal: 2 },
  ocrBlockText: { color: '#FFD700', fontSize: 10, fontWeight: '600' },
  ocrBlockSelected: { borderColor: '#00CFFF', backgroundColor: 'rgba(0,207,255,0.25)' },
  ocrBlockTextSelected: { color: '#00CFFF' },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 20 },
  modalConfirm: { backgroundColor: '#4A7C59', borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 },
  modalConfirmText: { color: '#fff', fontWeight: '700' },
  modalClose: { backgroundColor: '#6B4226', borderRadius: 12, paddingHorizontal: 32, paddingVertical: 12 },
  modalCloseText: { color: '#fff', fontWeight: '700' },
});
