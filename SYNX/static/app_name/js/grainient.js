(() => {
    const canvas = document.querySelector(".grainient-canvas");
    const context = canvas?.getContext("2d", { alpha: false });
    if (!canvas || !context) return;

    const settings = {
        colors: ["#080909", "#182218", "#385b2e", "#85bd4e", "#b1ff72"],
        angle: 55,
        flow: 0.8,
        silk: 0.35,
        softness: 1,
        scale: 1,
        speed: 1,
        intro: true,
        interactive: true,
        clickSwirl: true,
    };
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const pointer = { x: 0.5, y: 0.5, active: false };
    let width = 0;
    let height = 0;
    let frame = 0;
    let swirl = null;
    const startedAt = performance.now();

    const resize = () => {
        const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = Math.round(width * pixelRatio);
        canvas.height = Math.round(height * pixelRatio);
        context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
        if (reducedMotion.matches) draw(performance.now());
    };

    const draw = (now) => {
        const elapsed = (now - startedAt) * settings.speed;
        const radians = (settings.angle + Math.sin(elapsed * 0.00008) * settings.flow * 2) * Math.PI / 180;
        const extent = Math.hypot(width, height) * 0.55;
        const centerX = width * 0.5;
        const centerY = height * 0.5;
        const offsetX = Math.cos(radians) * extent;
        const offsetY = Math.sin(radians) * extent;
        const gradient = context.createLinearGradient(
            centerX - offsetX,
            centerY - offsetY,
            centerX + offsetX,
            centerY + offsetY
        );

        settings.colors.forEach((color, index) => {
            const base = index / (settings.colors.length - 1);
            const drift = index === 0 || index === settings.colors.length - 1
                ? 0
                : Math.sin(elapsed * 0.00012 + index) * 0.018 * settings.flow;
            gradient.addColorStop(base + drift, color);
        });

        const introProgress = settings.intro && !reducedMotion.matches
            ? Math.min(1, (now - startedAt) / 1400)
            : 1;
        const introOpacity = introProgress * introProgress * (3 - 2 * introProgress);
        context.globalAlpha = introOpacity;
        context.fillStyle = gradient;
        context.fillRect(0, 0, width, height);

        const silkX = width * (0.5 + Math.cos(elapsed * 0.00014) * 0.25);
        const silkY = height * (0.5 + Math.sin(elapsed * 0.00011) * 0.2);
        const silkRadius = Math.max(width, height) * 0.62 * settings.scale * (0.7 + settings.softness * 0.3);
        const silkGradient = context.createRadialGradient(silkX, silkY, 0, silkX, silkY, silkRadius);
        silkGradient.addColorStop(0, `rgba(177,255,114,${settings.silk * 0.2})`);
        silkGradient.addColorStop(0.48, `rgba(133,189,78,${settings.silk * 0.1})`);
        silkGradient.addColorStop(1, "rgba(8,9,9,0)");
        context.fillStyle = silkGradient;
        context.fillRect(0, 0, width, height);

        if (settings.interactive && pointer.active) {
            const pointerX = pointer.x * width;
            const pointerY = pointer.y * height;
            const pointerGradient = context.createRadialGradient(
                pointerX,
                pointerY,
                0,
                pointerX,
                pointerY,
                Math.max(width, height) * 0.48
            );
            pointerGradient.addColorStop(0, "rgba(216,255,183,0.12)");
            pointerGradient.addColorStop(1, "rgba(216,255,183,0)");
            context.fillStyle = pointerGradient;
            context.fillRect(0, 0, width, height);
        }

        if (settings.clickSwirl && swirl) {
            const age = (now - swirl.startedAt) / 1200;
            if (age >= 1) {
                swirl = null;
            } else {
                context.save();
                context.translate(swirl.x * width, swirl.y * height);
                context.rotate(age * Math.PI * 3);
                context.globalAlpha = (1 - age) * 0.18 * introOpacity;
                context.scale(1 + age * 1.8, 1 - age * 0.45);
                const swirlGradient = context.createRadialGradient(0, 0, 0, 0, 0, Math.max(width, height) * 0.32);
                swirlGradient.addColorStop(0, "rgba(216,255,183,0.5)");
                swirlGradient.addColorStop(0.4, "rgba(177,255,114,0.25)");
                swirlGradient.addColorStop(1, "rgba(177,255,114,0)");
                context.fillStyle = swirlGradient;
                context.fillRect(-width, -height, width * 2, height * 2);
                context.restore();
            }
        }

        context.globalAlpha = 1;
        if (!reducedMotion.matches) frame = window.requestAnimationFrame(draw);
    };

    window.addEventListener("resize", resize, { passive: true });
    window.addEventListener("pointermove", (event) => {
        if (!settings.interactive || event.pointerType === "touch") return;
        pointer.x = event.clientX / window.innerWidth;
        pointer.y = event.clientY / window.innerHeight;
        pointer.active = true;
    }, { passive: true });
    window.addEventListener("pointerout", (event) => {
        if (!event.relatedTarget) pointer.active = false;
    });
    window.addEventListener("click", (event) => {
        if (!settings.clickSwirl || reducedMotion.matches) return;
        swirl = {
            x: event.clientX / window.innerWidth,
            y: event.clientY / window.innerHeight,
            startedAt: performance.now(),
        };
    });
    reducedMotion.addEventListener("change", () => {
        window.cancelAnimationFrame(frame);
        if (reducedMotion.matches) draw(performance.now());
        else frame = window.requestAnimationFrame(draw);
    });

    resize();
    if (!reducedMotion.matches) frame = window.requestAnimationFrame(draw);
})();