const form = document.getElementById('search-form');
const input = document.getElementById('query');
const errorEl = document.getElementById('error');

const els = {
  ip: document.getElementById('ip'),
  location: document.getElementById('location'),
  timezone: document.getElementById('timezone'),
  isp: document.getElementById('isp'),
};

// Map and custom marker
const map = L.map('map', { zoomControl: false }).setView([20, 0], 2);
L.control.zoom({ position: 'bottomright' }).addTo(map);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; OpenStreetMap contributors',
}).addTo(map);

const pinIcon = L.icon({
  iconUrl: 'images/icon-location.svg',
  iconSize: [46, 56],
  iconAnchor: [23, 56],
});

let marker = L.marker([20, 0], { icon: pinIcon });

// Helpers
const ipv4 = /^(25[0-5]|2[0-4]\d|1?\d?\d)(\.(25[0-5]|2[0-4]\d|1?\d?\d)){3}$/;
const ipv6 = /^[0-9a-f:]+$/i;
const isIp = (v) => ipv4.test(v) || (v.includes(':') && ipv6.test(v));

function showError(message) {
  errorEl.textContent = message;
}

// Domains are resolved to an IP first (DNS over HTTPS)
async function resolveDomain(domain) {
  const res = await fetch(
    `https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=A`,
  );
  const data = await res.json();
  const record = (data.Answer || []).find((a) => a.type === 1);
  if (!record) throw new Error('Could not find an IP address for that domain.');
  return record.data;
}

// Each provider returns the same shape: { ip, city, region, postal, lat, lng, offset, isp }
async function fromIpwhois(target) {
  const res = await fetch(`https://ipwho.is/${target}`);
  if (!res.ok) throw new Error(`ipwho.is returned HTTP ${res.status}`);
  const d = await res.json();
  if (!d.success) throw new Error(d.message || 'ipwho.is lookup failed');
  return {
    ip: d.ip,
    city: d.city,
    region: d.region_code || d.region,
    postal: d.postal,
    lat: d.latitude,
    lng: d.longitude,
    offset: d.timezone && d.timezone.utc,
    isp: d.connection && (d.connection.isp || d.connection.org),
  };
}

function offsetFromZone(zone) {
  try {
    const part = new Intl.DateTimeFormat('en', {
      timeZone: zone,
      timeZoneName: 'longOffset',
    })
      .formatToParts(new Date())
      .find((p) => p.type === 'timeZoneName').value;
    return part === 'GMT' ? '+00:00' : part.replace('GMT', '');
  } catch {
    return '';
  }
}

// Backup provider, used if the first one fails
async function fromGeoJs(target) {
  const res = await fetch(
    target
      ? `https://get.geojs.io/v1/ip/geo/${target}.json`
      : 'https://get.geojs.io/v1/ip/geo.json',
  );
  if (!res.ok) throw new Error(`geojs returned HTTP ${res.status}`);
  const d = await res.json();
  if (!d.latitude || d.latitude === 'nil')
    throw new Error('geojs has no data for this address');
  return {
    ip: d.ip,
    city: d.city,
    region: d.region,
    postal: '',
    lat: parseFloat(d.latitude),
    lng: parseFloat(d.longitude),
    offset: offsetFromZone(d.timezone),
    isp: d.organization_name || (d.organization || '').replace(/^AS\d+\s*/, ''),
  };
}

async function fromIpapi(target) {
  const res = await fetch(
    target ? `https://ipapi.co/${target}/json/` : 'https://ipapi.co/json/',
  );
  if (!res.ok) throw new Error(`ipapi.co returned HTTP ${res.status}`);
  const d = await res.json();
  if (d.error) throw new Error(d.reason || 'ipapi.co lookup failed');
  const off = d.utc_offset
    ? `${d.utc_offset.slice(0, 3)}:${d.utc_offset.slice(3)}`
    : '';
  return {
    ip: d.ip,
    city: d.city,
    region: d.region_code || d.region,
    postal: d.postal,
    lat: d.latitude,
    lng: d.longitude,
    offset: off,
    isp: d.org,
  };
}

// Providers that returned HTTP 429 are skipped for the rest of the session
const rateLimited = new Set();

async function lookup(query = '') {
  showError('');
  let target = query.trim();

  try {
    if (target) {
      target = target.replace(/^https?:\/\//i, '').split('/')[0];
      if (!isIp(target)) target = await resolveDomain(target);
    }
  } catch (err) {
    showError(err.message || 'Could not resolve that domain.');
    return;
  }

  // Try each provider and fill in any fields the previous one left empty
  const errors = [];
  let result = null;
  for (const provider of [fromGeoJs, fromIpwhois, fromIpapi]) {
    if (rateLimited.has(provider)) continue;
    try {
      const data = await provider(target);
      result = {
        ...data,
        ...Object.fromEntries(
          Object.entries(result || {}).filter(
            ([, v]) => v !== undefined && v !== null && v !== '',
          ),
        ),
      };
      if (result.city && result.offset && result.isp) break;
    } catch (err) {
      console.error(provider.name, err);
      if (/429/.test(err.message)) rateLimited.add(provider);
      errors.push(err.message);
    }
  }

  if (result) render(result);
  else showError(`Lookup failed: ${errors.join('; ')}`);
}

function render(data) {
  const place = [data.city, data.region].filter(Boolean).join(', ');
  const location = [place, data.postal].filter(Boolean).join(' ');

  els.ip.textContent = data.ip;
  els.location.textContent = location || 'Unknown';
  els.timezone.textContent = data.offset ? `UTC ${data.offset}` : 'Unknown';
  els.isp.textContent = data.isp || 'Unknown';

  const latlng = [data.lat, data.lng];
  marker.setLatLng(latlng).addTo(map);
  map.setView(latlng, 13);

  // On mobile, shift the pin lower so the info card doesn't cover it
  if (window.innerWidth <= 800) map.panBy([0, -120], { animate: false });
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  lookup(input.value);
});

// Show the visitor's own IP on load
lookup();
