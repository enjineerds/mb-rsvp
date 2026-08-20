// Countdown to the ceremony
(function () {
  var target = new Date("2026-12-18T15:00:00+08:00").getTime();
  var daysEl = document.getElementById("cd-days");
  var hoursEl = document.getElementById("cd-hours");
  var minsEl = document.getElementById("cd-mins");
  var secsEl = document.getElementById("cd-secs");
  if (!daysEl) return;

  function pad(n) {
    return String(n).padStart(2, "0");
  }

  function tick() {
    var now = Date.now();
    var diff = target - now;
    if (diff <= 0) {
      daysEl.textContent = "00";
      hoursEl.textContent = "00";
      minsEl.textContent = "00";
      secsEl.textContent = "00";
      clearInterval(timer);
      return;
    }
    var days = Math.floor(diff / 86400000);
    var hours = Math.floor((diff % 86400000) / 3600000);
    var mins = Math.floor((diff % 3600000) / 60000);
    var secs = Math.floor((diff % 60000) / 1000);
    daysEl.textContent = pad(days);
    hoursEl.textContent = pad(hours);
    minsEl.textContent = pad(mins);
    secsEl.textContent = pad(secs);
  }
  tick();
  var timer = setInterval(tick, 1000);
})();

document.querySelectorAll(".reveal").forEach(function (el) {
  var io = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add("in");
        }
      });
    },
    { threshold: 0.15 },
  );
  io.observe(el);
});

var attendValue = null;
document.querySelectorAll(".attend-btn").forEach(function (btn) {
  btn.addEventListener("click", function () {
    document.querySelectorAll(".attend-btn").forEach(function (b) {
      b.classList.remove("active");
    });
    btn.classList.add("active");
    attendValue = btn.getAttribute("data-value");
  });
});

// --- Google Sheet sync ---
// Paste your deployed Apps Script Web App URL below (see setup instructions) to
// automatically log every RSVP into your Google Sheet. Leave blank to skip.
var SHEET_WEBHOOK_URL =
  "https://script.google.com/macros/s/AKfycbyocKHcBDDCfDBYDNta1mymO8M_5KUwF83cou8HcSc8xr6Cn6LLavxSn0V1aaPX6Uz4zw/exec";

var form = document.getElementById("rsvpForm");
var msgEl = document.getElementById("rsvpMsg");
var submitBtn = document.getElementById("submitBtn");

form.addEventListener("submit", async function (e) {
  e.preventDefault();
  var name = document.getElementById("guestName").value.trim();
  var message = document.getElementById("guestMsg").value.trim();

  if (!name) {
    msgEl.textContent = "Please enter your name.";
    return;
  }
  if (!attendValue) {
    msgEl.textContent = "Please select whether you will be attending.";
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = "Sending...";
  msgEl.textContent = "";

  var entry = {
    name: name,
    attending: attendValue,
    guests: attendValue === "yes" ? 1 : 0,
    message: message,
    timestamp: new Date().toISOString(),
  };
  var key = "rsvp:" + Date.now() + "-" + Math.random().toString(36).slice(2, 8);

  // Save to in-app storage if available (only works inside Claude's artifact viewer).
  // This is a bonus, not a requirement — it must never block the guest's RSVP.
  if (window.storage && typeof window.storage.set === "function") {
    try {
      await window.storage.set(key, JSON.stringify(entry), true);
    } catch (storageErr) {
      console.error(
        "In-app storage save failed (expected outside Claude):",
        storageErr,
      );
    }
  }

  // Send to the Google Sheet webhook if one is configured. This works from
  // any hosting, including a plain downloaded file, since it's a normal fetch.
  if (SHEET_WEBHOOK_URL) {
    try {
      await fetch(SHEET_WEBHOOK_URL, {
        method: "POST",
        mode: "no-cors",
        body: JSON.stringify(entry),
      });
    } catch (sheetErr) {
      console.error("Sheet sync failed:", sheetErr);
    }
  }

  document.getElementById("thankyouTitle").textContent =
    attendValue === "yes" ? "Thank You!" : "Thank you for letting us know";
  document.getElementById("thankyouBody").textContent =
    attendValue === "yes"
      ? "We can't wait to celebrate with you on December 18, 2026!"
      : "We'll miss you on December 18, but thank you for letting us know. You'll be in our thoughts.";
  form.style.display = "none";
  document.getElementById("thankyou").style.display = "block";
});

function escapeHtml(s) {
  var div = document.createElement("div");
  div.textContent = s;
  return div.innerHTML;
}
