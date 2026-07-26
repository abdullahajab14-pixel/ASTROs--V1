// أنيميشن الهيرو المرتبط بالسكرول (سلسلة صور)
const heroSection = document.getElementById("home");
const heroCanvas = document.getElementById("heroCanvas");
const ctx = heroCanvas.getContext("2d");
const siteHeader = document.querySelector(".header");
const heroContent = document.querySelector(".hero-content");
const REVEAL_THRESHOLD = 0.98;
const CROP_BOTTOM = 0.16;
const SCRUB_END = 0.8;

const FRAME_COUNT = 101;
const FRAME_STEP = 1;
let currentFrameIndex = -1;

function frameSrc(index) {
  const num = String(index + 1).padStart(3, "0");
  return `hero/ezgif-frame-${num}.png`;
}

const frameCache = new Map();
function getFrame(index) {
  const snapped = Math.min(FRAME_COUNT - 1, Math.round(index / FRAME_STEP) * FRAME_STEP);
  if (!frameCache.has(snapped)) {
    const img = new Image();
    img.src = frameSrc(snapped);
    frameCache.set(snapped, img);
  }
  return frameCache.get(snapped);
}

// نجهز أول كم فريم بالخلفية بصمت فور ما تفتح الصفحة، عشان لو سكرولت بسرعة من البداية ما يصير تقطيع
const HERO_PRELOAD_COUNT = 10;
for (let i = 0; i < HERO_PRELOAD_COUNT; i++) {
  getFrame(i);
}

function resizeHeroCanvas() {
  heroCanvas.width = heroCanvas.clientWidth * window.devicePixelRatio;
  heroCanvas.height = heroCanvas.clientHeight * window.devicePixelRatio;
  currentFrameIndex = -1;
  const scrubProgress = heroScrubProgress();
  drawHeroFrame(Math.round(scrubProgress * (FRAME_COUNT - 1)));
  updateHeroReveal(scrubProgress);
}

function drawImageCover(img) {
  if (!img || !img.complete || img.naturalWidth === 0) return;

  // نقص الجزء السفلي من الفيديو حيث تقع العلامة المائية قبل رسم الإطار
  const sx = 0;
  const sy = 0;
  const sw = img.naturalWidth;
  const sh = img.naturalHeight * (1 - CROP_BOTTOM);

  const canvasRatio = heroCanvas.width / heroCanvas.height;
  const cropRatio = sw / sh;

  let drawWidth, drawHeight, offsetX, offsetY;
  if (cropRatio > canvasRatio) {
    drawHeight = heroCanvas.height;
    drawWidth = drawHeight * cropRatio;
    offsetX = (heroCanvas.width - drawWidth) / 2;
    offsetY = 0;
  } else {
    drawWidth = heroCanvas.width;
    drawHeight = drawWidth / cropRatio;
    offsetX = 0;
    offsetY = (heroCanvas.height - drawHeight) / 2;
  }

  ctx.clearRect(0, 0, heroCanvas.width, heroCanvas.height);
  ctx.drawImage(img, sx, sy, sw, sh, offsetX, offsetY, drawWidth, drawHeight);
}

function drawHeroFrame(index) {
  if (index === currentFrameIndex) return;
  const img = getFrame(index);
  if (!img.complete || img.naturalWidth === 0) {
    img.addEventListener("load", () => drawHeroFrame(index), { once: true });
    return;
  }
  currentFrameIndex = index;
  drawImageCover(img);
}

function heroProgress() {
  const rect = heroSection.getBoundingClientRect();
  const scrollableDistance = heroSection.offsetHeight - window.innerHeight;
  return scrollableDistance > 0
    ? Math.min(Math.max(-rect.top / scrollableDistance, 0), 1)
    : 0;
}

// يوقف تشغيل الفريمات عند SCRUB_END من مسافة السكرول، والباقي يبقى الفريم الأخير ثابتاً مع ظهور النص قبل الانتقال للقسم التالي
function heroScrubProgress() {
  return Math.min(1, heroProgress() / SCRUB_END);
}

