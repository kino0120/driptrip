import { View, Text, FlatList, StyleSheet, ActivityIndicator, Image, Dimensions, TouchableOpacity, Linking, Alert, Modal, ScrollView, useWindowDimensions } from 'react-native';
import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import RadarChart from '../components/RadarChart';
import { COUNTRIES } from '../lib/countries';

function toJa(en) {
  return COUNTRIES.find(c => c.en === en)?.ja ?? en;
}

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return 'たった今';
  if (diff < 3600) return `${Math.floor(diff / 60)}分前`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}時間前`;
  if (diff < 7 * 86400) return `${Math.floor(diff / 86400)}日前`;
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

function openInMaps(post) {
  let url;
  if (post?.place_id) {
    url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(post.shop_name ?? '')}&query_place_id=${post.place_id}`;
  } else if (post?.lat && post?.lng) {
    url = `https://maps.google.com/?q=${encodeURIComponent(post.shop_name ?? '')}&ll=${post.lat},${post.lng}`;
  } else if (post?.shop_name) {
    url = `https://maps.google.com/?q=${encodeURIComponent(post.shop_name)}`;
  } else {
    Alert.alert('場所情報がありません');
    return;
  }
  Linking.openURL(url).catch(() => Alert.alert('Google Mapsを開けませんでした'));
}

function extractCityArea(address) {
  if (!address) return null;
  const stripped = address.replace(/^.+?[都道府県]/, '');
  const match = stripped.match(/^.+?[市区郡]/);
  return match ? match[0] : (stripped || null);
}

function ScoreBadge({ score }) {
  return (
    <View style={styles.scoreBadge}>
      <Text style={styles.scoreValue}>{Number(score ?? 0).toFixed(1)}</Text>
      <Text style={styles.scoreMax}>/5</Text>
    </View>
  );
}

