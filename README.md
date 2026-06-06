# VapeOff — React Native App

Purple palette · Working auth · In-memory accounts

## Quick Start
```bash
npm install
npx expo start
```

## How Authentication Works

All accounts are stored **in-memory** (no backend needed).
Accounts persist while the app is open, and reset on app restart.

### Sign Up flow:
1. Fill Email, Username, Password, Confirm Password
2. Select role (Vape User or Peer)
3. Fill your details (name, birthday, gender)
4. Lands on Dashboard with your real name shown

### Login flow:
- Enter email OR username + password
- If credentials match a registered account → Dashboard
- Wrong credentials → error message shown

### What's validated:
- Email format check
- Username min 3 chars
- Password min 8 chars
- Duplicate email/username detection
- Passwords must match

## File Structure
```
src/
├── context/
│   └── AuthContext.js        ← in-memory user store + auth logic
├── theme/index.js
├── components/index.js
├── navigation/AppNavigator.js
└── screens/
    ├── HomeScreen.js
    ├── SignUpScreen.js        ← registers user in AuthContext
    ├── LoginScreen.js         ← validates against AuthContext
    ├── SelectionScreen.js     ← saves role to AuthContext
    ├── DetailsScreen.js       ← saves profile, goes to Dashboard
    ├── DashboardScreen.js     ← shows real user name from AuthContext
    ├── MoodScreen.js          ← updates streak + points via AuthContext
    ├── RewardsScreen.js       ← reads real points from AuthContext
    ├── SupportScreen.js
    └── ProfileScreen.js       ← shows real name/role, real logout
```

## To connect a real backend later
Replace the functions in `AuthContext.js`:
- `register()` → POST /auth/register
- `login()` → POST /auth/login + store JWT in AsyncStorage
- `saveDetails()` → POST /user/profile
- `addProgress()` → PATCH /user/progress
