/* Kuningriigid V287: visual-only illustrated HUD selector.
 * Does not replace handlers, change saves, game time, or create fake "end turn".
 * Open ?ui=painted or ?ui=classic to choose; the main menu has a reversible toggle. */
(() => {
  const KEY = 'kuningriigid-ui-painted-v287';
  const p = new URLSearchParams(location.search);
  const q = p.get('ui');
  let saved = '0';
  try { saved = localStorage.getItem(KEY) || '0'; } catch {}
  let enabled = q === 'painted' ? true : q === 'classic' ? false : saved === '1';
  const body = document.body;
  const lang = () => (document.documentElement.lang || 'en').startsWith('et') ? 'et' : 'en';
  const buttonText = () => lang() === 'et'
    ? 'Kasutajaliides: ' + (enabled ? 'maalitud' : 'klassikaline')
    : 'Interface: ' + (enabled ? 'illustrated' : 'classic');

  let toggle = null;
  function apply() {
    body.classList.toggle('ui-paint-v287', enabled);
    if (toggle) {
      toggle.textContent = buttonText();
      toggle.setAttribute('aria-pressed', String(enabled));
      toggle.title = lang() === 'et'
        ? 'Vaheta kujundust mängu loogikat muutmata'
        : 'Switch appearance without changing gameplay';
    }
  }
  function change(next) {
    enabled = !!next;
    try { localStorage.setItem(KEY, enabled ? '1' : '0'); } catch {}
    try {
      const u = new URL(location.href);
      u.searchParams.set('ui', enabled ? 'painted' : 'classic');
      history.replaceState(history.state, '', u);
    } catch {}
    apply();
  }
  function init() {
    const header = document.querySelector('header');
    const brand = header?.querySelector('.brand');
    if (brand && !header.querySelector('.v287-wordmark')) {
      const mark = document.createElement('div');
      mark.className = 'v287-wordmark';
      mark.setAttribute('aria-hidden', 'true');
      const title = document.createElement('b');
      title.textContent = 'KUNINGRIIGID';
      const subtitle = document.createElement('small');
      subtitle.textContent = 'STRATEGY · SEVEN ERAS';
      mark.append(title, subtitle);
      brand.after(mark);
    }
    const menu = document.querySelector('#startmenu .menu-utilities');
    if (menu && !document.getElementById('v287-style-toggle')) {
      toggle = document.createElement('button');
      toggle.id = 'v287-style-toggle';
      toggle.type = 'button';
      toggle.addEventListener('click', () => change(!enabled));
      menu.append(toggle);
    } else {
      toggle = document.getElementById('v287-style-toggle');
    }
    apply();
    // Preserve the user's selection when the game changes from world to detail map.
    // Observe only the language attribute; game UI mutations may occur every frame.
    new MutationObserver(() => apply()).observe(document.documentElement, {
      attributes:true,attributeFilter:['lang']
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();