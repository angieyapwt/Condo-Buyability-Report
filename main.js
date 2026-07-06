const CONFIG = {
  // Replace this with your deployed Apps Script Web App URL.
  appsScriptUrl: "https://script.google.com/macros/s/AKfycbyjaUJFlShe-bg4jm3uOm3b4e7UviLe1jBL1TTMVXP1VDlFhfqkPu0nPapdmYQNh4sC4A/exec",
  whatsappNumber: "6583963088",
};

const demoCondos = [
  {
    developmentName: "The A",
    region: "CCR",
    district: "D10 - Tanglin, Bukit Timah, Holland Village",
    topYear: "2018",
    tenure: "99 years",
    totalUnits: "520",
    developer: "King",
    nearestMrt: "Pasir",
    primarySchool: "Pasir",
    malls: "Pasir",
    urbanTransformation: "Pasir",
    score: 78,
    verdict: "GO",
    summary:
      "This development shows stronger fundamentals across location, supply-demand, exit potential and development quality. Listing-level price and rental checks are still required before making an offer.",
    sectionScores: [
      ["Price", 33],
      ["Supply & Demand", 100],
      ["Exit Potential", 75],
      ["Rental", 50],
      ["Development", 100],
      ["Location", 100],
    ],
    strengths: [
      "Strong supply-demand and location indicators support its shortlist position.",
      "Exit potential appears healthier than the average preliminary profile.",
      "Development size and general profile are more defensible for future resale liquidity.",
    ],
    risks: [
      "Entry price needs live comparable transaction checks.",
      "Rental yield and rentability should be completed using the exact listing details.",
    ],
  },
  {
    developmentName: "Riverfront Residences",
    region: "OCR",
    district: "D19 - Hougang, Punggol, Sengkang",
    topYear: "2024",
    tenure: "99 years",
    totalUnits: "1472",
    developer: "Oxley-led consortium",
    nearestMrt: "Hougang / future CRL access",
    primarySchool: "Multiple schools nearby",
    malls: "Hougang Mall / Heartland Mall area",
    urbanTransformation: "North-East region growth",
    score: 69,
    verdict: "CONSIDER",
    summary:
      "This project has scale and family-buyer appeal, but live competition, rental depth and entry price must be checked carefully before proceeding.",
    sectionScores: [
      ["Price", 50],
      ["Supply & Demand", 75],
      ["Exit Potential", 62],
      ["Rental", 50],
      ["Development", 88],
      ["Location", 75],
    ],
    strengths: [
      "Large development size can support resale visibility and transaction activity.",
      "Family-oriented location profile may help own-stay demand.",
    ],
    risks: [
      "Large supply means unit selection and pricing discipline matter.",
      "Rental yield requires current rent evidence and listing-specific entry price.",
    ],
  },
];

const form = document.querySelector("#leadForm");
const statusEl = document.querySelector("#formStatus");
const resultSection = document.querySelector("#resultSection");
const reportMount = document.querySelector("#reportMount");
const suggestions = document.querySelector("#condoSuggestions");
const whatsappCta = document.querySelector("#whatsappCta");
const submitButton = form.querySelector('button[type="submit"]');

function init() {
  suggestions.innerHTML = demoCondos.map((condo) => `<option value="${escapeHtml(condo.developmentName)}"></option>`).join("");
  form.addEventListener("submit", handleSubmit);
  document.querySelector("#printReport").addEventListener("click", () => window.print());
}

async function handleSubmit(event) {
  event.preventDefault();
  if (submitButton.disabled) return;
  setStatus("", "");

  const lead = collectLead();
  const validation = validateLead(lead);
  if (validation) {
    setStatus(validation, "error");
    return;
  }

  submitButton.disabled = true;
  submitButton.textContent = "Generating report...";
  setStatus("Generating your preview and email request...", "");

  try {
    const result = CONFIG.appsScriptUrl ? await submitToAppsScript(lead) : demoLookup(lead);
    if (result && result.ok === false) throw new Error(result.error || "Request failed");
    renderResult(lead, result);
    if (result.duplicate) {
      setStatus("This report was already requested with this email or WhatsApp number.", "success");
    } else {
      setStatus(result.found ? "Preview ready. The report email flow is connected in Apps Script." : "Request received. Manual-review flow shown below.", "success");
    }
  } catch (error) {
    setStatus("Something went wrong. Please try again or contact us on WhatsApp.", "error");
    submitButton.disabled = false;
    submitButton.textContent = "Generate free report";
  }
}

function collectLead() {
  return {
    name: document.querySelector("#name").value.trim(),
    email: document.querySelector("#email").value.trim(),
    whatsapp: document.querySelector("#whatsapp").value.trim(),
    condo: document.querySelector("#condo").value.trim(),
    submittedAt: new Date().toISOString(),
  };
}

function validateLead(lead) {
  if (!lead.name) return "Please enter your name.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email)) return "Please enter a valid email address.";
  if (!/^\+?[0-9\s-]{8,18}$/.test(lead.whatsapp)) return "Please enter a valid WhatsApp number.";
  if (!lead.condo) return "Please enter the condo name.";
  return "";
}

function demoLookup(lead) {
  const match = demoCondos.find((condo) => normalize(condo.developmentName) === normalize(lead.condo));
  if (match) return { ok: true, found: true, report: match };
  return { ok: true, found: false };
}

