import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import puppeteer from "puppeteer-core";

const BASE_URL = process.env.QA_BASE_URL || "https://www.effluxa.com";
const CHROME_PATH = process.env.QA_CHROME_PATH;
const REPORT_DIR =
  process.env.QA_REPORT_DIR ||
  path.join(process.cwd(), "production-qa-reports", Date.now().toString());

const USER_EMAIL = process.env.QA_USER_EMAIL || "";
const USER_PASSWORD = process.env.QA_USER_PASSWORD || "";
const ADMIN_EMAIL = process.env.QA_ADMIN_EMAIL || "";
const ADMIN_PASSWORD = process.env.QA_ADMIN_PASSWORD || "";

fs.mkdirSync(REPORT_DIR, { recursive: true });

const results = [];

function addResult(category, name, status, details = "") {
  const normalizedStatus = ["PASS", "FAIL", "SKIP", "WARN"].includes(status)
    ? status
    : "WARN";

  results.push({
    category,
    name,
    status: normalizedStatus,
    details: String(details || ""),
  });

  const icon = {
    PASS: "✅",
    FAIL: "❌",
    SKIP: "⏭️",
    WARN: "⚠️",
  }[normalizedStatus];

  console.log(`${icon} [${category}] ${name}${details ? ` — ${details}` : ""}`);
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 30000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        "user-agent": "Effluxa-Production-QA/1.0",
        ...(options.headers || {}),
      },
    });
  } finally {
    clearTimeout(timeout);
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function csvEscape(value) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

async function testHttpsAndRedirects() {
  console.log("\n=== DOMAIN & HTTPS ===");

  try {
    const response = await fetchWithTimeout(BASE_URL, {
      redirect: "follow",
    });

    addResult(
      "Domain",
      "HTTPS production domain",
      response.ok && response.url.startsWith("https://") ? "PASS" : "FAIL",
      `${response.status} ${response.url}`,
    );
  } catch (error) {
    addResult("Domain", "HTTPS production domain", "FAIL", error.message);
  }

  try {
    const response = await fetchWithTimeout("https://effluxa.com", {
      redirect: "manual",
    });

    const location = response.headers.get("location") || "";
    const validRedirect =
      [301, 302, 307, 308].includes(response.status) &&
      location.includes("www.effluxa.com");

    addResult(
      "Domain",
      "Root domain redirects to www",
      validRedirect ? "PASS" : "FAIL",
      `${response.status} ${location || "No Location header"}`,
    );
  } catch (error) {
    addResult("Domain", "Root domain redirects to www", "FAIL", error.message);
  }
}

async function testPublicPages() {
  console.log("\n=== PUBLIC PAGES ===");

  const pages = [
    ["/", "Homepage"],
    ["/sample-audit", "Sample audit"],
    ["/signup", "Signup"],
    ["/login", "Login"],
    ["/contact", "Contact"],
    ["/privacy", "Privacy"],
    ["/terms", "Terms"],
  ];

  for (const [pathname, label] of pages) {
    try {
      const response = await fetchWithTimeout(`${BASE_URL}${pathname}`, {
        redirect: "follow",
      });

      const body = await response.text();
      const valid =
        response.status === 200 &&
        body.length > 500 &&
        body.toLowerCase().includes("effluxa");

      addResult(
        "Public pages",
        label,
        valid ? "PASS" : "FAIL",
        `HTTP ${response.status}, ${body.length} bytes`,
      );
    } catch (error) {
      addResult("Public pages", label, "FAIL", error.message);
    }
  }
}

async function testSeoFiles() {
  console.log("\n=== SEO FILES ===");

  try {
    const response = await fetchWithTimeout(`${BASE_URL}/robots.txt`);
    const text = await response.text();

    addResult(
      "SEO",
      "robots.txt",
      response.ok && /user-agent:/i.test(text) ? "PASS" : "FAIL",
      `HTTP ${response.status}`,
    );
  } catch (error) {
    addResult("SEO", "robots.txt", "FAIL", error.message);
  }

  try {
    const response = await fetchWithTimeout(`${BASE_URL}/sitemap.xml`);
    const text = await response.text();

    const valid =
      response.ok && /<(urlset|sitemapindex)(\s|>)/i.test(text);

    addResult(
      "SEO",
      "sitemap.xml",
      valid ? "PASS" : "FAIL",
      `HTTP ${response.status}`,
    );
  } catch (error) {
    addResult("SEO", "sitemap.xml", "FAIL", error.message);
  }
}

async function test404() {
  console.log("\n=== 404 PAGE ===");

  const pathname = `/qa-nonexistent-${Date.now()}`;

  try {
    const response = await fetchWithTimeout(`${BASE_URL}${pathname}`, {
      redirect: "manual",
    });

    const body = await response.text();
    const valid =
      response.status === 404 &&
      body.length > 300 &&
      !body.toLowerCase().includes("application error");

    addResult(
      "Errors",
      "Custom 404 response",
      valid ? "PASS" : "FAIL",
      `HTTP ${response.status}, ${body.length} bytes`,
    );
  } catch (error) {
    addResult("Errors", "Custom 404 response", "FAIL", error.message);
  }
}

async function testSecurityHeaders() {
  console.log("\n=== SECURITY HEADERS ===");

  try {
    const response = await fetchWithTimeout(BASE_URL, {
      redirect: "follow",
    });

    const requiredHeaders = [
      ["strict-transport-security", "HSTS"],
      ["x-content-type-options", "X-Content-Type-Options"],
      ["referrer-policy", "Referrer-Policy"],
      ["permissions-policy", "Permissions-Policy"],
    ];

    for (const [header, label] of requiredHeaders) {
      const value = response.headers.get(header);

      addResult(
        "Security headers",
        label,
        value ? "PASS" : "FAIL",
        value || "Header missing",
      );
    }

    const csp = response.headers.get("content-security-policy");

    addResult(
      "Security headers",
      "Content-Security-Policy",
      csp ? "PASS" : "WARN",
      csp || "CSP header is not present",
    );
  } catch (error) {
    addResult("Security headers", "Header audit", "FAIL", error.message);
  }
}

async function createBrowser() {
  if (!CHROME_PATH) {
    throw new Error("QA_CHROME_PATH is not configured.");
  }

  return puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-gpu",
      "--disable-extensions",
      "--no-first-run",
      "--no-default-browser-check",
      "--window-size=1440,1000",
    ],
    defaultViewport: {
      width: 1440,
      height: 1000,
      deviceScaleFactor: 1,
    },
  });
}