function updateHeroReveal(progress) {
  const revealed = progress >= REVEAL_THRESHOLD;
  siteHeader.classList.toggle("visible", revealed);
  heroContent.classList.toggle("visible", revealed);
}

let heroTicking = false;
function onHeroScroll() {
  if (heroTicking) return;
  heroTicking = true;
  requestAnimationFrame(() => {
    const scrubProgress = heroScrubProgress();
    drawHeroFrame(Math.round(scrubProgress * (FRAME_COUNT - 1)));
    updateHeroReveal(scrubProgress);
    heroTicking = false;
  });
}

window.addEventListener("resize", resizeHeroCanvas);
window.addEventListener("scroll", onHeroScroll);
resizeHeroCanvas();

// أنيميشن قسم الخدمات المرتبط بالسكرول (سلسلة صور)
const servicesSection = document.getElementById("services");
const servicesCanvas = document.getElementById("servicesCanvas");
const servicesCtx = servicesCanvas.getContext("2d");
const SERVICES_FRAME_COUNT = 101;
const SERVICES_FRAME_STEP = 2;
const SERVICES_CROP_BOTTOM = 0.16;
const SERVICES_SCRUB_END = 0.85;
let servicesCurrentFrameIndex = -1;

// نطاقات الفريمات اللي يشاور فيها رائد الفضاء (يمين = موقع سيء، يسار = موقع جميل)
const BAD_SITE_RANGE = [24, 54];
const GOOD_SITE_RANGE = [63, 88];
const siteMockBad = document.getElementById("siteMockBad");
const siteMockGood = document.getElementById("siteMockGood");
const goodSiteVideo = document.getElementById("goodSiteVideo");
let goodSiteVideoPlaying = false;
let hasBadShown = false;
let hasGoodShown = false;

// نحمّل فيديو الموقع الجميل بالخلفية بدري (حجمه صغير الحين)، عشان ما يصير توقف لحظة ما يشتغل فعلياً
const idlePreloadVideo = window.requestIdleCallback || ((cb) => setTimeout(cb, 800));
idlePreloadVideo(() => {
  if (!goodSiteVideo.src && goodSiteVideo.dataset.src) {
    goodSiteVideo.preload = "auto";
    goodSiteVideo.src = goodSiteVideo.dataset.src;
  }
});

const INTRO_START = 8;
const captionIntro = document.getElementById("captionIntro");
const captionFrom = document.getElementById("captionFrom");
const captionTo = document.getElementById("captionTo");
let hasIntroTyped = false;
let hasFromTyped = false;
let hasToTyped = false;

function servicesFrameSrc(index) {
  const num = String(index + 1).padStart(3, "0");
  return `servs_hq/ezgif-frame-${num}.png`;
}

const servicesFrameCache = new Map();
function getServicesFrame(index) {
  const snapped = Math.min(SERVICES_FRAME_COUNT - 1, Math.round(index / SERVICES_FRAME_STEP) * SERVICES_FRAME_STEP);
  if (!servicesFrameCache.has(snapped)) {
    const img = new Image();
    img.src = servicesFrameSrc(snapped);
    servicesFrameCache.set(snapped, img);
  }
  return servicesFrameCache.get(snapped);
}

// نجهز أول كم فريم من الخدمات بعد ما يخلص المتصفح شغله المهم (أولوية أقل من الهيرو)
const idlePreload = window.requestIdleCallback || ((cb) => setTimeout(cb, 1500));
idlePreload(() => {
  for (let i = 0; i < 6; i++) getServicesFrame(i);
});

function drawServicesImageCover(img) {
  if (!img || !img.complete || img.naturalWidth === 0) return;

  const sx = 0;
  const sy = 0;
  const sw = img.naturalWidth;
  const sh = img.naturalHeight * (1 - SERVICES_CROP_BOTTOM);

  const canvasRatio = servicesCanvas.width / servicesCanvas.height;
  const cropRatio = sw / sh;

  let drawWidth, drawHeight, offsetX, offsetY;
  if (cropRatio > canvasRatio) {
    drawHeight = servicesCanvas.height;
    drawWidth = drawHeight * cropRatio;
    offsetX = (servicesCanvas.width - drawWidth) / 2;
    offsetY = 0;
  } else {
    drawWidth = servicesCanvas.width;
    drawHeight = drawWidth / cropRatio;
    offsetX = 0;
    offsetY = (servicesCanvas.height - drawHeight) / 2;
  }

  servicesCtx.clearRect(0, 0, servicesCanvas.width, servicesCanvas.height);
  servicesCtx.drawImage(img, sx, sy, sw, sh, offsetX, offsetY, drawWidth, drawHeight);
}

