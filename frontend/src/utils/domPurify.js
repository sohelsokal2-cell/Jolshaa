const sanitizeURL = (url) => {
  if (!url || typeof url !== 'string') return '';
  
  try {
    const parsed = new URL(url, window.location.origin);
    
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return '';
    }
    
    return parsed.href;
  } catch {
    return '';
  }
};

const TRUSTED_AD_DOMAINS = [
  'adsterra.com',
  'googletagmanager.com',
  'googleadservices.com',
  'doubleclick.net',
  'facebook.net',
  'amazon-adsystem.com',
  'google.com',
  'googlesyndication.com',
];

const isTrustedDomain = (url) => {
  try {
    const parsed = new URL(url);
    return TRUSTED_AD_DOMAINS.some(d => parsed.hostname.endsWith(d));
  } catch {
    return false;
  }
};

const validateAdScript = (script) => {
  if (!script || typeof script !== 'string') return null;
  
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = script;
  
  const scripts = tempDiv.querySelectorAll('script');
  for (const s of scripts) {
    if (s.src && !isTrustedDomain(s.src)) {
      console.warn(`[AdSecurity] Blocked script with untrusted src: ${s.src}`);
      return null;
    }
    if (!s.src && s.textContent) {
      console.warn('[AdSecurity] Blocked inline script (only src-based scripts allowed)');
      return null;
    }
  }
  
  const iframes = tempDiv.querySelectorAll('iframe');
  for (const iframe of iframes) {
    if (iframe.src && !isTrustedDomain(iframe.src)) {
      console.warn(`[AdSecurity] Blocked iframe with untrusted src: ${iframe.src}`);
      return null;
    }
  }
  
  return script;
};

const safeSetInnerHTML = (element, html) => {
  if (!element || !html) return;
  
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  
  const sanitizeNode = (node) => {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const tagName = node.tagName.toLowerCase();
      
      if (['script', 'iframe', 'img', 'ins', 'div', 'span'].indexOf(tagName) === -1) {
        node.remove();
        return;
      }
      
      const attrs = [...node.attributes];
      for (const attr of attrs) {
        if (attr.name.startsWith('on')) {
          node.removeAttribute(attr.name);
        }
        if (attr.name === 'href' || attr.name === 'src') {
          const sanitized = sanitizeURL(attr.value);
          if (!sanitized) {
            node.remove();
            return;
          }
          node.setAttribute(attr.name, sanitized);
        }
      }
    }
    
    [...node.childNodes].forEach(sanitizeNode);
  };
  
  sanitizeNode(tempDiv);
  element.innerHTML = '';
  while (tempDiv.firstChild) {
    element.appendChild(tempDiv.firstChild);
  }
};

export { sanitizeURL, validateAdScript, safeSetInnerHTML };
