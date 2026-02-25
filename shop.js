import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const firebaseConfig = { apiKey: "AIzaSyCEu5mpMHT7REOcHk9LiHCOyqzbfahFqB0", authDomain: "magazine-9e774.firebaseapp.com", projectId: "magazine-9e774", storageBucket: "magazine-9e774.firebasestorage.app", messagingSenderId: "865604014690", appId: "1:865604014690:web:11aa52fa2c8f34b462373b", measurementId: "G-Z44LH253C4" };
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const ADMIN_EMAIL = "admin@fashion.com";

let allProducts = []; 
let currentUser = null;
let currentOpenProduct = null;
let cart = JSON.parse(localStorage.getItem('myShoppingCart')) || [];
let state = { gender: 'all', category: 'all', search: '', sort: 'default' };

onAuthStateChanged(auth, (user) => {
    const authBtn = document.getElementById('auth-btn');
    if (user) {
        currentUser = user;
        if(authBtn) { authBtn.innerText = "ИЗХОД"; authBtn.onclick = () => { signOut(auth).then(() => window.location.reload()); }; }
        if(user.email === ADMIN_EMAIL) {
            document.getElementById('admin-panel').style.display = 'block';
            document.getElementById('admin-badge').style.display = 'inline-block';
        }
    } else {
        currentUser = null;
        if(authBtn) { authBtn.innerText = "ВХОД"; authBtn.href = "login.html"; authBtn.onclick = null; }
        document.getElementById('admin-panel').style.display = 'none';
        document.getElementById('admin-badge').style.display = 'none';
    }
    loadProductsFromDB(); 
    window.updateCartCount();
});

window.applyFilters = function() {
    let filtered = allProducts;
    if (state.gender !== 'all') { filtered = filtered.filter(p => p.gender === state.gender || p.gender === 'unisex' || !p.gender); }
    if (state.category !== 'all') { filtered = filtered.filter(p => p.category === state.category); }
    if (state.search !== '') { filtered = filtered.filter(p => p.title.toLowerCase().includes(state.search)); }

    filtered.sort((a, b) => {
        let realPriceA = a.discount > 0 ? a.price - (a.price * (a.discount / 100)) : a.price;
        let realPriceB = b.discount > 0 ? b.price - (b.price * (b.discount / 100)) : b.price;
        if (state.sort === 'price-asc') return realPriceA - realPriceB;
        if (state.sort === 'price-desc') return realPriceB - realPriceA;
        return 0; 
    });

    renderProducts(filtered);
}

window.selectGender = function(gender, btn) {
    document.querySelectorAll('#gender-selection .cat-btn').forEach(b => b.classList.remove('active'));
    if(btn) btn.classList.add('active');
    
    state.gender = gender;
    document.getElementById('categories-wrapper').style.display = 'flex';
    
    document.querySelectorAll('#categories-wrapper .cat-btn').forEach(b => b.classList.remove('active'));
    document.querySelector('#categories-wrapper .cat-btn:first-child').classList.add('active');
    state.category = 'all';
    
    window.applyFilters();
}

window.selectCategory = function(category, btn) {
    document.querySelectorAll('#categories-wrapper .cat-btn').forEach(b => b.classList.remove('active'));
    if(btn) btn.classList.add('active');
    state.category = category;
    window.applyFilters();
}

document.getElementById('search-input').addEventListener('input', (e) => {
    state.search = e.target.value.toLowerCase().trim();
    window.applyFilters();
});
document.getElementById('sort-select').addEventListener('change', (e) => {
    state.sort = e.target.value;
    window.applyFilters();
});

window.updateCartCount = function() {
    const el = document.getElementById('cart-badge-count');
    if(el) { el.innerText = cart.length; el.style.display = cart.length > 0 ? 'inline-flex' : 'none'; }
}
window.saveCart = function() { localStorage.setItem('myShoppingCart', JSON.stringify(cart)); window.updateCartCount(); }
window.addToCart = function(title, price, img, size) {
    cart.push({ id: Date.now(), title, price: Number(price), img, size });
    window.saveCart(); alert(`✅ Добавено: ${title}`);
}
window.removeFromCart = function(index) { cart.splice(index, 1); window.saveCart(); window.openCartModal(); }