function drawServicesFrame(index) {
  if (index === servicesCurrentFrameIndex) return;
  const img = getServicesFrame(index);
  if (!img.complete || img.naturalWidth === 0) {
    img.addEventListener("load", () => drawServicesFrame(index), { once: true });
    return;
  }
  servicesCurrentFrameIndex = index;
  drawServicesImageCover(img);
}

function updateSiteMocks(index) {
  const isBad = index >= BAD_SITE_RANGE[0] && index <= BAD_SITE_RANGE[1];
  const isGood = index >= GOOD_SITE_RANGE[0] && index <= GOOD_SITE_RANGE[1];

  if (isBad) hasBadShown = true;
  if (isGood) hasGoodShown = true;

  if (!hasIntroTyped && index >= INTRO_START) {
    hasIntroTyped = true;
    captionIntro.style.width = captionIntro.scrollWidth + "px";
  }
  if (hasBadShown && !hasFromTyped) {
    hasFromTyped = true;
    captionFrom.style.width = captionFrom.scrollWidth + "px";
  }
  if (hasGoodShown && !hasToTyped) {
    hasToTyped = true;
    captionTo.style.width = captionTo.scrollWidth + "px";
  }

  siteMockBad.classList.toggle("visible", hasBadShown);
  siteMockGood.classList.toggle("visible", hasGoodShown);

  servicesCanvas.classList.toggle("pan-right", isBad);
  servicesCanvas.classList.toggle("pan-left", isGood);

  if (hasGoodShown && !goodSiteVideoPlaying) {
    goodSiteVideoPlaying = true;
    if (!goodSiteVideo.src && goodSiteVideo.dataset.src) {
      goodSiteVideo.src = goodSiteVideo.dataset.src;
    }
    goodSiteVideo.play().catch(() => {});
  }
}

function servicesProgress() {
  const rect = servicesSection.getBoundingClientRect();
  const scrollableDistance = servicesSection.offsetHeight - window.innerHeight;
  return scrollableDistance > 0
    ? Math.min(Math.max(-rect.top / scrollableDistance, 0), 1)
    : 0;
}

// يوقف تشغيل الفريمات عند SERVICES_SCRUB_END، والباقي سكرول ثابت على الفريم الأخير قبل الانتقال للقسم التالي
function servicesScrubProgress() {
  return Math.min(1, servicesProgress() / SERVICES_SCRUB_END);
}

function resizeServicesCanvas() {
  servicesCanvas.width = servicesCanvas.clientWidth * window.devicePixelRatio;
  servicesCanvas.height = servicesCanvas.clientHeight * window.devicePixelRatio;
  servicesCurrentFrameIndex = -1;
  const index = Math.round(servicesScrubProgress() * (SERVICES_FRAME_COUNT - 1));
  drawServicesFrame(index);
  updateSiteMocks(index);
}

let servicesTicking = false;
function onServicesScroll() {
  if (servicesTicking) return;
  servicesTicking = true;
  requestAnimationFrame(() => {
    const index = Math.round(servicesScrubProgress() * (SERVICES_FRAME_COUNT - 1));
    drawServicesFrame(index);
    updateSiteMocks(index);
    servicesTicking = false;
  });
}

window.addEventListener("resize", resizeServicesCanvas);
window.addEventListener("scroll", onServicesScroll);
resizeServicesCanvas();

// نوقف فيديو الموقع الجميل لما تطلع من قسم الخدمات عشان يقل الضغط، ونرجعه يشتغل لو رجعت له
const goodSiteVideoObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting && hasGoodShown) {
        goodSiteVideo.play().catch(() => {});
      } else {
        goodSiteVideo.pause();
      }
    });
  },
  { threshold: 0 }
);
goodSiteVideoObserver.observe(servicesSection);

