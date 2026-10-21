(() => {
    const panels = Array.from(document.querySelectorAll("[data-ticket-preview]"));

    panels.forEach((panel) => {
        const ticket = panel.querySelector(".tear-ticket");
        const tearAction = panel.querySelector("[data-ticket-tear]");
        const title = panel.querySelector("[data-ticket-title]");
        const details = panel.querySelector("[data-ticket-details]");
        const note = panel.querySelector("[data-ticket-note]");
        const form = tearAction && tearAction.form;

        if (!ticket || !tearAction || !title || !details || !note || !form) return;

        const titleDefault = title.textContent.trim();
        const detailsDefault = details.textContent.trim();
        const noteDefault = note.textContent.trim();
        const titleInput = document.getElementById(panel.dataset.titleField);
        const detailsInput = document.getElementById(panel.dataset.detailsField);
        const noteInput = panel.dataset.noteField ? document.getElementById(panel.dataset.noteField) : null;
        const updatePreview = () => {
            title.textContent = titleInput.value.trim() || titleDefault;
            details.textContent = detailsInput.value.trim() || detailsDefault;
            note.textContent = (noteInput && noteInput.value.trim()) || noteDefault;
        };

        [titleInput, detailsInput, noteInput].filter(Boolean).forEach((input) => {
            input.addEventListener("input", updatePreview);
            input.addEventListener("change", updatePreview);
        });

        form.addEventListener("submit", (event) => {
            if (ticket.classList.contains("is-tearing")) {
                event.preventDefault();
                return;
            }

            event.preventDefault();
            updatePreview();
            tearAction.disabled = true;
            tearAction.setAttribute("aria-disabled", "true");
            form.setAttribute("aria-busy", "true");
            ticket.classList.add("is-tearing");

            const delay = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 760;
            window.setTimeout(() => HTMLFormElement.prototype.submit.call(form), delay);
        });
    });
})();
