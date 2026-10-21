(() => {
    const player = document.querySelector("[data-room-queue]");
    if (!player) return;

    const queueItems = Array.from(player.querySelectorAll("[data-queue-item]"));
    const title = player.querySelector("[data-current-title]");
    const artist = player.querySelector("[data-current-artist]");
    const position = player.querySelector("[data-queue-position]");
    const previous = player.querySelector("[data-queue-previous]");
    const next = player.querySelector("[data-queue-next]");
    const toggle = player.querySelector("[data-queue-toggle]");
    const progress = player.querySelector("[data-queue-progress]");
    const progressTrack = progress && progress.parentElement;
    const timeDisplay = player.querySelector("[data-queue-time]");
    const status = player.querySelector("[data-queue-status]");

    if (!queueItems.length || !title || !artist || !position || !previous || !next || !toggle || !progress || !progressTrack || !timeDisplay || !status) return;

    const durations = queueItems.map(() => 150 + Math.floor(Math.random() * 151));
    let activeIndex = Math.max(0, queueItems.findIndex((item) => item.getAttribute("aria-pressed") === "true"));
    let elapsed = 0;
    let isPaused = false;

    const formatTime = (seconds) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

    function updateDisplay() {
        const duration = durations[activeIndex];
        const activeItem = queueItems[activeIndex];
        const remaining = Math.max(duration - elapsed, 0);

        title.textContent = activeItem.dataset.title;
        artist.textContent = activeItem.dataset.artist;
        position.textContent = `NOW SELECTED · ${String(activeIndex + 1).padStart(2, "0")} / ${String(queueItems.length).padStart(2, "0")}`;
        timeDisplay.textContent = `${formatTime(elapsed)} / ${formatTime(duration)}`;
        progress.style.width = `${(elapsed / duration) * 100}%`;
        progressTrack.setAttribute("aria-valuenow", String(Math.floor((elapsed / duration) * 100)));

        queueItems.forEach((item, itemIndex) => {
            item.setAttribute("aria-pressed", String(itemIndex === activeIndex));
            item.querySelector("[data-queue-duration]").textContent = formatTime(durations[itemIndex]);
        });

        status.textContent = isPaused
            ? "Queue paused. Tracks auto-advance when the timer is running."
            : `Queue rotation · next track in ${formatTime(remaining)}. Audio files are not connected.`;
        toggle.textContent = isPaused ? "RESUME QUEUE" : "PAUSE QUEUE";
        toggle.setAttribute("aria-pressed", String(isPaused));
    }

    function selectTrack(index) {
        activeIndex = (index + queueItems.length) % queueItems.length;
        elapsed = 0;
        updateDisplay();
    }

    queueItems.forEach((item, index) => {
        item.addEventListener("click", () => selectTrack(index));
    });
    previous.addEventListener("click", () => selectTrack(activeIndex - 1));
    next.addEventListener("click", () => selectTrack(activeIndex + 1));
    toggle.addEventListener("click", () => {
        isPaused = !isPaused;
        updateDisplay();
    });

    updateDisplay();
    window.setInterval(() => {
        if (isPaused) return;
        elapsed += 1;
        if (elapsed >= durations[activeIndex]) {
            selectTrack(activeIndex + 1);
            return;
        }
        updateDisplay();
    }, 1000);
})();
