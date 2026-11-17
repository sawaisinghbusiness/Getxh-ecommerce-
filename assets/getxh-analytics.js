(() => {
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = 'Analytics preferences';
  const panel = document.createElement('section');
  panel.hidden = true;
  panel.setAttribute('aria-label', 'Analytics preferences');
  const label = document.createElement('p');
  label.textContent = 'Allow Google Analytics to measure visits and Microsoft Clarity to record interactions on GETXH public pages?';
  panel.append(label);
  let loaded = false;
  const key = 'getxh-analytics-consent-v2';
  function start() {
    if (loaded) return;
    loaded = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', 'G-9ZZ27CSQVJ', {
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
      page_location: location.origin + location.pathname,
      page_referrer: document.referrer.split(/[?#]/)[0]
    });
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=G-9ZZ27CSQVJ';
    document.head.append(script);

    if (location.search || location.hash) return;
    document.body.setAttribute('data-clarity-mask', 'true');
    window.clarity = window.clarity || function () {
      (window.clarity.q = window.clarity.q || []).push(arguments);
    };
    window.clarity('consentv2', { ad_Storage: 'denied', analytics_Storage: 'granted' });
    const clarityScript = document.createElement('script');
    clarityScript.async = true;
    clarityScript.src = 'https://www.clarity.ms/tag/zew78wjn1u';
    document.head.append(clarityScript);
  }
  for (const [title, choice] of [['Allow analytics', 'yes'], ['Decline analytics', 'no']]) {
    const action = document.createElement('button');
    action.type = 'button';
    action.textContent = title;
    action.onclick = () => {
      localStorage.setItem(key, choice);
      panel.hidden = true;
      if (choice === 'yes') start();
      else if (loaded) {
        window['ga-disable-G-9ZZ27CSQVJ'] = true;
        if (window.clarity) {
          window.clarity('consentv2', { ad_Storage: 'denied', analytics_Storage: 'denied' });
        }
        location.reload();
      }
    };
    panel.append(action);
  }
  button.onclick = () => { panel.hidden = !panel.hidden; };
  const container = document.createElement('div');
  container.style.cssText = 'padding:12px 16px;background:#111827;color:#fff;font:14px system-ui';
  container.append(button, panel);
  (document.querySelector('footer') || document.body).append(container);
  if (localStorage.getItem(key) === 'yes') start();
})();