function submitToAppsScript(lead) {
  return jsonp(CONFIG.appsScriptUrl, {
    action: "submitLead",
    payload: btoa(unescape(encodeURIComponent(JSON.stringify(lead)))),
  });
}

function renderResult(lead, result) {
  resultSection.hidden = false;
  whatsappCta.href = whatsappLink(lead);

  if (result.duplicate) {
    document.querySelector("#resultTitle").textContent = "Report already requested";
    reportMount.innerHTML = `
      <div class="manual-message">
        <p class="eyebrow">One free report per contact</p>
        <h3>This report has already been sent.</h3>
        <p>
          This email or WhatsApp number has already requested the preliminary report for
          <strong>${escapeHtml(result.matchedDevelopment || lead.condo)}</strong>.
        </p>
        <p>
          If you are looking at a specific unit now, send us the listing link on WhatsApp and we will
          complete the masked price and rental analysis.
        </p>
      </div>`;
    scrollToResult();
    return;
  }

  if (!result.found) {
    document.querySelector("#resultTitle").textContent = "Manual review requested";
    reportMount.innerHTML = `
      <div class="manual-message">
        <p class="eyebrow">Development not in database yet</p>
        <h3>We will prepare this report manually.</h3>
        <p>
          Thanks ${escapeHtml(lead.name)}. We do not have a completed database profile for
          <strong>${escapeHtml(lead.condo)}</strong> yet. You will receive an email acknowledgement
          first, and we can prepare the report in about 1-3 working days.
        </p>
        <p>
          To speed this up, send us the actual listing link on WhatsApp. That lets us complete the
          entry PSF, price percentile, rental yield and rentability sections with current listing data.
        </p>
      </div>`;
    scrollToResult();
    return;
  }

    document.querySelector("#resultTitle").textContent = "Your preliminary buyability report is ready";
  reportMount.innerHTML = "";
  const node = document.querySelector("#reportTemplate").content.cloneNode(true);
  const report = result.report;

  setNode(node, "date", formatDate(new Date()));
  setNode(node, "clientName", lead.name);
  setNode(node, "developmentName", report.developmentName);
  setNode(node, "developmentHeading", report.developmentName);
  setNode(node, "summary", report.summary);
  setNode(node, "score", report.score);
  setNode(node, "verdict", report.verdict);

  node.querySelector('[data-field="infoGrid"]').innerHTML = infoRows(report)
    .map(([label, value]) => `<div><b>${escapeHtml(label)}</b><span>${escapeHtml(value || "-")}</span></div>`)
    .join("");

  node.querySelector('[data-field="scoreBars"]').innerHTML = report.sectionScores
    .map(([label, value]) => {
      const locked = (label === "Price" || label === "Rental") && Number(value) === 0;
      return `
      <div>
        <div class="bar-label"><span>${escapeHtml(label)}</span><span>${locked ? "Listing required" : `${value}%`}</span></div>
        <div class="bar-track"><div class="bar-fill" style="width:${locked ? 0 : value}%"></div></div>
      </div>`;
    })
    .join("");

  node.querySelector('[data-field="strengths"]').innerHTML = report.strengths.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
  node.querySelector('[data-field="risks"]').innerHTML = report.risks.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
  reportMount.appendChild(node);
  scrollToResult();
}

function infoRows(report) {
  return [
    ["Region", report.region],
    ["District", report.district],
    ["TOP", report.topYear],
    ["Tenure", report.tenure],
    ["Total Units", report.totalUnits],
    ["Developer", report.developer],
    ["Nearest MRT", report.nearestMrt],
    ["Primary School", report.primarySchool],
    ["Malls", report.malls],
    ["Urban Transformation", report.urbanTransformation],
  ];
}

function whatsappLink(lead) {
  const text = `Hi, I requested the Condo Buyability Report for ${lead.condo}. I would like to send the actual listing to unlock the price and rental analysis.`;
  return `https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(text)}`;
}

function setStatus(message, type) {
  statusEl.textContent = message;
  statusEl.className = `form-status ${type || ""}`.trim();
}

function setNode(root, field, value) {
  const node = root.querySelector(`[data-field="${field}"]`);
  if (node) node.textContent = value ?? "";
}

function scrollToResult() {
  resultSection.scrollIntoView({ behavior: "smooth", block: "start" });
}

function jsonp(url, params) {
  return new Promise((resolve, reject) => {
    const callback = `condoScorecard_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const script = document.createElement("script");
    const fullUrl = new URL(url);
    Object.entries(params).forEach(([key, value]) => fullUrl.searchParams.set(key, value));
    fullUrl.searchParams.set("callback", callback);
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error("Request timed out"));
    }, 12000);
    function cleanup() {
      clearTimeout(timer);
      delete window[callback];
      script.remove();
    }
    window[callback] = (data) => {
      cleanup();
      resolve(data);
    };
    script.onerror = () => {
      cleanup();
      reject(new Error("Request failed"));
    };
    script.src = fullUrl.toString();
    document.body.appendChild(script);
  });
}

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

function formatDate(date) {
  return date.toLocaleDateString("en-SG", { day: "2-digit", month: "short", year: "numeric" });
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char]);
}

init();
