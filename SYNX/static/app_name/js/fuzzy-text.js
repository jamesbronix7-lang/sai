(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    document.querySelectorAll("[data-fuzzy-text]").forEach((canvas) => {
        const context = canvas.getContext("2d");
        if (!context) return;

        const text = canvas.dataset.fuzzyText || "";
        const baseIntensity = Number(canvas.dataset.baseIntensity ?? 0.18);
        const hoverIntensity = Number(canvas.dataset.hoverIntensity ?? 0.5);
        const fuzzRange = Number(canvas.dataset.fuzzRange ?? 30);
        const fps = Math.max(1, Number(canvas.dataset.fps ?? 60));
        const sliceSize = Math.max(1, Number(canvas.dataset.sliceSize ?? 1));
        const intro = canvas.dataset.intro !== "false";
        const introDuration = Math.max(1, Number(canvas.dataset.introDuration ?? 1400));
        const color = canvas.dataset.color || getComputedStyle(canvas).color;
        const source = document.createElement("canvas");
        const sourceContext = source.getContext("2d");
        const resizeProbe = document.createElement("span");
        const offscreen = typeof IntersectionObserver !== "undefined"
            ? new IntersectionObserver(([entry]) => {
                visible = entry.isIntersecting;
                if (visible && !frame && !disposed && !reduceMotion.matches) {
                    frame = requestAnimationFrame(drawFrame);
                }
            })
            : null;
        let disposed = false;
        let visible = true;
        let hovering = false;
        let frame = 0;
        let lastFrame = 0;
        let startTime = 0;
        let pixelRatio = 1;
        let textWidth = 0;
        let textHeight = 0;
        let fontSize = 16;
        let padding = 0;
        let font = "";

        if (!sourceContext) return;

        resizeProbe.style.position = "absolute";
        resizeProbe.style.visibility = "hidden";
        resizeProbe.style.whiteSpace = "nowrap";
        resizeProbe.style.fontSize = canvas.dataset.fontSize || "clamp(2rem, 8vw, 8rem)";
        canvas.parentElement?.append(resizeProbe);

        const measure = () => {
            const probeStyle = getComputedStyle(resizeProbe);
            fontSize = Number.parseFloat(probeStyle.fontSize) || 16;
            const weight = canvas.dataset.fontWeight || "900";
            const family = canvas.dataset.fontFamily || getComputedStyle(canvas).fontFamily || "sans-serif";
            font = `${weight} ${fontSize}px ${family}`;
            pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
            padding = Math.ceil(fuzzRange + 10);
            sourceContext.setTransform(1, 0, 0, 1, 0, 0);
            sourceContext.font = font;
            const metrics = sourceContext.measureText(text);
            const ascent = metrics.actualBoundingBoxAscent || fontSize;
            const descent = metrics.actualBoundingBoxDescent || fontSize * 0.2;
            textWidth = Math.ceil((metrics.actualBoundingBoxLeft || 0) + (metrics.actualBoundingBoxRight || metrics.width));
            textHeight = Math.ceil(ascent + descent);
            const width = textWidth + padding * 2;
            const height = textHeight + 8;

            source.width = Math.ceil((textWidth + 4) * pixelRatio);
            source.height = Math.ceil(textHeight * pixelRatio);
            canvas.width = Math.ceil(width * pixelRatio);
            canvas.height = Math.ceil(height * pixelRatio);
            canvas.style.width = `${width}px`;
            canvas.style.height = `${height}px`;

            sourceContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
            sourceContext.clearRect(0, 0, source.width / pixelRatio, source.height / pixelRatio);
            sourceContext.font = font;
            sourceContext.textBaseline = "alphabetic";
            sourceContext.fillStyle = color;
            sourceContext.fillText(text, 2, ascent);
        };

        const isHoveringText = (event) => {
            const bounds = canvas.getBoundingClientRect();
            if (!bounds.width || !bounds.height) return false;
            const x = ((event.clientX - bounds.left) / bounds.width) * (canvas.width / pixelRatio);
            const y = ((event.clientY - bounds.top) / bounds.height) * (canvas.height / pixelRatio);
            return x >= padding && x <= padding + textWidth && y <= textHeight + 4;
        };

        function drawFrame(now) {
            frame = 0;
            if (disposed || !visible || reduceMotion.matches) return;
            frame = requestAnimationFrame(drawFrame);
            if (now - lastFrame < 1000 / fps - 1) return;
            lastFrame = now;

            const elapsed = now - startTime;
            const introLevel = intro && elapsed < introDuration
                ? Math.pow(1 - elapsed / introDuration, 2.5) * 1.8
                : 0;
            const intensity = Math.max(
                introLevel,
                hovering ? hoverIntensity : baseIntensity
            );
            const amplitude = intensity * fuzzRange;
            const step = Math.max(1, Math.round(sliceSize));
            const sourceWidth = source.width / pixelRatio;
            const sourceHeight = source.height / pixelRatio;
            context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
            context.clearRect(0, 0, canvas.width / pixelRatio, canvas.height / pixelRatio);
            for (let y = 0; y < sourceHeight; y += step) {
                const height = Math.min(step, sourceHeight - y);
                const shift = (Math.random() - 0.5) * amplitude;
                context.drawImage(
                    source,
                    0,
                    y * pixelRatio,
                    source.width,
                    height * pixelRatio,
                    padding + shift,
                    4 + y,
                    sourceWidth,
                    height
                );
            }
        }

        const handleMove = (event) => {
            hovering = isHoveringText(event);
        };
        const handleLeave = () => {
            hovering = false;
        };
        const handleResize = () => {
            measure();
            if (reduceMotion.matches) drawStatic();
        };
        const handleMotionChange = () => {
            if (reduceMotion.matches) {
                cancelAnimationFrame(frame);
                frame = 0;
                drawStatic();
            } else if (visible && !frame) {
                startTime = performance.now();
                frame = requestAnimationFrame(drawFrame);
            }
        };

        function drawStatic() {
            context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
            context.clearRect(0, 0, canvas.width / pixelRatio, canvas.height / pixelRatio);
            context.drawImage(source, padding, 4, source.width / pixelRatio, source.height / pixelRatio);
        }

        measure();
        canvas.parentElement?.removeChild(resizeProbe);
        canvas.addEventListener("pointermove", handleMove);
        canvas.addEventListener("pointerleave", handleLeave);
        canvas.addEventListener("pointercancel", handleLeave);
        window.addEventListener("resize", handleResize);
        reduceMotion.addEventListener?.("change", handleMotionChange);
        offscreen?.observe(canvas);

        document.fonts.ready.then(() => {
            if (disposed) return;
            measure();
            startTime = performance.now();
            if (reduceMotion.matches) drawStatic();
            else frame = requestAnimationFrame(drawFrame);
        });

        canvas.addEventListener("remove", () => {
            disposed = true;
            cancelAnimationFrame(frame);
            offscreen?.disconnect();
            canvas.removeEventListener("pointermove", handleMove);
            canvas.removeEventListener("pointerleave", handleLeave);
            canvas.removeEventListener("pointercancel", handleLeave);
            window.removeEventListener("resize", handleResize);
            reduceMotion.removeEventListener?.("change", handleMotionChange);
        }, { once: true });
    });
})();
