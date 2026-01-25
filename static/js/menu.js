
document.querySelectorAll(".menu-section").forEach(section => {

    const filterBtns = section.querySelectorAll(".filter");
    const cards = section.querySelectorAll(".menu-card");

    filterBtns.forEach(btn => {
        btn.addEventListener("click", () => {

            filterBtns.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");

            const filter = btn.dataset.filter;

            cards.forEach(card => {
                if (filter === "all" || card.classList.contains(filter)) {
                    card.style.display = "flex";
                } else {
                    card.style.display = "none";
                }
            });
        });
    });

});

const btn = document.getElementById("categoryBtn");
const dropdown = document.getElementById("categoryDropdown");


btn.addEventListener("click", (e) => {
  e.stopPropagation();
  dropdown.classList.toggle("show");
  btn.classList.toggle("active-btn");
});
// Category click → scroll + close
function scrollToCategory(id) {
  document.getElementById(id).scrollIntoView({
    behavior: "smooth"
  });
  dropdown.classList.remove("show"); // 🔥 gayab
}

// Outside click → close
document.addEventListener("click", () => {
  dropdown.classList.remove("show");
});


