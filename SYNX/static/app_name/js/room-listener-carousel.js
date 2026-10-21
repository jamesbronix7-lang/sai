(() => {
    const stage = document.querySelector("[data-listener-carousel]");
    const data = document.getElementById("room-featured-listeners");
    const card = document.getElementById("room-holo-card");
    const image = document.getElementById("room-holo-image");
    const name = document.getElementById("room-holo-name");
    const edition = document.getElementById("room-holo-edition");
    const profileLink = document.getElementById("room-holo-link");
    const presetLabel = card && card.querySelector(".holo-card-frame");

    if (!stage || !data || !card || !image || !name || !edition || !profileLink || !presetLabel) return;

    const listeners = JSON.parse(data.textContent);
    if (!Array.isArray(listeners) || listeners.length < 2) return;

    const imagePrefix = stage.dataset.imagePrefix;
    const profilePrefix = stage.dataset.profilePrefix;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let activeIndex = 0;
    let shuffleTimer;
    let switchingTimer;

    listeners.forEach((listener) => {
        const preload = new Image();
        preload.src = `${imagePrefix}${listener.image}`;
    });

    const shuffleName = (nextName) => {
        if (prefersReducedMotion) {
            name.textContent = nextName;
            return;
        }

        window.clearInterval(shuffleTimer);
        name.setAttribute("aria-live", "off");
        const frames = Math.max(8, Math.min(16, nextName.length + 4));
        let frame = 0;
        const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

        shuffleTimer = window.setInterval(() => {
            frame += 1;
            const settledCharacters = Math.floor((frame / frames) * nextName.length);
            name.textContent = Array.from(nextName, (character, index) => {
                if (character === " " || index < settledCharacters || frame >= frames) return character;
                return alphabet[Math.floor(Math.random() * alphabet.length)];
            }).join("");

            if (frame >= frames) {
                window.clearInterval(shuffleTimer);
                name.textContent = nextName;
                name.setAttribute("aria-live", "polite");
            }
        }, 38);
    };

    const showNextListener = () => {
        if (document.hidden) return;

        activeIndex = (activeIndex + 1) % listeners.length;
        const listener = listeners[activeIndex];
        card.classList.add("is-switching");

        switchingTimer = window.setTimeout(() => {
            image.src = `${imagePrefix}${listener.image}`;
            image.alt = `${listener.name} profile picture`;
            card.dataset.preset = listener.preset;
            card.style.setProperty("--foil-color", listener.foil);
            edition.textContent = `MEMBER ${String(activeIndex + 1).padStart(2, "0")} / ${String(listeners.length).padStart(2, "0")}`;
            presetLabel.lastChild.textContent = ` ${listener.preset.toUpperCase()}`;
            profileLink.href = profilePrefix.replace("profile-slug", encodeURIComponent(listener.slug));
            profileLink.setAttribute("aria-label", `Open ${listener.name}'s listener profile`);
            card.classList.remove("is-switching");
            shuffleName(listener.name);
        }, prefersReducedMotion ? 0 : 180);
    };

    const rotationTimer = window.setInterval(showNextListener, 3000);
    window.addEventListener("pagehide", () => {
        window.clearInterval(rotationTimer);
        window.clearInterval(shuffleTimer);
        window.clearTimeout(switchingTimer);
    }, { once: true });
})();
