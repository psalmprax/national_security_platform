package api_service

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"
)

// Content for: mobile/test/widget/login_screen_test.dart
/*
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_client/screens/login_screen.dart';
import 'package:provider/provider.dart';
import 'package:mobile_client/services/auth_service.dart';
import 'package:mockito/mockito.dart';

class MockAuthService extends Mock implements AuthService {}

void main() {
  testWidgets('Login screen shows username and password fields', (WidgetTester tester) async {
    // Build our app and trigger a frame.
    await tester.pumpWidget(
      MaterialApp(
        home: Provider<AuthService>(
          create: (_) => MockAuthService(),
          child: LoginScreen(),
        ),
      ),
    );

    // Verify that our counters start at 0.
    expect(find.text('Username'), findsOneWidget);
    expect(find.text('Password'), findsOneWidget);
    expect(find.text('Login'), findsOneWidget);
  });
}
*/
