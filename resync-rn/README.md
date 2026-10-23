# Resync — React Native Android Application

**Resync** is an academic manuscript coherence checker for theses, capstones, and dissertations. It detects logic gaps, cross-chapter contradictions, redundancy, terminology drift, and inaccessible/dead citations across chapters.

---

## 1. Quick Start: Open & Run in Android Studio

The Android project is pre-configured and pre-compiled with offline JS bundling, so you do **not** need to start Metro separately to run from Android Studio.

### Steps:
1. Launch **Android Studio**.
2. Select **File → Open…** (or *Open* from the welcome screen).
3. Browse to and select:
   ```
   c:\Users\Nitro 5\OneDrive\Documents\Resync\resync-rn\android
   ```
4. Wait for Gradle Sync to finish (**BUILD SUCCESSFUL**).
5. In the device selector toolbar, choose:
   **Medium Phone (411 × 914 dp), API 36** (or your API 36 emulator).
6. Click the green **▶ Run** button (or press `Shift + F10`).
7. The app launches directly into the **Splash Screen** with the animated symbol and wordmark, then transitions to **Onboarding** or **Home**.

---

## 2. Running via Terminal (CLI)

You can also run the app from PowerShell:
```powershell
cd "c:\Users\Nitro 5\OneDrive\Documents\Resync\resync-rn"

# Start the Android build and deploy to the running emulator:
npx react-native run-android

# Or build debug APK manually:
cd android
.\gradlew assembleDebug
```
The output APK is generated at:
`resync-rn/android/app/build/outputs/apk/debug/app-debug.apk`

---

## 3. Merging with Your AI Backend

The codebase uses a repository pattern that completely isolates UI components from networking, making backend and AI model integration seamless.

### Configuration (`src/config.ts`)
```typescript
export const config = {
  // When testing on Android Emulator with local backend (e.g., FastAPI / Flask / Node.js):
  // Use http://10.0.2.2:8000/ (10.0.2.2 routes to the host machine's localhost)
  // For production or cloud staging:
  API_BASE_URL: 'https://resync-api.onrender.com/',

  // Toggle to false when your AI backend is live
  USE_MOCK: true,
};
```

### AI API Endpoints & Contract (`src/services/api.ts`)

#### 1. Coherence Scan Pipeline: `POST /api/scans/run`
**Request Payload:**
```json
{
  "document_url": "https://docs.google.com/document/d/.../edit",
  "chapter_category": "Full Manuscript",
  "research_type": "Quantitative", // or "Qualitative"
  "research_theme": "STEM Student Retention and Burnout"
}
```

**Expected AI Response:**
```json
{
  "coherence_score": 74,
  "overall_assessment": "Moderate coherence",
  "inconsistencies": [
    {
      "id": "f1",
      "kind": "Issue",
      "section_a": "Objectives",
      "section_b": "Methodology",
      "description": "The Abstract names social support as a variable, but the Methodology lists no instrument for it.",
      "fix": "Add the support scale you used to Section 3, or drop the variable from the Abstract.",
      "severity": "High"
    },
    {
      "id": "f2",
      "kind": "Strength",
      "section_a": "Methodology",
      "section_b": "Findings",
      "description": "Workload and recovery time are reported as significant predictors in Chapter 4, so this statement is supported.",
      "fix": "No change needed. Keep the wording consistent with Table 4.2."
    }
  ],
  "references": [
    {
      "citation": "Dela Cruz, R. (2020). Burnout in Higher Ed.",
      "isValid": false
    },
    {
      "citation": "Bandura, A. (1997). Self-efficacy.",
      "isValid": true
    }
  ],
  "duplicate_sections": [],
  "missing_sections": [],
  "created_at": "2026-10-23T14:00:00Z",
  "manuscript_text": "Full text or annotated excerpts..."
}
```

#### 2. Authentication:
- `POST /api/auth/login` → `{ email, password }` returns `{ token, email, name }`
- `POST /api/auth/register` → `{ name, email, school, password }` returns `{ token, email, name, school }`

---

## 4. App Architecture & File Structure