window.openCartModal = function() {
    const container = document.getElementById('cart-items-container');
    const totalEl = document.getElementById('cart-total-price');
    container.innerHTML = '';
    let total = 0;
    if (cart.length === 0) container.innerHTML = '<p style="text-align:center; color:#cccccc; padding:20px;">Количката е празна.</p>';
    else {
        cart.forEach((item, index) => {
            total += item.price;
            container.innerHTML += `
                <div style="display:flex; align-items:center; margin-bottom:15px; border-bottom:1px solid #333; padding-bottom:10px;">
                    <img src="${item.img}" style="width:50px; height:50px; object-fit:cover; border-radius:5px; margin-right:15px;">
                    <div style="flex:1;">
                        <div style="font-weight:bold; color:#f0f0f0;">${item.title}</div>
                        <div style="font-size:12px; color:#cccccc;">Размер: ${item.size}</div>
                        <div style="color:#d000ff;">${item.price.toFixed(2)} €</div>
                    </div>
                    <button onclick="removeFromCart(${index})" style="background:red; color:white; border:none; padding:5px 10px; border-radius:5px; cursor:pointer;">X</button>
                </div>`;
        });
    }
    totalEl.innerText = total.toFixed(2) + " €";
    document.getElementById('cartModal').style.display = 'block';
}
window.closeCartModal = function() { document.getElementById('cartModal').style.display = 'none'; }

window.openProductModal = function(product) {
    currentOpenProduct = product;
    document.getElementById('pm-img').src = product.img;
    document.getElementById('pm-title').innerText = product.title;
    
    const priceContainer = document.getElementById('pm-price-container');
    if (product.discount > 0) {
        let finalPrice = product.price - (product.price * (product.discount / 100));
        priceContainer.innerHTML = `
            <span style="text-decoration:line-through; color:#666; font-size:18px;">${product.price} €</span>
            <span style="color:red; font-size:28px; font-weight:bold; margin-left:10px;">${finalPrice.toFixed(2)} €</span>
            <span style="background:red; color:white; padding:2px 6px; border-radius:5px; font-size:14px; vertical-align:middle;">-${product.discount}%</span>
        `;
        currentOpenProduct.realPrice = finalPrice;
    } else {
        priceContainer.innerHTML = `<span style="color:#d000ff; font-size:24px; font-weight:bold;">${product.price} €</span>`;
        currentOpenProduct.realPrice = product.price;
    }

    document.getElementById('pm-desc').innerText = product.description || "Няма описание.";
    
    const sizeContainer = document.getElementById('dynamic-size-options');
    sizeContainer.innerHTML = '';
    
    const sizesObj = product.sizes || { S: 1, M: 1, L: 1, XL: 1 };
    let firstAvailableSize = null;

    ['S', 'M', 'L', 'XL'].forEach(sz => {
        const qty = Number(sizesObj[sz]) || 0;
        const btn = document.createElement('div');
        
        if (qty > 0 || !product.sizes) {
            btn.className = 'size-btn';
            btn.innerText = sz;
            btn.onclick = () => window.selectSize(btn, sz);
            if(!firstAvailableSize) { firstAvailableSize = btn; document.getElementById('selected-size').value = sz; }
        } else {
            btn.className = 'size-btn disabled';
            btn.innerText = sz;
        }
        sizeContainer.appendChild(btn);
    });

    const addBtn = document.getElementById('add-to-cart-btn');
    if (firstAvailableSize) {
        firstAvailableSize.classList.add('active'); 
        addBtn.disabled = false; addBtn.innerText = "ДОБАВИ В КОЛИЧКАТА"; addBtn.style.background = "#28a745";
    } else {
        document.getElementById('selected-size').value = "";
        addBtn.disabled = true; addBtn.innerText = "ИЗЧЕРПАНА НАЛИЧНОСТ"; addBtn.style.background = "#555";
    }
    document.getElementById('productModal').style.display = "block";
}
window.closeProductModal = function() { document.getElementById('productModal').style.display = "none"; }

window.selectSize = function(element, size) {
    document.querySelectorAll('.size-btn').forEach(btn => btn.classList.remove('active'));
    if(element) element.classList.add('active');
    document.getElementById('selected-size').value = size;
}

window.addProductToCartUI = function() {
    const size = document.getElementById('selected-size').value;
    if(!size) return alert("Моля, изберете размер!");
    let priceToAdd = currentOpenProduct.realPrice || currentOpenProduct.price;
    window.addToCart(currentOpenProduct.title, priceToAdd, currentOpenProduct.img, size);
    window.closeProductModal();
}

