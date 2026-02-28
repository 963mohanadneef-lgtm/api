// =======================
// الإعدادات
// =======================
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwUkHh5j3bwutqhUSJ83OURua7_jDPXjA3xLRvM5rKtik6IVUHo7jGF9m8hfV8BN-a9/exec';
const WHATSAPP_NUMBER_INTL = '963994059020';
const CURRENCY_DEFAULT = 'ل.س';

// =======================
// العناصر
// =======================
const loadingScreen = document.getElementById('loadingScreen');
const grid = document.getElementById('grid');
const chipsEl = document.getElementById('chips');
const chipAll = document.getElementById('chipAll');
const searchInput = document.getElementById('searchInput');
const cartBtn = document.getElementById('cartBtn');
const cartCount = document.getElementById('cartCount');
const drawer = document.getElementById('drawer');
const drawerOverlay = document.getElementById('drawerOverlay');
const drawerClose = document.getElementById('drawerClose');
const cartItemsEl = document.getElementById('cartItems');
const totalEl = document.getElementById('total');
const checkoutBtn = document.getElementById('checkoutBtn');
const modal = document.getElementById('modal');
const modalOverlay = document.getElementById('modalOverlay');
const modalClose = document.getElementById('modalClose');
const form = document.getElementById('form');
const nameEl = document.getElementById('name');
const phoneEl = document.getElementById('phone');
const notesEl = document.getElementById('notes');
const locTextEl = document.getElementById('locText');
const mapLinkEl = document.getElementById('mapLink');
const geoBtn = document.getElementById('geoBtn');
const scrollToMenu = document.getElementById('scrollToMenu');

// =======================
// الحالة
// =======================
let items = []; // مصفوفة العناصر مباشرة
let categories = []; // مصفوفة التصنيفات الفريدة
let activeCat = 'all';
let cart = new Map();

// =======================
// دوال مساعدة
// =======================
function money(n, cur) {
  const v = Number(n) || 0;
  return `${v.toLocaleString('ar')} ${cur || CURRENCY_DEFAULT}`;
}

/**
 * ✅ أهم دالة: تجعل الموقع يعرض أي صورة من أي رابط
 * - تدعم Google Drive وتحوله لرابط مباشر
 * - تعالج منع الـ Hotlink/CORS عبر Proxy
 * - وتضع fallback لو الرابط فاضي
 */
