// DeFastra integration — the ENTIRE documented toolset, not just the one
// endpoint that was linked.
//
// Covered from https://docs.defastra.com :
//   API endpoints
//     POST /deep_email_check        (Deep Email Check)
//     POST /deep_phone_check        (Deep Phone Check)
//   Auth & request format
//     Base URL https://api.defastra.com, HTTPS only, POST only,
//     headers X-API-KEY + Content-Type: application/x-www-form-urlencoded,
//     optional Connection: keep-alive and Accept-Encoding: gzip, deflate, br
//   Parameters
//     email / phone (required), timeout = minimal | normal | extensive, label
//   Risk model
//     4 risk levels with score ranges, and the full risk & trust signal lists
//     for both email and phone
//   Enrichment
//     social & digital profiles, creation date, breach data, deliverability
//
// WHY THIS IS IN A LEGAL APP
// A defendant (or their family) is often contacted about a case by email, text,
// or phone. Scam "case update" and "bond payment" messages are extremely common
// and target people under pressure. These same deep checks are the fastest way
// to decide whether a message is worth acting on. The app presents the result as
// a cautious signal, never as proof about a person.

export const DEFASTRA = {
  baseUrl: "https://api.defastra.com",
  endpoints: {
    email: "/deep_email_check",
    phone: "/deep_phone_check",
  },
  requiredHeaders: {
    "X-API-KEY": "your_api_key",
    "Content-Type": "application/x-www-form-urlencoded",
  },
  optionalHeaders: {
    Connection: "keep-alive",
    "Accept-Encoding": "gzip, deflate, br",
  },
  timeoutOptions: [
    { id: "minimal", label: "Fastest", plain: "Quickest answer, least detail. Use when you just need a fast yes/no." },
    { id: "normal", label: "Balanced (default)", plain: "The normal balance of speed and detail. Use this unless you have a reason not to." },
    { id: "extensive", label: "Most thorough", plain: "Slowest but digs deepest. Use when the decision really matters." },
  ],
  // From the site's risk-level table.
  riskLevels: [
    { level: "low", scoreRange: "0", plain: "No risk signals found", advice: "Looks safe.", tone: "good" },
    { level: "medium", scoreRange: "1 - 20", plain: "A few light risk signals", advice: "Probably fine, but look closer.", tone: "warn" },
    { level: "high", scoreRange: "21 - 40", plain: "Serious risk signals found", advice: "Treat with real caution. Do not send money or documents.", tone: "bad" },
    { level: "extreme", scoreRange: "40 - 100", plain: "Many definite risk signals", advice: "Treat as fraudulent. Do not act on it.", tone: "bad" },
  ],
};

// ---------------------------------------------------------------------------
// Signal dictionaries — every check documented on the site, with the plainest
// possible title, so a non-technical reader gets the meaning immediately.
// ---------------------------------------------------------------------------

export const EMAIL_SIGNALS = [
  { code: "EMAIL_DISPOSABLE", title: "Temporary / throwaway email?", plain: "Was this email address created to be used once and thrown away? Scammers use these constantly.", risk: "It is a disposable email address found on temporary-email websites.", trust: "This is not a disposable address." },
  { code: "EMAIL_NAME_CONSISTENCY", title: "Do the names match?", plain: "Do the names on the accounts tied to this email agree with each other, or is it a different name on every site?", risk: "The names linked to this email do not match each other.", trust: "The names linked to this email are consistent." },
  { code: "EMAIL_DELIVERABILITY", title: "Does the email actually work?", plain: "Is this a real, working email address, or does it bounce?", risk: "This email is invalid and does not deliver.", trust: "This email is real and delivers." },
  { code: "EMAIL_ALIAS", title: "Sneaky formatting trick?", plain: "Is the address using dotted-letter tricks (like e.x.am.p.le@gmail.com) to look like a different address?", risk: "This address abuses common aliasing tricks.", trust: "The address format is clean." },
  { code: "EMAIL_BLACKLISTED", title: "Banned by other sites?", plain: "Has this email been banned by social media or other services for fake accounts?", risk: "This email was blacklisted by an online service.", trust: "This email was not blacklisted anywhere." },
  { code: "EMAIL_POSITION_CONSISTENCY", title: "Do the locations match?", plain: "Do the countries and cities on the accounts tied to this email agree, or is it one city here and another country there?", risk: "The locations tied to this email do not match each other.", trust: "The locations tied to this email are consistent." },
  { code: "EMAIL_DATA_BREACH", title: "Too many data leaks?", plain: "Was this email caught in a normal number of data breaches, or an unusually high number (which usually means it is shared or fake)?", risk: "This email appears in far more data breaches than usual \u2014 it may be a shared address.", trust: "This email appears in a normal, safe number of breaches." },
  { code: "EMAIL_DOMAIN", title: "Sketchy domain?", plain: "If the email is not from a big provider, was the domain just registered, and does it have odd mail settings?", risk: "The email domain is very new or has suspicious mail settings.", trust: null },
  { code: "EMAIL_MAIN_PROVIDER", title: "Is the account real?", plain: "If the email claims to be Gmail, Outlook, etc., does an account actually exist there?", risk: "This address claims a big provider but has no real account there \u2014 likely fake or banned.", trust: "This address is linked to a real account at its provider." },
  { code: "EMAIL_ONLINE_VELOCITY", title: "Linked to too many or too few sites?", plain: "A normal person's email is linked to an average number of accounts. A huge number (or zero) is a warning sign.", risk: "This email is linked to far too many online accounts \u2014 it may be shared.", trust: "This email is linked to a normal, reasonable number of accounts." },
];