export default function FeedScreen() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);

  useFocusEffect(
    useCallback(() => {
      fetchPosts();
    }, [])
  );

  async function fetchPosts() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id ?? null);

      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          users(username, display_name, avatar_url),
          ratings(bitterness, acidity, sweetness, body, aroma, aftertaste, score),
          likes(user_id)
        `)
        .eq('is_public', true)
        .order('created_at', { ascending: false });

      if (!error) setPosts(data ?? []);
    } catch (e) {
      console.error('fetchPosts error:', e);
    } finally {
      setLoading(false);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    await fetchPosts();
    setRefreshing(false);
  }

  async function toggleLike(post) {
    if (!currentUserId) return;
    const isLiked = post.likes?.some(l => l.user_id === currentUserId);

    setPosts(prev => prev.map(p => {
      if (p.id !== post.id) return p;
      const newLikes = isLiked
        ? (p.likes ?? []).filter(l => l.user_id !== currentUserId)
        : [...(p.likes ?? []), { user_id: currentUserId }];
      return { ...p, likes: newLikes };
    }));

    if (isLiked) {
      await supabase.from('likes').delete().eq('post_id', post.id).eq('user_id', currentUserId);
    } else {
      await supabase.from('likes').insert({ post_id: post.id, user_id: currentUserId });
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6B4226" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <PostCard
            post={item}
            currentUserId={currentUserId}
            onLike={() => toggleLike(item)}
          />
        )}
        contentContainerStyle={styles.list}
        refreshing={refreshing}
        onRefresh={handleRefresh}
      />
    </View>
  );
}

const CARD_W = Dimensions.get('window').width - 32;

function PostCard({ post, currentUserId, onLike }) {
  const [pageIndex, setPageIndex] = useState(0);
  const [photoModalVisible, setPhotoModalVisible] = useState(false);
  const { width: screenW, height: screenH } = useWindowDimensions();
  const r = post.ratings?.[0];
  const hasRatings = r && Object.values(r).some(v => v != null);
  const score = r?.score;
  const likesCount = post.likes?.length ?? 0;
  const isLiked = post.likes?.some(l => l.user_id === currentUserId);
  const hasLocation = !!(post.place_id || post.lat || post.shop_name);
  const cityArea = extractCityArea(post.address) ?? post.prefecture ?? null;

  return (
    <View style={styles.card}>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={e =>
          setPageIndex(Math.round(e.nativeEvent.contentOffset.x / CARD_W))
        }
      >
        {/* Page 1: 店情報 */}
        <View style={{ width: CARD_W }}>
          <View style={styles.cardHeader}>
            <View style={styles.userRow}>
              <Text style={styles.user}>{post.users?.display_name ?? post.users?.username}</Text>
              <Text style={styles.timestamp}>{timeAgo(post.created_at)}</Text>
            </View>
            <ScoreBadge score={score} />
          </View>
          <View style={styles.row}>
            {post.photo_url ? (
              <>
                <TouchableOpacity onPress={() => setPhotoModalVisible(true)} activeOpacity={0.9}>
                  <Image source={{ uri: post.photo_url }} style={styles.photo} resizeMode="cover" />
                </TouchableOpacity>
                <Modal
                  visible={photoModalVisible}
                  transparent
                  animationType="fade"
                  onRequestClose={() => setPhotoModalVisible(false)}
                >
                  <View style={styles.modalBackdrop}>
                    <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setPhotoModalVisible(false)}>
                      <Text style={styles.modalCloseText}>✕</Text>
                    </TouchableOpacity>
                    <ScrollView
                      style={{ flex: 1 }}
                      contentContainerStyle={{ justifyContent: 'center', alignItems: 'center', width: screenW, height: screenH }}
                      maximumZoomScale={5}
                      minimumZoomScale={1}
                      showsHorizontalScrollIndicator={false}
                      showsVerticalScrollIndicator={false}
                      centerContent
                    >
                      <Image source={{ uri: post.photo_url }} style={{ width: screenW, height: screenH }} resizeMode="contain" />
                    </ScrollView>
                  </View>
                </Modal>
              </>
            ) : null}
            <View style={[styles.info, !post.photo_url && { flex: 1 }]}>
              <Text style={styles.shopName}>{post.shop_name}</Text>
              {cityArea ? (
                <View style={styles.locationRow}>
                  <Text style={styles.address}>{cityArea}</Text>
                  {hasLocation && (
                    <TouchableOpacity onPress={() => openInMaps(post)} activeOpacity={0.75}>
                      <Text style={styles.mapsInline}>Maps →</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ) : hasLocation ? (
                <TouchableOpacity onPress={() => openInMaps(post)} activeOpacity={0.75} style={{ marginTop: 4 }}>
                  <Text style={styles.mapsInline}>Maps →</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        </View>

        {/* Page 2: コーヒー情報 */}
        <View style={[{ width: CARD_W }]}>
          <View style={styles.page2Header}>
            <ScoreBadge score={score} />
          </View>
          <View style={styles.page2Body}>
            <View style={styles.beanRow}>
              {post.bean_name ? <Text style={styles.beanName}>{post.bean_name}</Text> : null}
              {post.roast_level ? <Text style={styles.roastBadge}>{post.roast_level}</Text> : null}
            </View>
            {post.origin_country ? (
              <Text style={styles.meta}>
                {post.origin_country.split(',').map(en => toJa(en)).join(' · ')}
              </Text>
            ) : null}
            {hasRatings && (
              <View style={styles.radarWrap}>
                <RadarChart
                  size={120}
                  ratings={{
                    bitterness: r.bitterness ?? 5,
                    acidity: r.acidity ?? 5,
                    sweetness: r.sweetness ?? 5,
                    body: r.body ?? 5,
                    aroma: r.aroma ?? 5,
                    aftertaste: r.aftertaste ?? 5,
                  }}
                />
              </View>
            )}
            {post.memo ? (
              <View style={styles.memoSection}>
                <Text style={styles.memoLabel}>感想</Text>
                <Text style={styles.memo}>{post.memo}</Text>
              </View>
            ) : null}
          </View>
        </View>
      </ScrollView>

      {/* ページインジケーター */}
      <View style={styles.dots}>
        <View style={[styles.dot, pageIndex === 0 && styles.dotActive]} />
        <View style={[styles.dot, pageIndex === 1 && styles.dotActive]} />
      </View>

      <View style={styles.cardFooter}>
        <TouchableOpacity style={styles.likeBtn} onPress={onLike} activeOpacity={0.7}>
          <Text style={[styles.likeIcon, isLiked && styles.likeIconActive]}>
            {isLiked ? '♥' : '♡'}
          </Text>
          {likesCount > 0 && <Text style={[styles.likeCount, isLiked && styles.likeCountActive]}>{likesCount}</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAF8' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 16, gap: 16 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 14, paddingBottom: 8 },
  userRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  user: { fontSize: 12, color: '#999' },
  timestamp: { fontSize: 11, color: '#BBB' },
  scoreBadge: { flexDirection: 'row', alignItems: 'baseline', backgroundColor: '#6B4226', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 },
  scoreValue: { fontSize: 18, fontWeight: '800', color: '#fff' },
  scoreMax: { fontSize: 11, color: 'rgba(255,255,255,0.7)', marginLeft: 2 },
  row: { flexDirection: 'row' },
  photo: { width: 110, aspectRatio: 4 / 5, borderRadius: 8, marginLeft: 16 },
  info: { flex: 1, paddingHorizontal: 12, paddingBottom: 12 },
  shopName: { fontSize: 16, fontWeight: '700', color: '#1A1A1A' },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  address: { fontSize: 12, color: '#999' },
  mapsInline: { fontSize: 12, fontWeight: '700', color: '#2E7D46' },
  page2Header: { flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 16, paddingTop: 14, paddingBottom: 8 },
  page2Body: { paddingHorizontal: 16, paddingBottom: 12 },
  beanRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  beanName: { fontSize: 16, fontWeight: '700', color: '#6B4226', flexShrink: 1, marginRight: 8 },
  roastBadge: { fontSize: 11, color: '#6B4226', borderWidth: 1, borderColor: '#C89B7B', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  meta: { fontSize: 13, color: '#888', marginTop: 2 },
  radarWrap: { alignItems: 'center', marginTop: 8 },
  memoSection: { marginTop: 10, borderTopWidth: 1, borderTopColor: '#F0EDE8', paddingTop: 8 },
  memoLabel: { fontSize: 11, fontWeight: '700', color: '#BBB', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 },
  memo: { fontSize: 14, color: '#555', lineHeight: 22 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, paddingBottom: 8 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#DDD' },
  dotActive: { backgroundColor: '#6B4226' },
  cardFooter: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 12, borderTopWidth: 1, borderTopColor: '#F5F5F5', paddingTop: 8 },
  likeBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  likeIcon: { fontSize: 22, color: '#CCC' },
  likeIconActive: { color: '#E05C5C' },
  likeCount: { fontSize: 14, color: '#999' },
  likeCountActive: { color: '#E05C5C' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)' },
  modalCloseBtn: { position: 'absolute', top: 54, right: 20, zIndex: 10, padding: 10, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20 },
  modalCloseText: { color: '#fff', fontSize: 20, lineHeight: 22 },
});