function fixImageUrl(url, fallback) {
  const FALLBACK = fallback || 'https://via.placeholder.com/400x300/12161f/d7b46a?text=براند';
  if (!url) return FALLBACK;

  let u = String(url).trim();
  if (!u) return FALLBACK;

  // إذا كان data:image/... (base64) خليها كما هي
  if (u.startsWith('data:image/')) return u;

  // Google Drive: استخرج fileId وحوله لرابط مباشر ثابت
  if (u.includes('drive.google.com')) {
    const idMatch =
      u.match(/[a-zA-Z0-9_-]{25,}/); // يلتقط fileId غالبًا
    if (idMatch) {
      return `https://lh3.googleusercontent.com/d/${idMatch[0]}`;
    }
  }

  // لو رابط غير http/https اعتبره غير صالح
  if (!/^https?:\/\//i.test(u)) return FALLBACK;

  // بعض المواقع تمنع عرض الصورة (Hotlink/CORS) => نمررها عبر Proxy
  // مهم: weserv.nl يحتاج URL بدون بروتوكول أحيانًا، لكن يقبل encodeURIComponent كامل أيضًا.
  return `https://images.weserv.nl/?url=${encodeURIComponent(u)}`;
}

function openDrawer() {
  drawer.setAttribute('aria-hidden', 'false');
}

function closeDrawer() {
  drawer.setAttribute('aria-hidden', 'true');
}

function openModal() {
  modal.setAttribute('aria-hidden', 'false');
}

function closeModal() {
  modal.setAttribute('aria-hidden', 'true');
}

function calcCart() {
  let count = 0, total = 0, cur = CURRENCY_DEFAULT;
  for (const [, v] of cart) {
    count += v.qty;
    total += (Number(v.item.price) || 0) * v.qty;
    cur = v.item.currency || cur;
  }
  cartCount.textContent = String(count);
  totalEl.textContent = money(total, cur);
}

// =======================
// تحميل البيانات
// =======================
async function fetchMenu() {
  try {
    updateProgress(10);

    const response = await fetch(SCRIPT_URL);
    updateProgress(50);

    const payload = await response.json();
    updateProgress(80);

    console.log('البيانات المستلمة:', payload);

    if (!Array.isArray(payload)) {
      throw new Error('بيانات غير صالحة');
    }

    items = payload;

    const uniqueCategories = [...new Set(items.map(item => item.category))];
    categories = uniqueCategories.map(cat => ({
      id: cat,
      name: cat,
      items: items.filter(item => item.category === cat)
    }));

    console.log('التصنيفات:', categories);

    updateProgress(90);
    renderAll();
    updateProgress(100);

    hideLoadingScreen();
  } catch (e) {
    console.error('خطأ في التحميل:', e);
    updateProgress(100);
    hideLoadingScreen();
  }
}

function hideLoadingScreen() {
  setTimeout(() => {
    loadingScreen.classList.add('hidden');
  }, 800);
}

// تحديث شريط التقدم
function updateProgress(percent) {
  const progressBar = document.getElementById('progressBar');
  const progressPercent = document.getElementById('progressPercent');

  if (progressBar) {
    progressBar.style.width = percent + '%';
  }

  if (progressPercent) {
    progressPercent.textContent = percent;
  }
}

// =======================
// الرسم
// =======================
function renderAll() {
  renderChips();
  renderGrid();
  renderCart();
}

function setActiveChip(cat) {
  activeCat = cat;
  chipAll.classList.toggle('category-btn--active', cat === 'all');
  const btns = chipsEl.querySelectorAll('.category-btn');
  btns.forEach(b => b.classList.toggle('category-btn--active', b.dataset.cat === cat));
  renderGrid();
}

function renderChips() {
  chipsEl.innerHTML = '';

  categories.forEach(cat => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'category-btn';
    btn.dataset.cat = cat.id;
    btn.textContent = cat.name;
    btn.addEventListener('click', () => setActiveChip(cat.id));
    chipsEl.appendChild(btn);
  });

  setActiveChip(activeCat);
}

function matchSearch(item, q) {
  if (!q) return true;
  const s = q.trim().toLowerCase();
  return (item.name || '').toLowerCase().includes(s) ||
         (item.description || '').toLowerCase().includes(s);
}

function renderGrid() {
  const q = searchInput.value || '';
  grid.innerHTML = '';

  let itemsToShow = [];

  if (activeCat === 'all') {
    itemsToShow = items.filter(item => item.featured === true && item.available !== false);
  } else {
    itemsToShow = items.filter(item => item.category === activeCat && item.available !== false);
  }

  itemsToShow = itemsToShow.filter(item => matchSearch(item, q));

  for (const item of itemsToShow) {
    const card = document.createElement('article');
    card.className = 'card';

    const imgWrap = document.createElement('div');
    imgWrap.className = 'card__img';

    const img = document.createElement('img');
    img.loading = 'lazy';
    img.alt = item.name || '';

    const fallback = 'https://via.placeholder.com/400x300/12161f/d7b46a?text=براند';

    // ✅ هنا التعديل الأساسي: أي رابط يتحول لصيغة قابلة للعرض
    img.src = fixImageUrl(item.image_url, fallback);

    // ✅ لو فشل البروكسي/الرابط نهائيًا
    img.onerror = () => { img.src = fallback; };

    imgWrap.appendChild(img);

    const body = document.createElement('div');
    body.className = 'card__body';

    const name = document.createElement('div');
    name.className = 'card__name';
    name.textContent = item.name || '';

    const desc = document.createElement('p');
    desc.className = 'card__desc';
    desc.textContent = item.description || '';

    const foot = document.createElement('div');
    foot.className = 'card__foot';

    const price = document.createElement('div');
    price.className = 'card__price';
    price.textContent = money(item.price, item.currency);

    const add = document.createElement('button');
    add.className = 'card__add-btn';
    add.type = 'button';
    add.textContent = 'أضف';
    add.addEventListener('click', () => addToCart(item));

    foot.appendChild(price);
    foot.appendChild(add);

    body.appendChild(name);
    body.appendChild(desc);
    body.appendChild(foot);

    card.appendChild(imgWrap);
    card.appendChild(body);
    grid.appendChild(card);
  }

  if (grid.children.length === 0) {
    grid.innerHTML = '<div style="text-align: center; padding: 3rem; color: var(--text-muted);">لا توجد أصناف</div>';
  }
}

