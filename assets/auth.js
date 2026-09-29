(() => {
  const AUTH_KEY = "jswDashboardAuth";

  function getAuth() {
    try {
      return JSON.parse(sessionStorage.getItem(AUTH_KEY) || "null");
    } catch {
      return null;
    }
  }

  const auth = getAuth();

  if (!auth || !auth.username || !auth.role) {
    const file = window.location.pathname.split("/").pop() || "index.html";
    const next = encodeURIComponent(file + window.location.search + window.location.hash);
    window.location.replace(`login.html?next=${next}`);
    return;
  }

  window.JSW_AUTH = auth;

  window.logoutJSWDashboard = function () {
    sessionStorage.removeItem(AUTH_KEY);
    window.location.replace("login.html");
  };

  function formatCurrentTime() {
    return new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true
    }).format(new Date());
  }

  function formatLoginTime(value) {
    if (!value) return "Session";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Session";

    return new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    }).format(date);
  }

  document.addEventListener("DOMContentLoaded", () => {
    // Prevent duplicate status bar if auth.js is included more than once.
    if (document.getElementById("jswUserStatus")) return;

    const wrapper = document.createElement("div");
    wrapper.id = "jswUserStatus";

    Object.assign(wrapper.style, {
      position: "fixed",
      right: "18px",
      bottom: "18px",
      zIndex: "9999",
      display: "flex",
      alignItems: "center",
      gap: "12px",
      padding: "10px 12px",
      border: "1px solid #cbd5e1",
      borderRadius: "10px",
      background: "rgba(255,255,255,.97)",
      color: "#0f172a",
      fontFamily: "Arial, Helvetica, sans-serif",
      fontSize: "12px",
      lineHeight: "1.35",
      boxShadow: "0 6px 20px rgba(15,23,42,.14)",
      backdropFilter: "blur(6px)"
    });

    const info = document.createElement("div");
    info.style.minWidth = "220px";

    const userLine = document.createElement("div");
    userLine.innerHTML = `<strong>Logged in:</strong> ${auth.username} <span style="color:#64748b">(${auth.role})</span>`;

    const timeLine = document.createElement("div");
    timeLine.id = "jswCurrentTime";
    timeLine.style.marginTop = "3px";
    timeLine.style.color = "#475569";

    const loginLine = document.createElement("div");
    loginLine.style.marginTop = "2px";
    loginLine.style.color = "#64748b";
    loginLine.innerHTML = `<strong>Login:</strong> ${formatLoginTime(auth.authenticatedAt || auth.loginAt)}`;

    info.appendChild(userLine);
    info.appendChild(timeLine);
    info.appendChild(loginLine);

    const button = document.createElement("button");
    button.type = "button";
    button.textContent = "Logout";
    button.setAttribute("aria-label", "Logout from dashboard");

    Object.assign(button.style, {
      border: "1px solid #cbd5e1",
      borderRadius: "8px",
      background: "#0f172a",
      color: "#ffffff",
      padding: "8px 12px",
      fontSize: "12px",
      fontWeight: "700",
      cursor: "pointer",
      whiteSpace: "nowrap"
    });

    button.addEventListener("click", window.logoutJSWDashboard);

    wrapper.appendChild(info);
    wrapper.appendChild(button);
    document.body.appendChild(wrapper);

    function updateClock() {
      const el = document.getElementById("jswCurrentTime");
      if (el) {
        el.innerHTML = `<strong>Current time:</strong> ${formatCurrentTime()}`;
      }
    }

    updateClock();
    setInterval(updateClock, 1000);

    // Hide the floating user panel when printing.
    const style = document.createElement("style");
    style.textContent = `
      @media print {
        #jswUserStatus { display: none !important; }
      }
      @media (max-width: 700px) {
        #jswUserStatus {
          left: 10px !important;
          right: 10px !important;
          bottom: 10px !important;
          justify-content: space-between !important;
        }
      }
    `;
    document.head.appendChild(style);
  });
})();