export const PHONE_SIGNALS = [
  { code: "PHONE_DISPOSABLE", title: "Throwaway number?", plain: "Was this number created to receive one text and be discarded? Scammers use these to dodge detection.", risk: "This number is listed on free temporary/disposable SMS websites.", trust: "This number was not found on any disposable SMS service." },
  { code: "PHONE_CARRIER", title: "Who really owns the number?", plain: "Which phone company is behind the number \u2014 a major, well-known one, or a cheap prepaid brand commonly used to bypass verification?", risk: "The carrier behind this number is on a known-risk list, or is not a main carrier in that country.", trust: "The carrier is a main, legitimate carrier in that country." },
  { code: "PHONE_IS_BLACKLISTED", title: "Banned by other sites?", plain: "Has this number been banned by social media or other services for fake accounts?", risk: "This number was blacklisted by third-party services.", trust: "This number was not blacklisted anywhere." },
  { code: "PHONE_OS", title: "Does a real device back it?", plain: "Is this number actually live on a normal phone (like an iPhone or Android), or is there no device at all \u2014 which can mean a SIM farm?", risk: "No device is linked to this number, which is unusual.", trust: "This number is live on a normal device." },
  { code: "PHONE_DATA_BREACH", title: "Seen in old data leaks?", plain: "Has this number shown up in old data breaches? Oddly, this is a GOOD sign \u2014 it means the number has existed and been used for a long time.", risk: null, trust: "This number appears in an old data breach, which suggests it has been in real use for years." },
  { code: "PHONE_TYPE", title: "Mobile, landline, or internet number?", plain: "How the number is technically classified. Internet-based (VOIP) numbers are much easier to spin up anonymously.", risk: "This is a VOIP (internet) number, which is easy to create anonymously.", trust: "This is a normal mobile number." },
  { code: "PHONE_CONSISTENCY", title: "Do the profiles agree?", plain: "Do the names, photos, and locations on the accounts tied to this number agree, or is it 'Thomas' on one app and a different person on another?", risk: "The accounts tied to this number contradict each other.", trust: "The accounts tied to this number are consistent." },
  { code: "PHONE_BLACKMARKET_PRESENCE", title: "Signed up on odd services?", plain: "Which services is this number registered on? A US number with accounts on obscure foreign apps is a common fingerprint of a bought number.", risk: "This number is registered on services that are highly unusual for its country.", trust: "This number is registered on ordinary, common services for its country." },
  { code: "PHONE_BLACKMARKET_PATTERN", title: "Scam-style label?", plain: "Do the profiles tied to this number use names that are always linked to fraud \u2014 like 'Helpdesk Bitcoin' or 'Escort Service'?", risk: "The profiles tied to this number match known scam naming patterns.", trust: "No scam naming patterns were found on the profiles tied to this number." },
];

export function signalByCode(code) {
  return [...EMAIL_SIGNALS, ...PHONE_SIGNALS].find((s) => s.code === code) || null;
}

// ---------------------------------------------------------------------------
// Response translation — turn the raw API JSON into labeled, plain-language
// cards. Anything the site does not document is labeled honestly as unknown
// rather than guessed at.
// ---------------------------------------------------------------------------