window.openEditModal = function(id) {
    const product = allProducts.find(p => p.id === id);
    if(!product) return;

    document.getElementById('edit-id').value = id;
    document.getElementById('edit-title').value = product.title;
    document.getElementById('edit-price').value = product.price;
    document.getElementById('edit-discount').value = product.discount || 0;
    
    const sizes = product.sizes || { S: 0, M: product.qty || 0, L: 0, XL: 0 };
    document.getElementById('edit-qty-s').value = sizes.S || 0;
    document.getElementById('edit-qty-m').value = sizes.M || 0;
    document.getElementById('edit-qty-l').value = sizes.L || 0;
    document.getElementById('edit-qty-xl').value = sizes.XL || 0;

    document.getElementById('edit-gender').value = product.gender || 'unisex';
    document.getElementById('edit-cat').value = product.category;
    document.getElementById('edit-img').value = product.img;
    document.getElementById('edit-desc').value = product.description || "";

    document.getElementById('editModal').style.display = 'block';
}

window.saveEditProduct = async function() {
    const id = document.getElementById('edit-id').value;
    const title = document.getElementById('edit-title').value;
    const price = Number(document.getElementById('edit-price').value);
    const discount = Number(document.getElementById('edit-discount').value);
    
    const qtyS = Number(document.getElementById('edit-qty-s').value) || 0;
    const qtyM = Number(document.getElementById('edit-qty-m').value) || 0;
    const qtyL = Number(document.getElementById('edit-qty-l').value) || 0;
    const qtyXL = Number(document.getElementById('edit-qty-xl').value) || 0;
    const totalQty = qtyS + qtyM + qtyL + qtyXL;
    const sizesObj = { S: qtyS, M: qtyM, L: qtyL, XL: qtyXL };

    const gender = document.getElementById('edit-gender').value;
    const cat = document.getElementById('edit-cat').value;
    const img = document.getElementById('edit-img').value;
    const desc = document.getElementById('edit-desc').value;

    try {
        await updateDoc(doc(db, "products", id), {
            title, price, discount, qty: totalQty, sizes: sizesObj, gender, category: cat, img, description: desc
        });
        alert("✅ Промените са запазени!");
        document.getElementById('editModal').style.display = 'none';
        loadProductsFromDB();
    } catch (e) { alert("Грешка при редакция: " + e.message); }
}

window.checkout = function() {
    if(cart.length === 0) return alert("Количката е празна!");
    if (!currentUser) {
        if(confirm("За да поръчате, трябва да влезете в профила си. Да отидем ли към Вход/Регистрация?")) {
            localStorage.setItem('returnTo', 'checkout.html'); window.location.href = "login.html";
        }
    } else { window.location.href = "checkout.html"; }
}

async function loadProductsFromDB() {
    allProducts = []; 
    try {
        const querySnapshot = await getDocs(collection(db, "products"));
        querySnapshot.forEach((doc) => { let data = doc.data(); data.id = doc.id; allProducts.push(data); });
        window.applyFilters(); 
    } catch (error) { console.error(error); }
}

