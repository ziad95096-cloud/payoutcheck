/*
 * Advertising configuration. Keep this file free of secrets: publisher and slot IDs are
 * public identifiers. Never put API keys, auth tokens, or payout data here.
 * The integration is intentionally disabled until a provider, account, and ad units exist.
 */
window.PC_ADS_CONFIG = {
  // Replace with "adsense" after selecting Google AdSense, or provide another adapter in ads.js.
  AD_PROVIDER: "none",

  // Set true only after the provider is selected and all required values below are real.
  ADS_ENABLED: false,

  // Keep true until a consent platform is integrated and signals a valid choice.
  REQUIRE_CONSENT: true,

  // Replace with the publisher/client ID from the approved ad network account.
  AD_PUBLISHER_ID: "YOUR_PUBLISHER_ID_HERE",

  AD_SLOTS: {
    // Replace with the ad unit ID for the dashboard's KPI-to-chart placement.
    dashboardTop: "YOUR_DASHBOARD_SLOT_ID",
    // Replace with the optional ad unit ID near the bottom of the dashboard.
    dashboardBottom: "YOUR_DASHBOARD_BOTTOM_SLOT_ID",
    // Replace with the ad unit ID shown above the payout details table.
    resultsTop: "YOUR_RESULTS_SLOT_ID",
    // Replace with the ad unit ID between the history summary and saved records.
    historyMiddle: "YOUR_HISTORY_SLOT_ID"
  }
};
