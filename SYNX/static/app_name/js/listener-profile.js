(() => {
    const card = document.querySelector(".holo-card");
    if (!card || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    card.addEventListener("pointermove", (event) => {
        if (event.pointerType === "touch") return;
        const bounds = card.getBoundingClientRect();
        const x = (event.clientX - bounds.left) / bounds.width;
        const y = (event.clientY - bounds.top) / bounds.height;
        const tiltY = (x - 0.5) * 28;
        const tiltX = (0.5 - y) * 28;

        card.style.setProperty("--pointer-x", `${x * 100}%`);
        card.style.setProperty("--pointer-y", `${y * 100}%`);
        card.style.setProperty("--tilt-x", `${tiltX}deg`);
        card.style.setProperty("--tilt-y", `${tiltY}deg`);
    });

    card.addEventListener("pointerleave", () => {
        card.style.removeProperty("--pointer-x");
        card.style.removeProperty("--pointer-y");
        card.style.removeProperty("--tilt-x");
        card.style.removeProperty("--tilt-y");
    });
})();