function humanize(key) {
  return String(key)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

function flatten(obj, prefix = "", out = [], depth = 0) {
  if (depth > 3 || obj === null || obj === undefined) return out;
  if (Array.isArray(obj)) {
    if (obj.length === 0) return out;
    if (typeof obj[0] === "object") {
      out.push({ label: humanize(prefix), value: `${obj.length} entries`, raw: obj });
    } else {
      out.push({ label: humanize(prefix), value: obj.slice(0, 8).join(", "), raw: obj });
    }
    return out;
  }
  if (typeof obj === "object") {
    for (const [k, v] of Object.entries(obj)) {
      flatten(v, prefix ? `${prefix} \u2013 ${k}` : k, out, depth + 1);
    }
    return out;
  }
  if (obj === "" || obj === null) return out;
  out.push({ label: humanize(prefix), value: String(obj), raw: obj });
  return out;
}

export function riskLevelFor(score) {
  const n = Number(score);
  if (Number.isNaN(n)) return null;
  if (n <= 0) return DEFASTRA.riskLevels[0];
  if (n <= 20) return DEFASTRA.riskLevels[1];
  if (n <= 40) return DEFASTRA.riskLevels[2];
  return DEFASTRA.riskLevels[3];
}

/**
 * Translate a raw Deep Check response into clearly labeled, non-technical
 * sections. Never invents a field; anything unrecognized is listed under
 * "Other details the service returned" verbatim.
 */
export function translateResponse(kind, raw) {
  if (!raw) return null;
  const body = raw.deep_email_check || raw.deep_phone_check || raw.data || raw;
  const identifier = body.email || body.phone || raw.email || raw.phone || "\u2014";

  const score = body.risk_score;
  const level = body.risk_level || riskLevelFor(score)?.level;

  const signals = [];
  const list = body.signals || body.checks || body.details || [];
  if (Array.isArray(list)) {
    for (const s of list) {
      const code = s.code || s.name || s.check;
      const known = signalByCode(code);
      const outcome = s.outcome || s.type || s.result || (s.risk ? "risk" : s.trust ? "trust" : "info");
      const detail = s.detail || s.message || s.description || "";
      signals.push({
        code,
        title: known?.title || humanize(code || "Unnamed check"),
        meaning: known?.plain || "The service ran this check, but this app does not have a documentation entry for it.",
        outcome,
        outcomePlain: outcome === "risk" ? "Warning sign found" : outcome === "trust" ? "Good sign" : "Note",
        detail: detail || known?.[outcome === "risk" ? "risk" : "trust"] || "",
      });
    }
  }

  const profiles = body.online_profiles || {};
  const profileRows = flatten(profiles, "", []).slice(0, 40);

  const otherKnown = new Set([
    "risk_score", "risk_level", "signals", "checks", "details", "online_profiles",
    "email", "phone", "profiles_count", "status", "request_id", "deep_email_check", "deep_phone_check",
  ]);

  const other = [];
  for (const [k, v] of Object.entries(body)) {
    if (otherKnown.has(k)) continue;
    for (const row of flatten(v, k)) other.push(row);
  }

  return {
    kind,
    identifier,
    score: score === undefined || score === null ? null : Number(score),
    level,
    levelInfo: level ? DEFASTRA.riskLevels.find((l) => l.level === level) : null,
    profilesCount: body.profiles_count ?? null,
    signals,
    profileRows,
    other: other.slice(0, 40),
    requestId: raw.request_id || body.request_id || null,
    generatedAt: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Live client. In a packaged Android app, calling a third-party API straight
// from the WebView puts your key on the device, so production deployments
// should route through a small server proxy. The app handles both paths and
// says which one it is using.
// ---------------------------------------------------------------------------

export function isConfigured(config) {
  return Boolean(config && (config.apiKey || config.proxyUrl));
}

export async function runDeepCheck({ kind, value, timeout = "normal", label = "", config }) {
  const endpoint = DEFASTRA.endpoints[kind];
  const body = new URLSearchParams();
  body.set(kind === "email" ? "email" : "phone", value);
  body.set("timeout", timeout);
  if (label) body.set("label", label.slice(0, 100));

  // Preferred path: the user's own proxy (keeps the API key off the device).
  if (config?.proxyUrl) {
    const res = await fetch(config.proxyUrl.replace(/\/$/, "") + endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });
    if (!res.ok) throw new Error(`Request failed (${res.status}). ${await safeText(res)}`);
    return translateResponse(kind, await res.json());
  }

  // Direct path: only works where the platform allows cross-origin calls.
  if (config?.apiKey) {
    const res = await fetch(DEFASTRA.baseUrl + endpoint, {
      method: "POST",
      headers: {
        "X-API-KEY": config.apiKey,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });
    if (!res.ok) throw new Error(`Request failed (${res.status}). ${await safeText(res)}`);
    return translateResponse(kind, await res.json());
  }

  throw new Error("No DeFastra connection is set up. Add an API key or a proxy URL in Settings.");
}

async function safeText(res) {
  try {
    const j = await res.json();
    return j.error_message || j.error_type || "";
  } catch {
    return "";
  }
}
