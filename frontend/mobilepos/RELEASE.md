# MobilePOS Release Checklist

## Pre-release

- [ ] All CI checks pass (lint, typecheck, tests, i18n parity)
- [ ] Translation parity verified: `npm run check:i18n`
- [ ] Version bumped in `app.json` (or using EAS `autoIncrement`)
- [ ] Environment variables set for target build (API URL, etc.)
- [ ] No `console.log` statements left in production code
- [ ] Offline flows tested: login, sell, inventory, shift open/close

## Build

### Android APK (internal testing)

```bash
eas build --platform android --profile preview --non-interactive
```

### iOS Ad-hoc (TestFlight internal)

```bash
eas build --platform ios --profile preview --non-interactive
```

### Production builds

```bash
eas build --platform all --profile production --non-interactive
```

## Testing on physical devices

- [ ] Install APK on Android device (scan QR or download from EAS)
- [ ] Install via TestFlight on iOS device
- [ ] **Critical flow smoke test:**
  1. Registration wizard completes with initial sync
  2. Login (online) succeeds and navigates to sell screen
  3. Open shift with initial cash
  4. Browse products by category, search by name
  5. Add items to cart, adjust quantities
  6. Process cash payment — change is calculated correctly
  7. Process card/transfer payment — exact amount
  8. View completed order in Orders tab with "paid" badge
  9. Create inventory entry for current shift
  10. Change language in Settings (EN ↔ ES)
  11. Check sync status and run manual sync
  12. Close shift
  13. Kill app, reopen — login screen appears (not re-register)
  14. Toggle airplane mode — login offline works
  15. Create order offline — verify sync indicator shows pending

## Submission

### Google Play (internal track)

```bash
eas submit --platform android --profile production
```

### Apple App Store (TestFlight)

```bash
eas submit --platform ios --profile production
```

## Rollback plan

1. If a critical bug is found in production:
   - Revert to last known good commit: `git revert HEAD`
   - Rebuild and resubmit: `eas build --platform all --profile production`
2. For Android: expedited review via Play Console managed publishing
3. For iOS: use "remove from sale" in App Store Connect while fix is prepared
4. Emergency OTA update (JS-only changes): `eas update --branch production`

## Post-release

- [ ] Monitor crash reports (EAS Insights / Sentry)
- [ ] Verify sync queue drains on first launch after update
- [ ] Confirm i18n strings display correctly in both languages
- [ ] Update `TASKS.md` status to reflect release completion
