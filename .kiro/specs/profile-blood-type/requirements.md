# Requirements Document

## Introduction

本仕様は、既存のプロフィール管理機能に「血液型」フィールドを追加する機能要件を定義する。現在のプロフィールには名前・性別・生年月日・備考が存在するが、血液型は未実装である。本機能により、ユーザーは自身の血液型を任意で登録・更新・表示できるようになる。

## Requirements

### Requirement 1: 血液型フィールドの追加

**Objective:** 認証済みユーザーとして、プロフィールに血液型を登録できるようにしたい。これにより、個人情報をより詳細に管理できる。

#### Acceptance Criteria

1. The profile form shall 血液型の選択肢として「A型」「B型」「O型」「AB型」を表示する
2. The profile form shall 血液型を任意項目（未選択可）として扱う
3. When ユーザーが血液型を選択して保存した場合, the profile system shall 選択された血液型をデータベースに永続化する
4. When ユーザーが血液型を未選択のまま保存した場合, the profile system shall 血液型を null として保存する
5. When 既存の血液型を別の値に変更して保存した場合, the profile system shall 新しい血液型でデータベースを更新する

### Requirement 2: 血液型の表示

**Objective:** 認証済みユーザーとして、プロフィール画面で自身の血液型を確認したい。これにより、登録情報を視覚的に把握できる。

#### Acceptance Criteria

1. While 血液型が登録されている場合, the profile card shall プロフィール表示画面に血液型のラベルと値を表示する
2. While 血液型が未登録（null）の場合, the profile card shall 血液型の項目を非表示にする、もしくは「未設定」と表示する
3. The profile card shall 血液型を「A型」「B型」「O型」「AB型」の日本語ラベルで表示する

### Requirement 3: バリデーション

**Objective:** システムとして、不正な血液型データの登録を防止したい。これにより、データ整合性を保証できる。

#### Acceptance Criteria

1. If 許可された値（A, B, O, AB）以外の血液型が送信された場合, the profile system shall バリデーションエラーを返し、保存を拒否する
2. The profile form schema shall クライアントサイドとサーバーサイドで同一の Zod スキーマによりバリデーションを実施する
3. When 血液型のバリデーションエラーが発生した場合, the profile form shall エラーメッセージをフォーム上に表示する

### Requirement 4: データベーススキーマの拡張

**Objective:** システムとして、血液型を格納するためのデータベースカラムを追加したい。これにより、既存データとの互換性を保ちながら新フィールドを導入できる。

#### Acceptance Criteria

1. The profile table shall 血液型を格納する text 型のカラムを持つ
2. The blood type column shall nullable であり、既存のプロフィールデータに影響を与えない
3. When マイグレーションが実行された場合, the database shall 既存のプロフィールレコードの血液型を null として保持する

### Requirement 5: 編集フォームとの統合

**Objective:** 認証済みユーザーとして、既存のプロフィール編集フォーム内で血液型を選択・変更したい。これにより、一貫したユーザー体験を維持できる。

#### Acceptance Criteria

1. The profile edit form shall 既存のフォームフィールド（名前、性別、生年月日、備考）と同一のフォーム内に血液型フィールドを配置する
2. When 編集モードに切り替えた場合, the profile form shall 現在登録されている血液型を初期値として表示する
3. While 血液型が未登録の場合, the profile form shall 血液型フィールドを未選択状態で表示する
4. The blood type field shall ラジオボタンまたはセレクトボックスによる選択式 UI を採用する