async function login(page, email, password) {
  await page.goto(`${BASE_URL}/login`, {
    waitUntil: "networkidle2",
    timeout: 60000,
  });

  await page.waitForSelector('input[type="email"]', {
    visible: true,
    timeout: 30000,
  });

  await page.waitForSelector('input[type="password"]', {
    visible: true,
    timeout: 30000,
  });

  await page.type('input[type="email"]', email, { delay: 10 });
  await page.type('input[type="password"]', password, { delay: 10 });

  await Promise.all([
    page
      .waitForNavigation({
        waitUntil: "networkidle2",
        timeout: 60000,
      })
      .catch(() => null),
    page.click('button[type="submit"]'),
  ]);

  await page.waitForFunction(
    () => window.location.pathname.startsWith("/dashboard"),
    {
      timeout: 60000,
    },
  );

  return page.url();
}

async function testAuthenticatedUser() {
  console.log("\n=== AUTHENTICATED USER ===");

  if (!USER_EMAIL || !USER_PASSWORD) {
    addResult(
      "Authentication",
      "Authenticated browser tests",
      "SKIP",
      "Test account password was not provided",
    );
    return;
  }

  let browser;

  try {
    browser = await createBrowser();
    const page = await browser.newPage();

    const finalUrl = await login(page, USER_EMAIL, USER_PASSWORD);

    addResult(
      "Authentication",
      "Login",
      finalUrl.includes("/dashboard") ? "PASS" : "FAIL",
      finalUrl,
    );

    const cookies = await page.cookies(BASE_URL);
    const token = cookies.find((cookie) => cookie.name === "token");

    addResult(
      "Authentication",
      "Token cookie exists",
      token ? "PASS" : "FAIL",
      token ? "token cookie detected" : "token cookie missing",
    );

    if (token) {
      addResult(
        "Authentication",
        "Token cookie HttpOnly",
        token.httpOnly ? "PASS" : "FAIL",
        `httpOnly=${token.httpOnly}`,
      );

      addResult(
        "Authentication",
        "Token cookie Secure",
        token.secure ? "PASS" : "FAIL",
        `secure=${token.secure}`,
      );

      addResult(
        "Authentication",
        "Token cookie SameSite",
        ["Lax", "Strict"].includes(token.sameSite) ? "PASS" : "WARN",
        `sameSite=${token.sameSite || "unspecified"}`,
      );
    }

    const privateRoutes = [
      "/dashboard",
      "/dashboard/upload",
      "/dashboard/reports",
      "/dashboard/clients",
      "/dashboard/settings",
    ];

    for (const route of privateRoutes) {
      try {
        const response = await page.goto(`${BASE_URL}${route}`, {
          waitUntil: "networkidle2",
          timeout: 60000,
        });

        const currentPath = new URL(page.url()).pathname;
        const body = await page.evaluate(() => document.body.innerText);

        const valid =
          response &&
          response.status() < 400 &&
          currentPath !== "/login" &&
          !/application error/i.test(body);

        addResult(
          "Dashboard",
          route,
          valid ? "PASS" : "FAIL",
          `HTTP ${response?.status() ?? "N/A"}, final path ${currentPath}`,
        );
      } catch (error) {
        addResult("Dashboard", route, "FAIL", error.message);
      }
    }

    try {
      await page.goto(`${BASE_URL}/dashboard/admin`, {
        waitUntil: "networkidle2",
        timeout: 60000,
      });

      const currentPath = new URL(page.url()).pathname;
      const body = (
        await page.evaluate(() => document.body.innerText)
      ).toLowerCase();

      const denied =
        currentPath !== "/dashboard/admin" ||
        /unauthorized|forbidden|access denied|not allowed|admin access required/.test(
          body,
        );

      addResult(
        "Authorization",
        "Non-admin blocked from admin route",
        denied ? "PASS" : "FAIL",
        `final path ${currentPath}`,
      );
    } catch (error) {
      addResult(
        "Authorization",
        "Non-admin blocked from admin route",
        "FAIL",
        error.message,
      );
    }

    await page.goto(`${BASE_URL}/dashboard`, {
      waitUntil: "networkidle2",
      timeout: 60000,
    });

    const logoutButton = await page.evaluateHandle(() => {
      const candidates = [...document.querySelectorAll("button, a")];

      return (
        candidates.find((element) =>
          /^(log out|logout|sign out)$/i.test(
            element.textContent?.trim() || "",
          ),
        ) || null
      );
    });

    const logoutElement = logoutButton.asElement();

    if (logoutElement) {
      await Promise.all([
        page
          .waitForNavigation({
            waitUntil: "networkidle2",
            timeout: 30000,
          })
          .catch(() => null),
        logoutElement.click(),
      ]);

      const currentPath = new URL(page.url()).pathname;
      const remainingCookies = await page.cookies(BASE_URL);
      const remainingToken = remainingCookies.find(
        (cookie) => cookie.name === "token",
      );

      addResult(
        "Authentication",
        "Logout",
        currentPath === "/login" || !remainingToken ? "PASS" : "FAIL",
        `final path ${currentPath}, token=${Boolean(remainingToken)}`,
      );
    } else {
      addResult(
        "Authentication",
        "Logout",
        "SKIP",
        "Logout control was not detected automatically",
      );
    }
  } catch (error) {
    addResult(
      "Authentication",
      "Authenticated browser tests",
      "FAIL",
      error.message,
    );
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

async function testAdminUser() {
  console.log("\n=== ADMIN USER ===");

  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    addResult(
      "Admin",
      "Admin login and panel access",
      "SKIP",
      "Admin password was not provided",
    );
    return;
  }

  let browser;

  try {
    browser = await createBrowser();
    const page = await browser.newPage();

    await login(page, ADMIN_EMAIL, ADMIN_PASSWORD);

    const response = await page.goto(`${BASE_URL}/dashboard/admin`, {
      waitUntil: "networkidle2",
      timeout: 60000,
    });

    const currentPath = new URL(page.url()).pathname;
    const body = await page.evaluate(() => document.body.innerText);

    const valid =
      response &&
      response.status() < 400 &&
      currentPath === "/dashboard/admin" &&
      !/application error/i.test(body);

    addResult(
      "Admin",
      "Admin login and panel access",
      valid ? "PASS" : "FAIL",
      `HTTP ${response?.status() ?? "N/A"}, final path ${currentPath}`,
    );
  } catch (error) {
    addResult(
      "Admin",
      "Admin login and panel access",
      "FAIL",
      error.message,
    );
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

function findLatestSummary(directory) {
  if (!fs.existsSync(directory)) {
    return null;
  }

  const candidates = fs
    .readdirSync(directory)
    .map((name) => path.join(directory, name, "summary.csv"))
    .filter((file) => fs.existsSync(file))
    .sort()
    .reverse();

  return candidates[0] || null;
}

function testExistingLighthouseReports() {
  console.log("\n=== LIGHTHOUSE REPORTS ===");

  const publicSummary = findLatestSummary(
    path.join(process.cwd(), "lighthouse-reports"),
  );

  const authSummary = findLatestSummary(
    path.join(process.cwd(), "lighthouse-auth-reports"),
  );

  addResult(
    "Lighthouse",
    "Public Lighthouse report exists",
    publicSummary ? "PASS" : "WARN",
    publicSummary || "No public summary.csv found",
  );

  addResult(
    "Lighthouse",
    "Authenticated Lighthouse report exists",
    authSummary ? "PASS" : "WARN",
    authSummary || "No authenticated summary.csv found",
  );
}

function addManualChecks() {
  console.log("\n=== MANUAL / EXTERNAL SERVICE CHECKS ===");

  const manual = [
    ["Emails", "Welcome and reminder email delivery"],
    ["Stripe", "LIVE €29 payment"],
    ["Stripe", "LIVE Business subscription"],
    ["Stripe", "LIVE webhook HTTP 200"],
    ["Stripe", "Billing Portal and subscription cancellation"],
    ["Cron", "Protected production cron execution"],
    ["Vercel", "Runtime logs contain no production errors"],
    ["Analytics", "GA4 Realtime receives visits"],
    ["Analytics", "Microsoft Clarity receives sessions"],
    ["AI audit", "Real production file upload and AI processing"],
    ["Contact", "Production contact form submission and admin receipt"],
  ];

  for (const [category, name] of manual) {
    addResult(
      category,
      name,
      "SKIP",
      "Requires external service access or creates real production data",
    );
  }
}

function generateReports() {
  const totals = {
    PASS: results.filter((result) => result.status === "PASS").length,
    FAIL: results.filter((result) => result.status === "FAIL").length,
    WARN: results.filter((result) => result.status === "WARN").length,
    SKIP: results.filter((result) => result.status === "SKIP").length,
  };

  const jsonReport = {
    generatedAt: new Date().toISOString(),
    baseUrl: BASE_URL,
    totals,
    results,
  };

  fs.writeFileSync(
    path.join(REPORT_DIR, "report.json"),
    JSON.stringify(jsonReport, null, 2),
  );

  const csv = [
    ["Category", "Test", "Status", "Details"],
    ...results.map((result) => [
      result.category,
      result.name,
      result.status,
      result.details,
    ]),
  ]
    .map((row) => row.map(csvEscape).join(","))
    .join("\n");

  fs.writeFileSync(path.join(REPORT_DIR, "report.csv"), csv);

  const rows = results
    .map(
      (result) => `
        <tr>
          <td>${escapeHtml(result.category)}</td>
          <td>${escapeHtml(result.name)}</td>
          <td><span class="status status-${result.status.toLowerCase()}">${escapeHtml(result.status)}</span></td>
          <td>${escapeHtml(result.details)}</td>
        </tr>
      `,
    )
    .join("");

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Effluxa Production QA</title>
  <style>
    :root {
      color-scheme: dark;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background: #08111f;
      color: #e5eefc;
    }

    body {
      margin: 0;
      padding: 40px 20px;
    }

    main {
      width: min(1180px, 100%);
      margin: 0 auto;
    }

    h1 {
      margin: 0 0 8px;
      font-size: clamp(32px, 5vw, 52px);
    }

    .subtitle {
      margin: 0 0 28px;
      color: #9fb0c9;
    }

    .summary {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 14px;
      margin-bottom: 28px;
    }

    .metric {
      padding: 20px;
      border: 1px solid #21324b;
      border-radius: 18px;
      background: #0d192b;
    }

    .metric strong {
      display: block;
      margin-top: 6px;
      font-size: 32px;
    }

    .table-wrap {
      overflow-x: auto;
      border: 1px solid #21324b;
      border-radius: 18px;
      background: #0d192b;
    }

    table {
      width: 100%;
      border-collapse: collapse;
    }

    th,
    td {
      padding: 14px 16px;
      border-bottom: 1px solid #21324b;
      text-align: left;
      vertical-align: top;
    }

    th {
      color: #9fb0c9;
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: .06em;
    }

    tr:last-child td {
      border-bottom: 0;
    }

    .status {
      display: inline-flex;
      min-width: 58px;
      justify-content: center;
      padding: 5px 9px;
      border-radius: 999px;
      font-weight: 800;
      font-size: 12px;
    }

    .status-pass {
      background: rgba(34,197,94,.16);
      color: #86efac;
    }

    .status-fail {
      background: rgba(239,68,68,.16);
      color: #fca5a5;
    }

    .status-warn {
      background: rgba(245,158,11,.16);
      color: #fcd34d;
    }

    .status-skip {
      background: rgba(148,163,184,.16);
      color: #cbd5e1;
    }

    @media (max-width: 720px) {
      body {
        padding: 24px 12px;
      }

      .summary {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }
  </style>
</head>
<body>
  <main>
    <h1>Effluxa Production QA</h1>
    <p class="subtitle">
      ${escapeHtml(BASE_URL)} · ${escapeHtml(new Date().toLocaleString())}
    </p>

    <section class="summary">
      <div class="metric">Passed<strong>${totals.PASS}</strong></div>
      <div class="metric">Failed<strong>${totals.FAIL}</strong></div>
      <div class="metric">Warnings<strong>${totals.WARN}</strong></div>
      <div class="metric">Skipped<strong>${totals.SKIP}</strong></div>
    </section>

    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Category</th>
            <th>Test</th>
            <th>Status</th>
            <th>Details</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  </main>
</body>
</html>`;

  fs.writeFileSync(path.join(REPORT_DIR, "report.html"), html);

  console.log("\n================================================");
  console.log(" QA SUMMARY");
  console.log("================================================");
  console.table(totals);
  console.log(`Reports: ${REPORT_DIR}`);

  return totals;
}

async function main() {
  console.log(`Testing ${BASE_URL}`);

  await testHttpsAndRedirects();
  await testPublicPages();
  await testSeoFiles();
  await test404();
  await testSecurityHeaders();
  await testAuthenticatedUser();
  await testAdminUser();

  testExistingLighthouseReports();
  addManualChecks();

  const totals = generateReports();

  process.exitCode = totals.FAIL > 0 ? 1 : 0;
}

main().catch((error) => {
  console.error("\n❌ Production QA runner crashed:");
  console.error(error);

  addResult("Runner", "Unexpected QA runner error", "FAIL", error.message);
  generateReports();

  process.exitCode = 1;
});