// =======================
// السلة
// =======================
function addToCart(item) {
  const id = String(item.item_id || item.id);
  const v = cart.get(id);
  if (v) v.qty += 1;
  else cart.set(id, { item, qty: 1 });
  renderCart();
  openDrawer();
}

function renderCart() {
  cartItemsEl.innerHTML = '';

  if (cart.size === 0) {
    cartItemsEl.innerHTML = '<div style="text-align: center; color: var(--text-muted); padding: 2rem;">السلة فارغة</div>';
    calcCart();
    return;
  }

  for (const [id, v] of cart) {
    const row = document.createElement('div');
    row.className = 'cart-item';

    const img = document.createElement('img');
    img.className = 'cart-item__img';
    img.alt = v.item.name || '';

    const fallback = 'https://via.placeholder.com/60/12161f/d7b46a?text=براند';

    // ✅ نفس التعديل بالسلة
    img.src = fixImageUrl(v.item.image_url, fallback);
    img.onerror = () => { img.src = fallback; };

    const info = document.createElement('div');
    info.className = 'cart-item__info';

    const title = document.createElement('div');
    title.className = 'cart-item__title';
    title.textContent = v.item.name || '';

    const price = document.createElement('div');
    price.className = 'cart-item__price';
    price.textContent = money(v.item.price, v.item.currency);

    info.appendChild(title);
    info.appendChild(price);

    const qty = document.createElement('div');
    qty.className = 'cart-item__qty';

    const minus = document.createElement('button');
    minus.className = 'cart-item__qty-btn';
    minus.textContent = '−';
    minus.onclick = () => changeQty(id, -1);

    const q = document.createElement('strong');
    q.textContent = v.qty;

    const plus = document.createElement('button');
    plus.className = 'cart-item__qty-btn';
    plus.textContent = '+';
    plus.onclick = () => changeQty(id, 1);

    qty.appendChild(minus);
    qty.appendChild(q);
    qty.appendChild(plus);

    const del = document.createElement('button');
    del.className = 'cart-item__remove';
    del.textContent = 'حذف';
    del.onclick = () => {
      cart.delete(id);
      renderCart();
    };

    row.appendChild(img);
    row.appendChild(info);
    row.appendChild(qty);
    row.appendChild(del);

    cartItemsEl.appendChild(row);
  }

  calcCart();
}

function changeQty(id, delta) {
  const v = cart.get(id);
  if (!v) return;
  v.qty += delta;
  if (v.qty <= 0) cart.delete(id);
  renderCart();
}

// =======================
// GPS
// =======================
function showLocationMessage() {
  let message = document.getElementById('locationMessage');

  if (!message) {
    message = document.createElement('div');
    message.id = 'locationMessage';
    message.className = 'location-message';
    message.innerHTML = `
      <div class="location-message-content">
        <div class="location-icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#fbbf24" stroke="#fbbf24" stroke-width="1.5"/>
            <circle cx="12" cy="9" r="3" fill="white"/>
          </svg>
        </div>
        <span class="location-text">جاري تحديد موقعك...</span>
        <div class="location-dot"></div>
      </div>
    `;
    document.body.appendChild(message);
  }

  setTimeout(() => {
    message.classList.add('show');
  }, 10);
}

