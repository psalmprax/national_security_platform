import 'dart:io';
import 'package:flutter/material.dart';
import 'package:google_mobile_ads/google_mobile_ads.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'subscription_service.dart';

/// Ad service for managing advertisements in the free tier
class AdService {
  static final AdService _instance = AdService._internal();
  factory AdService() => _instance;
  AdService._internal();

  // Ad units - replace with actual ad unit IDs in production
  static const String _bannerAdUnitId = 'ca-app-pub-3940256099942544/6300978111'; // Test ID
  static const String _interstitialAdUnitId = 'ca-app-pub-3940256099942544/1033173712'; // Test ID
  static const String _rewardedAdUnitId = 'ca-app-pub-3940256099942544/5224354917'; // Test ID

  // Banner ad
  BannerAd? _bannerAd;
  bool _bannerAdLoaded = false;

  // Interstitial ad
  InterstitialAd? _interstitialAd;
  bool _interstitialAdLoaded = false;

  // Rewarded ad
  RewardedAd? _rewardedAd;
  bool _rewardedAdLoaded = false;

  // Ad configuration
  bool _adsEnabled = true;
  int _adFrequency = 5; // Show interstitial every 5 actions

  // Callback for ad events
  Function()? onAdLoaded;
  Function()? onAdFailedToLoad;
  Function()? onAdOpened;
  Function()? onAdClosed;

  /// Initialize ad service
  Future<void> initialize() async {
    // Check subscription tier
    final subscriptionService = SubscriptionService();
    await subscriptionService.initialize();

    // Disable ads for premium users
    if (subscriptionService.isPremium) {
      _adsEnabled = false;
      return;
    }

    // Load ads based on platform
    if (Platform.isAndroid) {
      await MobileAds.instance.initialize();
    } else if (Platform.isIOS) {
      await MobileAds.instance.initialize();
    }

    // Configure ad request
    RequestConfiguration requestConfiguration = RequestConfiguration(
      testDeviceIds: ['EMULATOR', 'DEVICE_ID'],
      maxAdContentRating: MaxAdContentRating.ma,
      tagForChildDirectedTreatment: TagForChildDirectedTreatment.unspecified,
    );
    await MobileAds.instance.updateRequestConfiguration(requestConfiguration);

    // Preload ads
    await _loadBannerAd();
    await _loadInterstitialAd();
  }

  /// Check if ads are enabled
  bool get isAdsEnabled => _adsEnabled;

  /// Load banner ad
  Future<void> _loadBannerAd() async {
    _bannerAd = BannerAd(
      adUnitId: _bannerAdUnitId,
      size: AdSize.banner,
      request: const AdRequest(),
      listener: BannerAdListener(
        onAdLoaded: (ad) {
          _bannerAdLoaded = true;
          onAdLoaded?.call();
        },
        onAdFailedToLoad: (ad, error) {
          _bannerAdLoaded = false;
          onAdFailedToLoad?.call();
        },
        onAdOpened: (ad) {
          onAdOpened?.call();
        },
        onAdClosed: (ad) {
          onAdClosed?.call();
        },
      ),
    );

    await _bannerAd!.load();
  }

  /// Load interstitial ad
  Future<void> _loadInterstitialAd() async {
    InterstitialAd.load(
      adUnitId: _interstitialAdUnitId,
      request: const AdRequest(),
      interstitialAdLoadCallback: InterstitialAdLoadCallback(
        onAdLoaded: (ad) {
          _interstitialAdLoaded = true;
          _interstitialAd = ad;
          onAdLoaded?.call();
        },
        onAdFailedToLoad: (error) {
          _interstitialAdLoaded = false;
          onAdFailedToLoad?.call();
        },
      ),
    );
  }

  /// Load rewarded ad
  Future<void> _loadRewardedAd() async {
    RewardedAd.load(
      adUnitId: _rewardedAdUnitId,
      request: const AdRequest(),
      rewardedAdLoadCallback: RewardedAdLoadCallback(
        onAdLoaded: (ad) {
          _rewardedAdLoaded = true;
          _rewardedAd = ad;
          onAdLoaded?.call();
        },
        onAdFailedToLoad: (error) {
          _rewardedAdLoaded = false;
          onAdFailedToLoad?.call();
        },
      ),
    );
  }

  /// Get banner ad
  BannerAd? getBannerAd() {
    if (!_adsEnabled || !_bannerAdLoaded) return null;
    return _bannerAd;
  }

  /// Show interstitial ad
  Future<void> showInterstitialAd() async {
    if (!_adsEnabled || !_interstitialAdLoaded) return;

    _interstitialAd!.fullScreenContentCallback = FullScreenContentCallback(
      onAdDismissedFullScreenContent: (ad) {
        _interstitialAdLoaded = false;
        _loadInterstitialAd(); // Preload next ad
        onAdClosed?.call();
      },
      onAdFailedToShowFullScreenContent: (ad, error) {
        _interstitialAdLoaded = false;
        _loadInterstitialAd();
      },
    );

    await _interstitialAd!.show();
  }

  /// Show rewarded ad and return if user earned reward
  Future<bool> showRewardedAd() async {
    if (!_adsEnabled) return false;

    if (!_rewardedAdLoaded) {
      await _loadRewardedAd();
      if (!_rewardedAdLoaded) return false;
    }

    bool rewardEarned = false;

    _rewardedAd!.fullScreenContentCallback = FullScreenContentCallback(
      onAdDismissedFullScreenContent: (ad) {
        _rewardedAdLoaded = false;
        _loadRewardedAd();
        onAdClosed?.call();
      },
      onAdFailedToShowFullScreenContent: (ad, error) {
        _rewardedAdLoaded = false;
        _loadRewardedAd();
      },
    );

    await _rewardedAd!.show(
      onUserEarnedReward: (ad, reward) {
        rewardEarned = true;
      },
    );

    return rewardEarned;
  }

  /// Track user action for ad frequency
  static int _actionCount = 0;

  /// Check if we should show an ad based on frequency
  Future<void> trackAction() async {
    if (!_adsEnabled) return;

    _actionCount++;
    if (_actionCount >= _adFrequency) {
      _actionCount = 0;
      await showInterstitialAd();
    }
  }

  /// Reset action count
  void resetActionCount() {
    _actionCount = 0;
  }

  /// Set ad frequency
  void setAdFrequency(int frequency) {
    _adFrequency = frequency;
  }

  /// Update ads enabled state based on subscription
  Future<void> updateAdState() async {
    final subscriptionService = SubscriptionService();
    _adsEnabled = !subscriptionService.isPremium;
  }

  /// Dispose ads
  void dispose() {
    _bannerAd?.dispose();
    _interstitialAd?.dispose();
    _rewardedAd?.dispose();
  }
}

/// Widget helper for showing banner ads
class AdBannerWidget extends StatelessWidget {
  final AdService _adService = AdService();

  @override
  Widget build(BuildContext context) {
    if (!_adService.isAdsEnabled) {
      return SizedBox.shrink(); // No ad for premium users
    }

    final bannerAd = _adService.getBannerAd();
    if (bannerAd == null) {
      return SizedBox.shrink();
    }

    return Container(
      alignment: Alignment.center,
      child: AdWidget(ad: bannerAd),
      width: bannerAd.size.width.toDouble(),
      height: bannerAd.size.height.toDouble(),
    );
  }
}