// تايم لاين صفحة الأعمال المرتبط بالسكرول: كل خطوة تصغر وتصعد فوق مع خط يوصلها بالي بعدها
const portfolioSection = document.getElementById("work");
const timelineItems = document.querySelectorAll("#timeline .tl-item");
const timelineConnectors = document.querySelectorAll("#timeline .tl-connector");
const PORTFOLIO_STEPS = timelineItems.length;
const PORTFOLIO_SCRUB_END = 0.8; // الأيقونات الأربعة تخلص عند ٨٠٪ من مسافة السكرول، والباقي سكرول ثابت قبل ما ينتقل للقسم التالي
let portfolioIndex = -1;

function portfolioProgress() {
  const rect = portfolioSection.getBoundingClientRect();
  const scrollableDistance = portfolioSection.offsetHeight - window.innerHeight;
  return scrollableDistance > 0
    ? Math.min(Math.max(-rect.top / scrollableDistance, 0), 1)
    : 0;
}

function portfolioScrubProgress() {
  return Math.min(1, portfolioProgress() / PORTFOLIO_SCRUB_END);
}

function updatePortfolioTimeline() {
  const progress = portfolioScrubProgress();
  const index = Math.min(PORTFOLIO_STEPS - 1, Math.floor(progress * PORTFOLIO_STEPS));
  if (index === portfolioIndex) return;
  portfolioIndex = index;

  timelineItems.forEach((item, i) => {
    item.classList.remove("active", "done");
    if (i === index) item.classList.add("active");
    else if (i < index) item.classList.add("done");
  });

  timelineConnectors.forEach((connector, i) => {
    connector.classList.toggle("grown", index > i);
  });
}

let portfolioTicking = false;
function onPortfolioScroll() {
  if (portfolioTicking) return;
  portfolioTicking = true;
  requestAnimationFrame(() => {
    updatePortfolioTimeline();
    portfolioTicking = false;
  });
}

window.addEventListener("scroll", onPortfolioScroll);
updatePortfolioTimeline();

// خطوط الإشارة الثلاثة (SERVICES / DESIGN / SUPPORT) ما تبين إلا أول ما توصل صفحة الأعمال فعلياً، وترسم نفسها بالتتابع
const portfolioCallouts = document.querySelectorAll(".portfolio-callout");
const portfolioCalloutObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        portfolioCallouts.forEach((el) => el.classList.add("revealed"));
        portfolioCalloutObserver.disconnect();
      }
    });
  },
  { threshold: 0.05 }
);
portfolioCalloutObserver.observe(portfolioSection);

// قائمة الجوال
const menuToggle = document.getElementById("menuToggle");
const navLinks = document.querySelector(".nav-links");

menuToggle.addEventListener("click", () => {
  navLinks.classList.toggle("active");
});

navLinks.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    navLinks.classList.remove("active");
  });
});

// زر العودة للأعلى
const scrollTopBtn = document.getElementById("scrollTopBtn");

let scrollTopTicking = false;
window.addEventListener("scroll", () => {
  if (scrollTopTicking) return;
  scrollTopTicking = true;
  requestAnimationFrame(() => {
    scrollTopBtn.classList.toggle("visible", window.scrollY > 400);
    scrollTopTicking = false;
  });
});

scrollTopBtn.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
});

// تمرير سلس للروابط
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", (e) => {
    const target = document.querySelector(anchor.getAttribute("href"));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: "smooth" });
    }
  });
});

// نموذج التواصل
const contactForm = document.getElementById("contactForm");
const formStatus = document.getElementById("formStatus");

contactForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const message = document.getElementById("message").value.trim();

  if (!name || !email || !message) {
    formStatus.textContent = "يرجى تعبئة جميع الحقول.";
    formStatus.className = "form-status error";
    return;
  }

  formStatus.textContent = `شكراً لك ${name}، تم استلام رسالتك وسنتواصل معك قريباً!`;
  formStatus.className = "form-status success";
  contactForm.reset();
});
