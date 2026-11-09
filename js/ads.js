/* Provider adapter boundary: render ads here without passing any app data to an ad network. */
window.PC = window.PC || {};
PC.ads = (() => {
  const cfg = window.PC_ADS_CONFIG || {};
  const placeholder = value => !value || /^YOUR_/i.test(value);
  const slots = ["dashboardTop", "dashboardBottom", "resultsTop", "historyMiddle"];
  let scriptPromise = null;

  function validAdSenseConfig() {
    return cfg.ADS_ENABLED === true && cfg.AD_PROVIDER === "adsense" &&
      /^ca-pub-\d+$/.test(cfg.AD_PUBLISHER_ID || "") &&
      slots.some(name => /^\d+$/.test((cfg.AD_SLOTS || {})[name] || ""));
  }

  function loadAdSense() {
    if (scriptPromise) return scriptPromise;
    const existing = document.querySelector('script[data-payoutcheck-ads="adsense"]');
    if (existing) return scriptPromise = Promise.resolve(existing);
    scriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.async = true;
      script.crossOrigin = "anonymous";
      script.dataset.payoutcheckAds = "adsense";
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(cfg.AD_PUBLISHER_ID)}`;
      script.onload = () => resolve(script);
      script.onerror = () => reject(new Error("Ad provider script did not load."));
      document.head.appendChild(script);
    });
    return scriptPromise;
  }

  function mount(root) {
    if (!root) return;
    const containers = [...root.querySelectorAll("[data-ad-slot]")];
    containers.forEach(container => { container.hidden = true; });
    if (!validAdSenseConfig()) return;
    if (cfg.REQUIRE_CONSENT === true && window.PC_ADS_CONSENT !== true) return;

    const ready = containers.filter(container => {
      const slotId = (cfg.AD_SLOTS || {})[container.dataset.adSlot];
      if (placeholder(slotId) || !/^\d+$/.test(slotId || "")) return false;
      const ins = container.querySelector("ins.adsbygoogle");
      if (!ins || ins.dataset.adInitialized === "true") return false;
      ins.dataset.adClient = cfg.AD_PUBLISHER_ID;
      ins.dataset.adSlot = slotId;
      ins.dataset.adInitialized = "true";
      container.hidden = false;
      const observer = new MutationObserver(() => {
        if (ins.dataset.adStatus === "unfilled") {
          container.hidden = true;
          observer.disconnect();
        }
      });
      observer.observe(ins, { attributes: true, attributeFilter: ["data-ad-status"] });
      return true;
    });
    if (!ready.length) return;

    loadAdSense().then(() => {
      ready.forEach(container => {
        if (!container.isConnected) return;
        try {
          (window.adsbygoogle = window.adsbygoogle || []).push({});
        } catch (_) {
          // An unavailable or blocked ad must never break reconciliation or navigation.
        }
      });
    }).catch(() => {
      ready.forEach(container => {
        const status = container.querySelector(".ad-status");
        if (status) status.textContent = "Ad unavailable";
      });
    });
  }

  function setConsent(granted) {
    window.PC_ADS_CONSENT = granted === true;
    const root = document.querySelector("#view");
    if (!root) return;
    if (window.PC_ADS_CONSENT) mount(root);
    else root.querySelectorAll("[data-ad-slot]").forEach(container => { container.hidden = true; });
  }

  return { mount, validAdSenseConfig, setConsent };
})();
