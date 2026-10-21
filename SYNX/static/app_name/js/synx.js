(() => {
    const toggle = document.querySelector(".nav-toggle");
    const navigation = document.querySelector("#primary-nav");

    if (toggle && navigation) {
        const setMenuOpen = (open) => {
            toggle.setAttribute("aria-expanded", String(open));
            toggle.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
            navigation.classList.toggle("is-open", open);
            navigation.setAttribute("aria-hidden", String(!open));
            navigation.inert = !open;
            document.body.classList.toggle("menu-open", open);
            if (open) navigation.querySelector("a")?.focus();
        };

        toggle.addEventListener("click", () => {
            setMenuOpen(toggle.getAttribute("aria-expanded") !== "true");
        });
        navigation.addEventListener("click", (event) => {
            if (event.target.closest("a")) setMenuOpen(false);
        });
        document.addEventListener("pointerdown", (event) => {
            if (
                toggle.getAttribute("aria-expanded") === "true"
                && !navigation.contains(event.target)
                && !toggle.contains(event.target)
            ) setMenuOpen(false);
        });
        document.addEventListener("keydown", (event) => {
            if (event.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
                setMenuOpen(false);
                toggle.focus();
                return;
            }
            if (event.key !== "Tab" || toggle.getAttribute("aria-expanded") !== "true") return;

            const focusableItems = [...navigation.querySelectorAll("a, button:not([disabled])")];
            const firstItem = focusableItems[0];
            const lastItem = focusableItems[focusableItems.length - 1];
            if (event.shiftKey && document.activeElement === firstItem) {
                event.preventDefault();
                lastItem.focus();
            } else if (!event.shiftKey && document.activeElement === lastItem) {
                event.preventDefault();
                firstItem.focus();
            }
        });
    }

    const loop = document.querySelector(".synx-text-loop svg");
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (loop && typeof loop.pauseAnimations === "function") {
        const pauseLoop = () => loop.pauseAnimations();
        const resumeLoop = () => {
            if (!reduceMotion.matches) loop.unpauseAnimations();
        };

        if (reduceMotion.matches) pauseLoop();
        loop.addEventListener("mouseenter", pauseLoop);
        loop.addEventListener("mouseleave", resumeLoop);
        loop.addEventListener("focusin", pauseLoop);
        loop.addEventListener("focusout", resumeLoop);
    }

    reduceMotion.addEventListener("change", () => {
        if (!loop || typeof loop.pauseAnimations !== "function") return;
        if (reduceMotion.matches) loop.pauseAnimations();
        else loop.unpauseAnimations();
    });

    const glowCards = document.querySelectorAll("[data-border-glow]");
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    glowCards.forEach((card) => {
        const edgeSensitivity = Number(card.dataset.edgeSensitivity) || 34;
        card.addEventListener("pointermove", (event) => {
            if (!finePointer.matches || event.pointerType === "touch") return;

            const bounds = card.getBoundingClientRect();
            const x = event.clientX - bounds.left;
            const y = event.clientY - bounds.top;
            const edgeDistance = Math.min(x, bounds.width - x, y, bounds.height - y);
            const angle = Math.atan2(y - bounds.height / 2, x - bounds.width / 2) * (180 / Math.PI) + 90;
            card.style.setProperty("--glow-angle", `${angle}deg`);
            card.style.setProperty("--glow-opacity", `${Math.max(0, 1 - edgeDistance / edgeSensitivity)}`);
            card.toggleAttribute("data-glow-active", edgeDistance < edgeSensitivity);
        });
        card.addEventListener("pointerleave", () => {
            card.removeAttribute("data-glow-active");
            card.style.removeProperty("--glow-opacity");
        });
    });

    const crtScene = document.querySelector(".pocho-art");
    if (crtScene) {
        let shiftTimer = 0;
        crtScene.addEventListener("pointermove", (event) => {
            if (event.pointerType === "touch") return;
            const bounds = crtScene.getBoundingClientRect();
            const x = ((event.clientX - bounds.left) / bounds.width) * 100;
            const y = ((event.clientY - bounds.top) / bounds.height) * 100;
            crtScene.style.setProperty("--crt-pointer-x", `${x}%`);
            crtScene.style.setProperty("--crt-pointer-y", `${y}%`);
        });
        crtScene.addEventListener("pointerleave", () => {
            crtScene.style.removeProperty("--crt-pointer-x");
            crtScene.style.removeProperty("--crt-pointer-y");
        });
        crtScene.addEventListener("click", () => {
            if (reduceMotion.matches) return;
            crtScene.classList.remove("crt-signal-shift");
            void crtScene.offsetWidth;
            crtScene.classList.add("crt-signal-shift");
            window.clearTimeout(shiftTimer);
            shiftTimer = window.setTimeout(() => {
                crtScene.classList.remove("crt-signal-shift");
            }, 720);
        });
    }

    const headings = document.querySelectorAll(".shuffle-heading");
    if (!headings.length) return;

    const wrapText = (node) => {
        if (node.nodeType === Node.TEXT_NODE) {
            const fragment = document.createDocumentFragment();
            for (const character of node.textContent) {
                const span = document.createElement("span");
                span.className = "shuffle-char";
                span.setAttribute("aria-hidden", "true");
                span.dataset.originalCharacter = character;
                span.textContent = character;
                fragment.append(span);
            }
            node.replaceWith(fragment);
            return;
        }
        for (const child of [...node.childNodes]) wrapText(child);
    };

    headings.forEach((heading) => {
        const accessibleText = heading.textContent.replace(/\s+/g, " ").trim();
        heading.setAttribute("aria-label", accessibleText);
        wrapText(heading);
        heading.classList.add("shuffle-ready");

        const shuffleChars = [...heading.querySelectorAll(".shuffle-char")]
            .filter((character) => !/\s/.test(character.textContent));
        let timers = [];
        let runId = 0;
        const playShuffle = () => {
            if (reduceMotion.matches) {
                shuffleChars.forEach((character) => {
                    character.getAnimations().forEach((animation) => animation.cancel());
                    character.textContent = character.dataset.originalCharacter;
                });
                return;
            }
            runId += 1;
            const currentRun = runId;
            timers.forEach(window.clearTimeout);
            timers = [];

            const ordered = [
                ...shuffleChars.filter((_, index) => index % 2 === 0),
                ...shuffleChars.filter((_, index) => index % 2 === 1),
            ];

            ordered.forEach((character, index) => {
                const original = character.dataset.originalCharacter;
                const delay = index * 30;
                character.animate(
                    [{ opacity: 0.25, transform: "translateX(0.55em)" }, { opacity: 1, transform: "translateX(0)" }],
                    { duration: 350, delay, easing: "cubic-bezier(.16, 1, .3, 1)" }
                );
                for (let step = 0; step < 3; step += 1) {
                    timers.push(window.setTimeout(() => {
                        if (currentRun !== runId) return;
                        const candidates = shuffleChars
                            .map((glyph) => glyph.dataset.originalCharacter)
                            .filter((glyph) => glyph !== original);
                        character.textContent = candidates.length
                            ? candidates[Math.floor(Math.random() * candidates.length)]
                            : original;
                    }, delay + 75 + step * 75));
                }
                timers.push(window.setTimeout(() => {
                    if (currentRun === runId) character.textContent = original;
                }, delay + 350));
            });
        };

        if ("IntersectionObserver" in window) {
            const observer = new IntersectionObserver((entries) => {
                if (entries.some((entry) => entry.isIntersecting)) {
                    playShuffle();
                    observer.disconnect();
                }
            }, { threshold: 0.1 });
            observer.observe(heading);
        } else {
            playShuffle();
        }

        heading.addEventListener("mouseenter", playShuffle);
    });
})();
