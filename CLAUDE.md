# DripTrip プロジェクト情報

## アプリ概要
- **アプリ名**: DripTrip
- **概要**: コーヒーログSNS
- **プラットフォーム**: iOS（React Native / Expo）
- **Bundle ID**: com.kino0120.driptrip
- **EAS Project ID**: 9fdff02b-e44e-4dac-bcd1-321a77ea014b
- **EAS owner**: kino0120
- **プライバシーポリシー**: https://gist.github.com/kino0120/af13c1f71b860103dd3c5a02f7786f5c

## デプロイ状況

### 完了済み
- EAS Build で iOS production ビルド実行済み（buildNumber: 5）
- `eas submit --platform ios --latest` で App Store Connect への提出完了
- App Store Connect で審査申請完了（"Ready For Review" メール受信済み、2026-03-29）
- アプリアイコン変更済み（コーヒーカップ＋飛行機デザイン、`assets/icon.png`）
- WorldMap.jsx の `Rect` インポート漏れバグ修正済み
- App Storeリジェクト対応済み（2026-04-03）
  - リジェクト理由：デモアカウントのパスワードが間違っていた
  - App Store Connectのデモアカウント情報を修正して再提出済み
  - デモアカウント：kinopee0120@gmail.com / kino0120
- 再提出後、審査中（2026-04-10時点でまだ結果待ち）

## 課金情報
- **Supabase**: 無料枠（DB 500MB / Storage 1GB / MAU 50,000）超過時に書き込みが止まる。自動課金なし、手動で$25/月のProプランにアップグレードが必要
- **Google Places API**: 月$200の無料クレジットあり。1日500リクエスト上限を設定済みなので実質無料
- **EAS Build**: 月30ビルド無料。超過時は$99/月〜
- **Apple Developer Program**: $99/年（固定）