function renderProducts(list) {
    const container = document.getElementById('products-container');
    container.innerHTML = '';
    if(list.length === 0) { container.innerHTML = '<p style="text-align:center; color:#888;">Няма намерени продукти.</p>'; return; }
    
    list.forEach((product) => {
        let adminControls = '';
        if (currentUser && currentUser.email === ADMIN_EMAIL) {
            adminControls = `
                <div style="display:flex; gap:5px; margin-top:5px;">
                    <button onclick="openEditModal('${product.id}')" style="background:orange; color:white; border:none; padding:5px; flex:1; cursor:pointer; font-weight:bold; border-radius:4px;">✏️ РЕДАКТИРАЙ</button>
                    <button class="delete-btn" data-id="${product.id}" style="background:red; color:white; border:none; padding:5px; flex:1; cursor:pointer; font-weight:bold; border-radius:4px;">🗑 ИЗТРИЙ</button>
                </div>
            `;
        }
        
        let priceHtml = `<span style="color:red; font-weight:bold; font-size:18px; display:block; margin-bottom:10px;">${product.price} €</span>`;
        let discountBadge = '';

        if (product.discount > 0) {
            let finalPrice = product.price - (product.price * (product.discount / 100));
            priceHtml = `
                <div style="margin-bottom:10px;">
                    <span style="text-decoration:line-through; color:#666; font-size:14px; margin-right:5px;">${product.price} €</span>
                    <span style="color:red; font-weight:bold; font-size:18px;">${finalPrice.toFixed(2)} €</span>
                </div>
            `;
            discountBadge = `<div class="discount-badge">-${product.discount}%</div>`;
        }

        let stockBadge = `<div class="qty-badge">Налично: ${product.qty || 0}</div>`;
        if ((product.qty || 0) <= 0) stockBadge = `<div class="qty-badge" style="background:#555;">ИЗЧЕРПАНО</div>`;

        const html = `
            <div class="product-card">
                ${stockBadge}
                ${discountBadge}
                <div class="product-img-wrapper">
                    <img src="${product.img}" onerror="this.src='https://via.placeholder.com/300'">
                </div>
                <h3 style="color:#f0f0f0; margin:10px 0;">${product.title}</h3>
                ${priceHtml}
                <button class="open-modal-btn" data-id="${product.id}" style="background:#3498db; color:white; border:none; padding:10px; width:100%; border-radius:5px; cursor:pointer;">Виж Опции</button>
                ${adminControls}
            </div>`;
        container.innerHTML += html;
    });

    document.querySelectorAll('.open-modal-btn').forEach(btn => btn.addEventListener('click', (e) => { const id = e.target.getAttribute('data-id'); const product = allProducts.find(p => p.id === id); window.openProductModal(product); }));
    if (currentUser && currentUser.email === ADMIN_EMAIL) {
        document.querySelectorAll('.delete-btn').forEach(btn => btn.addEventListener('click', async (e) => { if(confirm("Изтриване?")) { await deleteDoc(doc(db, "products", e.target.getAttribute('data-id'))); loadProductsFromDB(); } }));
    }
}

document.getElementById('add-btn').addEventListener('click', async () => {
    const title = document.getElementById('new-title').value;
    const price = document.getElementById('new-price').value;
    const discount = document.getElementById('new-discount').value || 0;
    
    const qtyS = Number(document.getElementById('new-qty-s').value) || 0;
    const qtyM = Number(document.getElementById('new-qty-m').value) || 0;
    const qtyL = Number(document.getElementById('new-qty-l').value) || 0;
    const qtyXL = Number(document.getElementById('new-qty-xl').value) || 0;
    const totalQty = qtyS + qtyM + qtyL + qtyXL;
    const sizesObj = { S: qtyS, M: qtyM, L: qtyL, XL: qtyXL };

    const gender = document.getElementById('new-gender').value;
    const cat = document.getElementById('new-cat').value;
    const img = document.getElementById('new-img').value;
    const desc = document.getElementById('new-desc').value;

    if (!title || !price) { alert("Моля, попълнете поне ИМЕ и ЦЕНА!"); return; }
    
    try {
        const btn = document.getElementById('add-btn'); btn.innerText = "⏳ Качва се..."; btn.disabled = true;
        
        await addDoc(collection(db, "products"), { 
            title, price: Number(price), discount: Number(discount), 
            qty: totalQty, sizes: sizesObj, gender, category: cat, img, description: desc || "Няма описание." 
        });
        
        alert("✅ УСПЕШНО ДОБАВЕНО!");
        
        document.getElementById('new-title').value = ''; document.getElementById('new-price').value = ''; document.getElementById('new-discount').value = '';
        document.getElementById('new-qty-s').value = ''; document.getElementById('new-qty-m').value = ''; document.getElementById('new-qty-l').value = ''; document.getElementById('new-qty-xl').value = '';
        document.getElementById('new-img').value = ''; document.getElementById('new-desc').value = '';
        
        loadProductsFromDB();
    } catch (error) { alert("ГРЕШКА ПРИ КАЧВАНЕ:\n" + error.message); } 
    finally { const btn = document.getElementById('add-btn'); btn.innerText = "+ ДОБАВИ ПРОДУКТ"; btn.disabled = false; }
});

// --- ZOOM ЕФЕКТ С МИШКАТА В МОДАЛА ---
const zoomContainer = document.querySelector('.pm-left');
const zoomImg = document.getElementById('pm-img');

zoomContainer.addEventListener('mousemove', (e) => {
    const rect = zoomContainer.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const xPercent = (x / rect.width) * 100;
    const yPercent = (y / rect.height) * 100;
    zoomImg.style.transformOrigin = `${xPercent}% ${yPercent}%`;
});

zoomContainer.addEventListener('mouseleave', () => {
    zoomImg.style.transformOrigin = 'center center';
});