function hideLocationMessage() {
  const message = document.getElementById('locationMessage');
  if (message) {
    message.classList.remove('show');
    setTimeout(() => {
      if (message.parentNode) {
        message.parentNode.removeChild(message);
      }
    }, 300);
  }
}

function getMyLocation() {
  if (!navigator.geolocation) {
    alert('متصفحك لا يدعم تحديد الموقع');
    return;
  }

  showLocationMessage();

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      hideLocationMessage();

      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      mapLinkEl.value = `https://maps.google.com/?q=${lat},${lng}`;

      showLocationSuccess();
    },
    (error) => {
      hideLocationMessage();

      let errorMessage = 'حدث خطأ في تحديد الموقع';
      if (error.code === 1) {
        errorMessage = 'الرجاء السماح بتحديد الموقع';
      } else if (error.code === 2) {
        errorMessage = 'تعذر تحديد الموقع';
      } else if (error.code === 3) {
        errorMessage = 'انتهت مهلة تحديد الموقع';
      }

      alert(errorMessage);
    }
  );
}

function showLocationSuccess() {
  let success = document.getElementById('locationSuccess');

  if (!success) {
    success = document.createElement('div');
    success.id = 'locationSuccess';
    success.className = 'location-success';
    success.innerHTML = `
      <div class="location-success-content">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <path d="M20 6L9 17L4 12" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span>تم تحديد الموقع</span>
      </div>
    `;
    document.body.appendChild(success);
  }

  success.classList.add('show');

  setTimeout(() => {
    success.classList.remove('show');
    setTimeout(() => {
      if (success.parentNode) {
        success.parentNode.removeChild(success);
      }
    }, 300);
  }, 2000);
}

// =======================
// واتساب
// =======================
function buildOrderText() {
  const nm = nameEl.value.trim();
  const ph = phoneEl.value.trim();
  const notes = notesEl.value.trim();
  const locText = locTextEl.value.trim();
  const map = mapLinkEl.value.trim();

  let lines = ['🍽️ طلب جديد'];
  lines.push('—');
  lines.push(`👤 ${nm}`);
  lines.push(`📞 ${ph}`);
  if (locText) lines.push(`📍 ${locText}`);
  if (map) lines.push(`🗺️ ${map}`);
  if (notes) lines.push(`📝 ${notes}`);
  lines.push('—');
  lines.push('الطلبات:');

  let total = 0;
  let cur = CURRENCY_DEFAULT;

  for (const [, v] of cart) {
    const p = Number(v.item.price) || 0;
    cur = v.item.currency || cur;
    total += p * v.qty;
    lines.push(`${v.item.name} ×${v.qty} = ${money(p * v.qty, cur)}`);
  }

  lines.push('—');
  lines.push(`💰 المجموع: ${money(total, cur)}`);
  return lines.join('\n');
}

function sendWhatsApp() {
  if (cart.size === 0) {
    alert('السلة فارغة');
    return;
  }
  if (!nameEl.value.trim() || !phoneEl.value.trim()) {
    alert('الرجاء إكمال البيانات');
    return;
  }
  const text = buildOrderText();
  window.open(`https://wa.me/${WHATSAPP_NUMBER_INTL}?text=${encodeURIComponent(text)}`, '_blank');
}

// =======================
// الأحداث
// =======================
chipAll.onclick = () => setActiveChip('all');
searchInput.addEventListener('input', renderGrid);
cartBtn.onclick = openDrawer;
drawerOverlay.onclick = closeDrawer;
drawerClose.onclick = closeDrawer;
checkoutBtn.onclick = () => {
  if (cart.size === 0) {
    alert('السلة فارغة');
    return;
  }
  closeDrawer();
  openModal();
};
modalOverlay.onclick = closeModal;
modalClose.onclick = closeModal;
geoBtn.onclick = getMyLocation;
form.addEventListener('submit', (e) => {
  e.preventDefault();
  sendWhatsApp();
});
scrollToMenu.onclick = () => document.getElementById('menuSection').scrollIntoView({ behavior: 'smooth' });

// بدء التشغيل
fetchMenu();