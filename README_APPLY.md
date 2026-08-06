# Apply this visual restoration

This patch intentionally contains only `lib/main.dart` and `test/widget_test.dart`.

Copy both folders into the Flutter project root (`C:\dev\forflicksakes`) and choose **Replace** when Windows asks. Do not place the `ffs_reference_ui_patch` folder itself inside the project.

Then run:

```powershell
flutter clean
flutter pub get
flutter analyze
flutter test
flutter run -d emulator-5554
```

The interface matches the earlier compact concierge layout while using the ForFlickSakes brand.
