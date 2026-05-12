import { View, Text, FlatList, StyleSheet, ActivityIndicator, Image, Dimensions, TouchableOpacity, Linking, Modal, ScrollView, useWindowDimensions } from 'react-native';
import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import RadarChart from '../components/RadarChart';

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

    // 楽観的更新
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

function openAmazonSearch(post) {
  // アフィリエイトタグ取得後、URLの末尾に &tag=YOUR_TAG を追加してください
  const keyword = post.bean_name || post.origin_country?.split(',')[0] || 'コーヒー豆';
  const query = encodeURIComponent(`${keyword} コーヒー豆`);
  Linking.openURL(`https://www.amazon.co.jp/s?k=${query}`);
}

function PostCard({ post, currentUserId, onLike }) {
  const [photoModalVisible, setPhotoModalVisible] = useState(false);
  const { width: screenW, height: screenH } = useWindowDimensions();
  const r = post.ratings?.[0];
  const hasRatings = r && Object.values(r).some(v => v != null);
  const score = r?.score;
  const likesCount = post.likes?.length ?? 0;
  const isLiked = post.likes?.some(l => l.user_id === currentUserId);
  const hasSearchTarget = !!(post.bean_name || post.origin_country);

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.user}>{post.users?.display_name ?? post.users?.username}</Text>
        <View style={styles.scoreBadge}>
          <Text style={styles.scoreValue}>{Number(score ?? 0).toFixed(1)}</Text>
          <Text style={styles.scoreMax}>/5</Text>
        </View>
      </View>
      <View style={styles.row}>
        {post.photo_url && (
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
        )}
        <View style={[styles.info, !post.photo_url && { flex: 1 }]}>
          <Text style={styles.shopName}>{post.shop_name}</Text>
          {post.bean_name ? <Text style={styles.beanName}>{post.bean_name}</Text> : null}
          {post.origin_country ? <Text style={styles.meta}>{post.origin_country.replace(/,/g, ' · ')}</Text> : null}
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
          {post.memo ? <Text style={styles.memo} numberOfLines={2}>{post.memo}</Text> : null}
        </View>
      </View>
      <View style={styles.cardFooter}>
        <TouchableOpacity style={styles.likeBtn} onPress={onLike} activeOpacity={0.7}>
          <Text style={[styles.likeIcon, isLiked && styles.likeIconActive]}>
            {isLiked ? '♥' : '♡'}
          </Text>
          {likesCount > 0 && <Text style={[styles.likeCount, isLiked && styles.likeCountActive]}>{likesCount}</Text>}
        </TouchableOpacity>
        {false && hasSearchTarget && (
          <TouchableOpacity style={styles.amazonBtn} onPress={() => openAmazonSearch(post)} activeOpacity={0.75}>
            <Text style={styles.amazonBtnText}>この豆を探す →</Text>
          </TouchableOpacity>
        )}
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
  user: { fontSize: 12, color: '#999' },
  scoreBadge: { flexDirection: 'row', alignItems: 'baseline', backgroundColor: '#6B4226', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 },
  scoreValue: { fontSize: 18, fontWeight: '800', color: '#fff' },
  scoreMax: { fontSize: 11, color: 'rgba(255,255,255,0.7)', marginLeft: 2 },
  row: { flexDirection: 'row', paddingBottom: 16 },
  photo: { width: 110, height: 110 * 1.25, borderRadius: 8, marginLeft: 16 },
  info: { flex: 1, paddingHorizontal: 12 },
  shopName: { fontSize: 16, fontWeight: '700', color: '#1A1A1A' },
  beanName: { fontSize: 14, color: '#6B4226', marginTop: 2 },
  meta: { fontSize: 13, color: '#888', marginTop: 4 },
  memo: { fontSize: 13, color: '#555', marginTop: 8 },
  radarWrap: { alignItems: 'center', marginTop: 8 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 12, borderTopWidth: 1, borderTopColor: '#F5F5F5', paddingTop: 8 },
  likeBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  likeIcon: { fontSize: 22, color: '#CCC' },
  likeIconActive: { color: '#E05C5C' },
  likeCount: { fontSize: 14, color: '#999' },
  likeCountActive: { color: '#E05C5C' },
  amazonBtn: { marginLeft: 'auto', backgroundColor: '#FF9900', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 5 },
  amazonBtnText: { fontSize: 11, fontWeight: '700', color: '#fff' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)' },
  modalCloseBtn: { position: 'absolute', top: 54, right: 20, zIndex: 10, padding: 10, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20 },
  modalCloseText: { color: '#fff', fontSize: 20, lineHeight: 22 },
});
