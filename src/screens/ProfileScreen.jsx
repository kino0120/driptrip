import { View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useEffect, useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import WorldMap from '../components/WorldMap';
import JapanMap from '../components/JapanMap';

const PAGE_SIZE = 10;

function PostCard({ item, tab, navigation }) {
  const isLikeTab = tab === 'likes';
  const p = isLikeTab ? item.posts : item;
  const r = p?.ratings?.[0];
  const score = r?.score;
  const username = p?.users?.display_name ?? p?.users?.username;
  const origin = p?.origin_country?.replace(/,/g, ' · ');

  const card = (
    <View style={styles.postCard}>
      <View style={styles.postCardHeader}>
        <Text style={styles.userLabel}>{username}</Text>
        {!isLikeTab && <Text style={styles.editHint}>編集 ›</Text>}
        {score != null && (
          <View style={styles.scoreBadge}>
            <Text style={styles.scoreValue}>{Number(score).toFixed(1)}</Text>
            <Text style={styles.scoreMax}>/5</Text>
          </View>
        )}
      </View>
      <Text style={styles.shopName}>{p?.shop_name}</Text>
      {p?.bean_name ? <Text style={styles.beanName}>{p.bean_name}</Text> : null}
      {origin ? <Text style={styles.origin}>{origin}</Text> : null}
      {p?.roast_level ? <Text style={styles.roast}>{p.roast_level}</Text> : null}
      {p?.memo ? <Text style={styles.memo}>{p.memo}</Text> : null}
    </View>
  );

  if (!isLikeTab) {
    return (
      <TouchableOpacity onPress={() => navigation.navigate('EditPost', { post: item })} activeOpacity={0.8}>
        {card}
      </TouchableOpacity>
    );
  }
  return card;
}

export default function ProfileScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [trees, setTrees] = useState([]);
  const [posts, setPosts] = useState([]);
  const [likedPosts, setLikedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('posts');
  const [page, setPage] = useState(0);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setUser(null);
        setProfile(null);
        setPosts([]);
        setLikedPosts([]);
        setTrees([]);
        setLoading(false);
      } else {
        load();
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [])
  );

  async function load() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setUser(null); setProfile(null); setPosts([]); setLikedPosts([]); setTrees([]); setLoading(false); return; }
      setUser(user);

      const [{ data: prof }, { data: treesData }, { data: postsData }, { data: likesData }] = await Promise.all([
        supabase.from('users').select().eq('id', user.id).single(),
        supabase.from('origin_trees').select().eq('user_id', user.id).order('count', { ascending: false }),
        supabase.from('posts').select('*, ratings(*), users(display_name, username)').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('likes').select('post_id, posts(shop_name, bean_name, origin_country, roast_level, memo, users(display_name, username), ratings(score))').eq('user_id', user.id).order('created_at', { ascending: false }),
      ]);

      setProfile(prof);
      setTrees(treesData ?? []);
      setPosts(postsData ?? []);
      setLikedPosts(likesData ?? []);
    } catch (e) {
      console.error('ProfileScreen load error:', e);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#6B4226" /></View>;

  if (!user) {
    return (
      <View style={styles.center}>
        <Text style={styles.loginText}>ログインしてプロフィールを見る</Text>
        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Login')}>
          <Text style={styles.buttonText}>ログイン</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const allData = tab === 'posts' ? posts : likedPosts;
  const totalPages = Math.ceil(allData.length / PAGE_SIZE);
  const currentData = allData.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  function switchTab(t) { setTab(t); setPage(0); }

  const avatarChar = (profile?.display_name || profile?.username || user?.email || '?')[0]?.toUpperCase() ?? '?';

  async function handleSignOut() {
    await supabase.auth.signOut();
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.avatar}><Text style={styles.avatarText}>{avatarChar}</Text></View>
        <Text style={styles.name}>{profile?.display_name ?? profile?.username ?? user?.email}</Text>
        <Text style={styles.postCount}>
          {posts.length} 杯 / {new Set(posts.map(p => `${p.shop_name}|${p.origin_country}|${p.roast_level}`)).size} 種類
        </Text>
        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
          <Text style={styles.signOutText}>ログアウト</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>行ったお店</Text>
      <JapanMap posts={posts} />

      <Text style={styles.sectionTitle}>産地ツリー</Text>
      <WorldMap trees={trees} />

      <View style={styles.tabRow}>
        <TouchableOpacity style={[styles.tabBtn, tab === 'posts' && styles.tabBtnActive]} onPress={() => switchTab('posts')}>
          <Text style={[styles.tabText, tab === 'posts' && styles.tabTextActive]}>投稿履歴</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tabBtn, tab === 'likes' && styles.tabBtnActive]} onPress={() => switchTab('likes')}>
          <Text style={[styles.tabText, tab === 'likes' && styles.tabTextActive]}>♥ いいね</Text>
        </TouchableOpacity>
      </View>

      {currentData.map((item, i) => (
        <PostCard
          key={item.id ?? item.post_id ?? String(i)}
          item={item}
          tab={tab}
          navigation={navigation}
        />
      ))}

      {totalPages > 1 && (
        <View style={styles.pagination}>
          <TouchableOpacity onPress={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} style={[styles.pageBtn, page === 0 && styles.pageBtnDisabled]}>
            <Text style={styles.pageBtnText}>‹ 前</Text>
          </TouchableOpacity>
          <Text style={styles.pageInfo}>{page + 1} / {totalPages}</Text>
          <TouchableOpacity onPress={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page === totalPages - 1} style={[styles.pageBtn, page === totalPages - 1 && styles.pageBtnDisabled]}>
            <Text style={styles.pageBtnText}>次 ›</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAF8' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
  content: { paddingBottom: 40 },
  header: { alignItems: 'center', padding: 32, paddingBottom: 24 },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#6B4226', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  avatarText: { color: '#fff', fontSize: 28, fontWeight: '700' },
  name: { fontSize: 20, fontWeight: '700', color: '#1A1A1A' },
  postCount: { fontSize: 14, color: '#999', marginTop: 4 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1A1A1A', paddingHorizontal: 16, marginBottom: 12, marginTop: 8 },
  tabRow: { flexDirection: 'row', marginHorizontal: 16, marginTop: 16, marginBottom: 4, gap: 8 },
  tabBtn: { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center', backgroundColor: '#F0EDE9' },
  tabBtnActive: { backgroundColor: '#6B4226' },
  tabText: { fontSize: 14, fontWeight: '600', color: '#888' },
  tabTextActive: { color: '#fff' },
  postCard: { backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 8, borderRadius: 10, padding: 14, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4 },
  postCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  userLabel: { fontSize: 12, color: '#999', flex: 1 },
  shopName: { fontSize: 15, fontWeight: '700', color: '#1A1A1A' },
  editHint: { fontSize: 12, color: '#6B4226', fontWeight: '600', marginRight: 8 },
  scoreBadge: { flexDirection: 'row', alignItems: 'baseline', backgroundColor: '#6B4226', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  scoreValue: { fontSize: 15, fontWeight: '800', color: '#fff' },
  scoreMax: { fontSize: 10, color: 'rgba(255,255,255,0.7)', marginLeft: 2 },
  beanName: { fontSize: 13, color: '#6B4226', marginTop: 2 },
  origin: { fontSize: 12, color: '#888', marginTop: 2 },
  roast: { fontSize: 12, color: '#888', marginTop: 2 },
  memo: { fontSize: 12, color: '#888', marginTop: 4 },
  pagination: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 16, paddingVertical: 16 },
  pageBtn: { backgroundColor: '#6B4226', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 8 },
  pageBtnDisabled: { backgroundColor: '#DDD' },
  pageBtnText: { color: '#fff', fontWeight: '700' },
  pageInfo: { fontSize: 14, color: '#555' },
  signOutBtn: { marginTop: 12, paddingHorizontal: 20, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#CCC' },
  signOutText: { fontSize: 13, color: '#999' },
  loginText: { fontSize: 16, color: '#555' },
  button: { backgroundColor: '#6B4226', paddingHorizontal: 32, paddingVertical: 12, borderRadius: 12 },
  buttonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
