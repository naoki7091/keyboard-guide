# 無線分割キーボードの構造・組み立てガイド

公開ページ：**https://naoki7091.github.io/keyboard-guide/**

**[完成形と使用部品を3Dで見る](https://naoki7091.github.io/keyboard-guide/explorer.html)** — ドラッグ/タッチで回転・拡大、完成形/分解/各層を切り替え、部品から該当箇所へ移動できます。

薄型版Musen Compact、左右29/34キー。基板間4.5mm、部品を机側へ移設、CR2450を維持、取り外せるFFC接続。完成イメージ・3層構造・PC/ドングル/USB給電の使い方・検証記録をまとめた静的Webガイドです。表示条件で全体約33.6mmです。

HTML / CSS / JavaScriptで動作します。`index.html`を入口に、左右・層・部品面・配線の表示を切り替えられます。設計スナップショットは2026年11月15日時点です。

## 設計と検証の状態

静的検査3,114項目合格。電気回路4枚と機械プレート2枚を確認し、外周固定穴36か所を加工データでも照合しました。検証概要は[verification-summary.json](verification-summary.json)に記録しています。

左右とドングルの実ARMビルド、GPIO/HID割り当て、実ZMKデバウンスCのホスト試験を実施。左右の通常USBは給電専用、入力はBLEからドングルのUSB NKRO HIDへ送る設定です。

BLE実通信、昇圧起動・3.3V・USB切替・逆流の実測、寿命、現物嵌合・実接点は未検証。TIスイッチングモデルは過渡計算が完了せず、電源の成功扱いにはしていません。本資料は製造リリースや実動作保証を示しません。

## 公開ファイル

- `index.html` / `styles.css` / `app.js`: ガイドの表示と操作。
- `design-data.js`: 表示用の部品位置・配線・検証概要のスナップショット。
- `compact-verification.js`: 検証方法と未実施事項を含む状態表示。
- `assets/`: 固定方法・電池交換を説明する図。
- `explorer.html` / `explorer.css` / `explorer.bundle.js` / `explorer-data.js`: キーキャップ付き3Dビューと30種類の部品一覧。Three.jsは同梱し、ライセンスを`vendor/THREE-LICENSE.txt`に保持しています。
- `.nojekyll`: 静的ファイルをそのままGitHub Pagesへ配信する設定。

電池ケースの写真・寸法図はLCSC / MYOUNGの公開資料へリンクしています。

## 更新方法

ローカル設計プロジェクトの`musen_compact/tools/build_github_pages.py`でこの公開用ファイル一式を生成し、変更をmainへpushします。GitHub Pagesの公開元は`main`ブランチの`/(root)`です。
