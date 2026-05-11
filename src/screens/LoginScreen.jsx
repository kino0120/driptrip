import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleAuth() {
    setLoading(true);
    let shouldGoBack = false;
    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) { Alert.alert('エラー', error.message); return; }

        if (data.user) {
          await supabase.from('users').insert({ id: data.user.id, username });
          shouldGoBack = true;
        } else {
          Alert.alert('エラー', '登録に失敗しました');
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) { Alert.alert('エラー', error.message); return; }
        shouldGoBack = true;
      }
    } catch (e) {
      Alert.alert('エラー', 'ネットワークエラーが発生しました');
    } finally {
      setLoading(false);
    }
    if (shouldGoBack) navigation.goBack();
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.inner}>
        <Text style={styles.title}>{isSignUp ? 'アカウント作成' : 'ログイン'}</Text>

        {isSignUp && (
          <TextInput style={styles.input} placeholder="ユーザー名" value={username} onChangeText={setUsername} autoCapitalize="none" textContentType="username" />
        )}
        <TextInput style={styles.input} placeholder="メールアドレス" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" textContentType="emailAddress" />
        <TextInput style={styles.input} placeholder="パスワード" value={password} onChangeText={setPassword} secureTextEntry textContentType={isSignUp ? 'newPassword' : 'password'} />

        <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={handleAuth} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? '...' : isSignUp ? '登録する' : 'ログイン'}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setIsSignUp(v => !v)} style={styles.toggle}>
          <Text style={styles.toggleText}>{isSignUp ? 'ログインはこちら' : 'アカウントを作成'}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAF8' },
  inner: { flex: 1, justifyContent: 'center', padding: 32 },
  title: { fontSize: 26, fontWeight: '700', color: '#1A1A1A', marginBottom: 32, textAlign: 'center' },
  input: { backgroundColor: '#fff', borderRadius: 10, padding: 14, fontSize: 15, borderWidth: 1, borderColor: '#E8E8E8', marginBottom: 12 },
  button: { backgroundColor: '#6B4226', borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 8 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  toggle: { marginTop: 20, alignItems: 'center' },
  toggleText: { color: '#6B4226', fontSize: 14 },
});