```
resync-rn/
├── android/                  # Native Android project (compileSdk 36, NDK 26.1, CMake 3.22.1)
├── assets/fonts/             # Google Fonts (Bricolage Grotesque, Figtree, Geist Mono, Source Serif 4)
├── src/
│   ├── App.tsx               # Main entry wrapper with SafeAreaProvider & NavigationContainer
│   ├── config.ts             # API_BASE_URL and USE_MOCK switches
│   ├── theme/
│   │   ├── colors.ts         # Design tokens, gradients, scoreColor tier mapper, font families
│   │   ├── typography.ts     # eyebrowMono, eyebrow, h2, stepTitle, body, small, caption, meta
│   │   ├── spacing.ts        # radii, shadows, screen padding
│   │   └── index.ts
│   ├── components/
│   │   ├── Txt.tsx           # Typography component
│   │   ├── Button.tsx        # primary, dark, outline, white variants with elevation and icons
│   │   ├── IconButton.tsx    # MaterialIcons circular buttons
│   │   ├── Card.tsx          # Consistent border/radius card container
│   │   ├── ScoreRing.tsx     # SVG 0-100 gauge with dynamic color tiers and cap
│   │   ├── ScoreBadge.tsx    # 44x44 score badge with tier background
│   │   ├── Segmented.tsx     # Soft segmented control with count badges
│   │   ├── UnderlineTabs.tsx # Underline tabs with count indicators
│   │   ├── FileTile.tsx      # Document icon tile with tag and remove action
│   │   ├── ListItem.tsx      # Interactive card row with ripple and selection states
│   │   ├── Checkbox.tsx      # Checkbox component
│   │   ├── FilterChip.tsx    # Filter chips (All / High score / Needs review)
│   │   ├── SearchField.tsx   # Search bar
│   │   ├── TextField.tsx     # Form inputs with floating labels & visibility toggles
│   │   ├── BottomSheet.tsx   # Animated slide-up modal with scrim
│   │   ├── BottomNav.tsx     # 4-item bottom bar with top indicator pill
│   │   ├── Callout.tsx       # Informational and citation update alert boxes
│   │   ├── Eyebrow.tsx       # Accent bar + uppercase category headers
│   │   └── Divider.tsx       # 1px line divider
│   ├── navigation/
│   │   ├── RootNavigator.tsx # NativeStack (Splash → Onboarding → Auth → Main, Report, Compare, Settings)
│   │   ├── MainTabs.tsx      # BottomTabs (Home, Upload, History, Profile)
│   │   └── types.ts          # Strongly typed route params
│   ├── screens/
│   │   ├── SplashScreen.tsx      # Animated R-mark pop & wordmark slide transition
│   │   ├── OnboardingScreen.tsx  # 3-step carousel with vector illustrations & skip
│   │   ├── AuthScreen.tsx        # Login & Signup with inline validation
│   │   ├── DashboardScreen.tsx   # Hero gradient, process timeline, deliverables, guidance
│   │   ├── UploadScreen.tsx      # 3-step intake wizard (Manuscript, Template editing, Real-time scan)
│   │   ├── ReportScreen.tsx      # Manuscript preview with inline highlights, Assessment map, AI Analysis
│   │   ├── ArchiveScreen.tsx     # Scan history, search, filter, and multi-version compare mode
│   │   ├── CompareScreen.tsx     # Side-by-side version comparison with SVG delta chart & diff list
│   │   ├── ProfileScreen.tsx     # User credentials and research bio
│   │   └── SettingsScreen.tsx    # Appearance, push/email notification toggles, logout
│   ├── services/
│   │   ├── api.ts            # Axios client with 60s timeout & URL validation
│   │   ├── session.ts        # AsyncStorage persistence for user settings, counts, and auth
│   │   └── scanRepository.ts # Repository layer with automatic mock fallback
│   └── data/
│       ├── scans.ts          # Sample history scans
│       ├── templates.ts      # Quantitative & Qualitative chapter heading templates
│       ├── report.ts         # Manuscript paragraphs, findings, light and heavy synthesis
│       └── compare.ts        # Version diff data and resolved/open/new issue states
```

---

## 5. Design & Platform Compliance
- **No Emoji Used**: Clean, professional academic tone with MaterialIcons throughout.
- **Translucent Status Bar**: `<StatusBar translucent backgroundColor="transparent">` with light icons over the Hero/Onboarding gradient and dark icons across light screens.
- **Adaptive Launcher Icons**: Generated in all densities (`mdpi`, `hdpi`, `xhdpi`, `xxhdpi`, `xxxhdpi`) plus API 26+ adaptive XML with the bold "R" brand symbol.
- **Medium Phone API 36 Ready**: Verified and tested with compileSdk 36, targetSdk 36, and Java 17.
