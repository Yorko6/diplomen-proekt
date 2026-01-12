/* --- Файл: app.js --- */

// Проверка дали файлът е свързан (ще изпише съобщение в конзолата на браузъра)
console.log("app.js е свързан и работи!");

// 1. Функция за ОТВАРЯНЕ на количката
function openCart() {
    var modal = document.getElementById("myCartModal");
    if (modal) {
        modal.style.display = "block";
    } else {
        console.error("Грешка: Не намирам количката (myCartModal) в HTML-а!");
    }
}

// 2. Функция за ЗАТВАРЯНЕ на количката (от хикса)
function closeCart() {
    var modal = document.getElementById("myCartModal");
    if (modal) {
        modal.style.display = "none";
    }
}

// 3. Затваряне при кликване ИЗВЪН прозореца (на тъмното)
window.onclick = function(event) {
    var modal = document.getElementById("myCartModal");
    if (event.target == modal) {
        modal.style.display = "none";
    }
}