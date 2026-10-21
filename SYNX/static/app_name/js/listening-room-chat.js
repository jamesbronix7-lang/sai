(() => {
    const room = document.querySelector("#room-chat");
    const conversation = document.querySelector("#chat-messages");
    const composer = document.querySelector("#chat-composer");
    const input = document.querySelector("#chat-input");

    if (!room || !conversation || !composer || !input) return;

    const apiUrl = room.dataset.apiUrl;
    const csrfToken = composer.querySelector("[name=csrfmiddlewaretoken]").value;
    const listenersElement = document.getElementById("room-listeners-data");
    const listeners = listenersElement ? JSON.parse(listenersElement.textContent) : [];
    const listenerByName = new Map(listeners.map((listener) => [listener.name.toLowerCase(), listener]));
    const fields = [
        ["song_title", "Song title", "text", true],
        ["artist_name", "Artist", "text", true],
        ["genre", "Genre", "text", true],
        ["mood", "Mood", "text", true],
        ["release_year", "Release year", "number", false],
        ["favorite_era", "Favorite era", "text", false],
        ["rating", "Your rating", "rating", true],
        ["description", "A note about this song", "textarea", false],
    ];

    const loopMessages = [
        { speaker: "assistant", text: "nux: the sticker has lore now" },
        { speaker: "user", text: "kayn: bro got left on read by a refrigerator 💀" },
        { speaker: "assistant", text: "bronix: bro is beefing with an appliance" },
        { speaker: "user", text: "dongkuy: fish drink water through their gills" },
        { speaker: "assistant", text: "calvon: the worm economy is collapsing" },
        { speaker: "user", text: "ragedrix: you cannot silence the truth" },
        { speaker: "assistant", text: "tatsuya: i’m hiding all their left shoes" },
        { speaker: "user", text: "zynxx: he found his way home" },
        { speaker: "assistant", text: "uznav: I KNOW WHERE YOU LIVE" },
        { speaker: "user", text: "Iam Tan: the server is planning psychological warfare" },
        { speaker: "assistant", text: "guest: guys i think my fridge is sentient" },
        { speaker: "user", text: "mico: no Wi-Fi no taxes" },
        { speaker: "assistant", text: "rayn: he found iron" },
        { speaker: "user", text: "fluximity: new here, what are we listening to?" },
    ];

    const liveLoop = document.createElement("div");
    liveLoop.className = "chat-live-loop";
    conversation.insertBefore(liveLoop, conversation.firstChild);

    let loopIndex = 0;

    function buildLoopBubble(item) {
        const message = document.createElement("div");
        message.className = `chat-message ${item.speaker === "user" ? "user-message" : "assistant-message"} chat-loop-message`;

        if (item.typing) {
            message.innerHTML = `
                <span class="chat-avatar" aria-hidden="true">S</span>
                <div>
                    <span class="chat-speaker">${item.name || "SYNX"} <small>IS TYPING</small></span>
                    <div class="typing-dots" aria-label="Typing indicator">
                        <span></span><span></span><span></span>
                    </div>
                </div>
            `;
        } else {
            const avatar = document.createElement("span");
            avatar.className = "chat-avatar";
            avatar.setAttribute("aria-hidden", "true");

            const content = document.createElement("div");
            const name = document.createElement("span");
            name.className = "chat-speaker";
            const sender = item.text.split(":")[0];
            name.textContent = sender;
            const listener = listenerByName.get(sender.toLowerCase());
            if (listener) {
                const profileLink = document.createElement("a");
                profileLink.className = "chat-avatar";
                profileLink.href = room.dataset.profilePrefix.replace("profile-slug", encodeURIComponent(listener.slug));
                profileLink.setAttribute("aria-label", `Open ${listener.name}'s profile`);
                const image = document.createElement("img");
                image.src = `${room.dataset.pfpPrefix}${listener.image}`;
                image.alt = `${listener.name} profile picture`;
                profileLink.appendChild(image);
                message.append(profileLink);
            } else {
                avatar.textContent = item.speaker === "user" ? "♪" : "S";
                message.append(avatar);
            }
            const time = document.createElement("small");
            time.textContent = item.time || "JUST NOW";
            name.append(" ", time);

            const paragraph = document.createElement("p");
            paragraph.textContent = item.text.replace(`${sender}: `, "");
            content.append(name, paragraph);
            message.append(content);
        }

        liveLoop.appendChild(message);
        requestAnimationFrame(() => message.classList.add("is-visible"));

        setTimeout(() => {
            message.classList.add("is-fading");
            setTimeout(() => message.remove(), 260);
        }, 2400);
    }

    function startLoopingChat() {
        const tick = () => {
            if (!document.body.contains(conversation)) return;
            const item = loopMessages[loopIndex % loopMessages.length];
            buildLoopBubble(item);
            loopIndex += 1;
            setTimeout(tick, 2200);
        };
        tick();
    }

    function scrollToLatest() {
        const shouldStick = conversation.scrollTop + conversation.clientHeight >= conversation.scrollHeight - 24;
        if (shouldStick || !conversation.dataset.userScrolled) {
            conversation.scrollTop = conversation.scrollHeight;
        }
    }

    function showTypingIndicator(label = "SYNX") {
        const existing = conversation.querySelector(".chat-typing");
        if (existing) return existing;
        const message = document.createElement("div");
        message.className = "chat-message assistant-message chat-typing";
        message.innerHTML = `
            <span class="chat-avatar" aria-hidden="true">S</span>
            <div>
                <span class="chat-speaker">${label} <small>IS TYPING</small></span>
                <div class="typing-dots" aria-label="Typing indicator">
                    <span></span><span></span><span></span>
                </div>
            </div>
        `;
        conversation.appendChild(message);
        scrollToLatest();
        return message;
    }

    function hideTypingIndicator() {
        const existing = conversation.querySelector(".chat-typing");
        if (existing) existing.remove();
    }

    function addMessage(text, speaker = "assistant") {
        const message = document.createElement("div");
        message.className = `chat-message ${speaker === "user" ? "user-message" : "assistant-message"}`;

        const avatar = document.createElement("span");
        avatar.className = "chat-avatar";
        avatar.setAttribute("aria-hidden", "true");
        avatar.textContent = speaker === "user" ? "♪" : "S";

        const content = document.createElement("div");
        const name = document.createElement("span");
        name.className = "chat-speaker";
        name.textContent = speaker === "user" ? "YOU" : "SYNX";
        const time = document.createElement("small");
        time.textContent = "JUST NOW";
        name.append(" ", time);

        const paragraph = document.createElement("p");
        paragraph.textContent = text;

        const reactions = document.createElement("div");
        reactions.className = "chat-reactions";
        ["🔥", "💜", "😂"].forEach((emoji) => {
            const button = document.createElement("button");
            button.type = "button";
            button.className = "chat-reaction";
            button.textContent = emoji;
            button.setAttribute("aria-label", `React with ${emoji}`);
            button.addEventListener("click", (event) => {
                event.stopPropagation();
                const burst = document.createElement("span");
                burst.className = "reaction-burst";
                burst.textContent = emoji;
                button.appendChild(burst);
                requestAnimationFrame(() => burst.classList.add("is-visible"));
                setTimeout(() => burst.remove(), 500);
            });
            reactions.appendChild(button);
        });

        content.append(name, paragraph, reactions);
        message.append(avatar, content);
        conversation.append(message);
        hideTypingIndicator();
        scrollToLatest();
        return message;
    }

    function addBusyMessage() {
        const typing = showTypingIndicator("SYNX");
        const message = addMessage("One moment while I check the shelves…");
        message.classList.add("chat-busy");
        hideTypingIndicator();
        return message;
    }

    function applyRoomSummary(summary) {
        if (!summary) return;
        const values = {
            total_songs: String(summary.total_songs).padStart(2, "0"),
            total_artists: String(summary.total_artists).padStart(2, "0"),
            total_genres: String(summary.total_genres).padStart(2, "0"),
            average_rating: summary.average_rating ? Number(summary.average_rating).toFixed(1) : "—",
        };
        Object.entries(values).forEach(([key, value]) => {
            const node = document.querySelector(`[data-room-stat="${key}"]`);
            if (node) node.textContent = value;
        });

        const panel = document.querySelector(".recent-panel");
        if (!panel) return;
        let list = panel.querySelector("#recent-track-list");
        let empty = panel.querySelector("#recent-empty");
        if (!summary.recent_records.length) {
            list?.remove();
            if (!empty) {
                empty = document.createElement("div");
                empty.id = "recent-empty";
                empty.className = "room-empty";
                const glyph = document.createElement("span");
                glyph.className = "empty-glyph";
                glyph.setAttribute("aria-hidden", "true");
                glyph.textContent = "♫";
                const copy = document.createElement("div");
                const heading = document.createElement("h3");
                heading.textContent = "The room is yours.";
                const description = document.createElement("p");
                description.textContent = "Put the first record on the shelf and make this space your own.";
                copy.append(heading, description);
                const addLink = document.createElement("a");
                addLink.className = "button button-quiet";
                addLink.href = room.dataset.addUrl;
                addLink.textContent = "Add your first track ＋";
                empty.append(glyph, copy, addLink);
                panel.append(empty);
            }
            return;
        }

        empty?.remove();
        if (!list) {
            list = document.createElement("div");
            list.id = "recent-track-list";
            list.className = "track-list";
            panel.append(list);
        }
        list.replaceChildren();
        summary.recent_records.forEach((record) => {
            const row = document.createElement("a");
            row.className = "track-row";
            row.href = record.detail_url;
            const disc = document.createElement("span");
            disc.className = "track-disc";
            disc.setAttribute("aria-hidden", "true");
            const center = document.createElement("span");
            disc.append(center);
            const track = document.createElement("span");
            track.className = "track-main";
            const title = document.createElement("strong");
            title.textContent = record.song_title;
            const artist = document.createElement("small");
            artist.textContent = record.artist_name;
            track.append(title, artist);
            const genre = document.createElement("span");
            genre.className = "track-tag";
            genre.textContent = record.genre;
            const rating = document.createElement("span");
            rating.className = "track-rating";
            rating.setAttribute("aria-label", `${record.rating} out of 5`);
            rating.textContent = `✦ ${record.rating}`;
            const arrow = document.createElement("span");
            arrow.className = "track-arrow";
            arrow.setAttribute("aria-hidden", "true");
            arrow.textContent = "↗";
            row.append(disc, track, genre, rating, arrow);
            list.append(row);
        });
    }

    async function requestApi(method = "GET", body = null) {
        const options = {
            method,
            headers: { Accept: "application/json" },
        };
        if (body) {
            options.headers["Content-Type"] = "application/json";
            options.headers["X-CSRFToken"] = csrfToken;
            options.body = JSON.stringify(body);
        }

        const response = await fetch(apiUrl, options);
        const data = await response.json();
        if (!response.ok) {
            const error = new Error(data.error || "I couldn’t complete that just now.");
            error.details = data.errors;
            throw error;
        }
        return data;
    }

    function createActionButton(label, action, id, className = "") {
        const button = document.createElement("button");
        button.type = "button";
        button.className = `chat-track-action ${className}`.trim();
        button.textContent = label;
        button.dataset.trackAction = action;
        button.dataset.trackId = String(id);
        return button;
    }

    async function showLibrary() {
        const busy = addBusyMessage();
        try {
            const data = await requestApi();
            applyRoomSummary(data.summary);
            conversation.querySelectorAll(".chat-record-list").forEach((list) => list.remove());
            busy.remove();
            if (!data.records.length) {
                addMessage("Your shelf is still waiting for its first record. Want to add one?");
                showRecordForm();
                return;
            }

            addMessage(`I found ${data.records.length} track${data.records.length === 1 ? "" : "s"} in your room. Choose a record to edit or remove.`);
            const list = document.createElement("div");
            list.className = "chat-record-list";
            data.records.forEach((record) => {
                const card = document.createElement("article");
                card.className = "chat-record";
                const detail = document.createElement("a");
                detail.className = "chat-record-detail";
                detail.href = record.detail_url;
                const index = document.createElement("span");
                index.className = "chat-record-index";
                index.textContent = `#${record.id}`;
                const title = document.createElement("span");
                title.className = "chat-record-copy";
                const song = document.createElement("strong");
                song.textContent = record.song_title;
                const artist = document.createElement("small");
                artist.textContent = `${record.artist_name} · ${record.genre}`;
                title.append(song, artist);
                const rating = document.createElement("span");
                rating.className = "chat-record-rating";
                rating.textContent = `✦ ${record.rating}`;
                detail.append(index, title, rating);
                const actions = document.createElement("div");
                actions.className = "chat-record-actions";
                actions.append(
                    createActionButton("Edit", "edit", record.id),
                    createActionButton("Remove", "delete", record.id, "remove-action")
                );
                card.append(detail, actions);
                list.append(card);
            });
            conversation.append(list);
            scrollToLatest();
        } catch (error) {
            busy.remove();
            addMessage(error.message);
        }
    }

    function showRecordForm(record = null) {
        const message = addMessage(record ? `Let's update “${record.song_title}”. Change anything you like, then save it.` : "Let's put a new record on the shelf. What should I know about it?");
        const form = document.createElement("form");
        form.className = "chat-record-form";
        form.noValidate = true;
        form.dataset.action = record ? "update" : "create";
        if (record) form.dataset.trackId = String(record.id);

        const heading = document.createElement("div");
        heading.className = "chat-form-heading";
        heading.textContent = record ? `EDITING RECORD #${record.id}` : "NEW RECORD · YOUR COLLECTION";
        form.append(heading);

        const grid = document.createElement("div");
        grid.className = "chat-form-grid";
        fields.forEach(([key, labelText, type, required]) => {
            const wrapper = document.createElement("div");
            wrapper.className = key === "description" ? "chat-field chat-field-wide" : "chat-field";
            const label = document.createElement("label");
            label.htmlFor = `chat-${key}-${record ? record.id : "new"}`;
            label.textContent = labelText + (required ? " *" : "");
            let control;
            if (type === "rating") {
                control = document.createElement("select");
                control.add(new Option("Choose a rating", ""));
                for (let rating = 1; rating <= 5; rating += 1) {
                    control.add(new Option(`${rating} / 5`, String(rating)));
                }
            } else if (type === "textarea") {
                control = document.createElement("textarea");
                control.rows = 2;
                control.placeholder = "A lyric, a memory, a late-night thought…";
            } else {
                control = document.createElement("input");
                control.type = type;
                if (type === "number") {
                    control.min = "1000";
                    control.max = "2100";
                    control.placeholder = "Optional";
                }
            }
            control.id = label.htmlFor;
            control.name = key;
            control.required = required;
            control.value = record ? record[key] ?? "" : "";
            wrapper.append(label, control);
            grid.append(wrapper);
        });
        const errors = document.createElement("p");
        errors.className = "chat-form-errors";
        errors.setAttribute("role", "alert");
        errors.hidden = true;
        const actions = document.createElement("div");
        actions.className = "chat-form-actions";
        const cancel = document.createElement("button");
        cancel.type = "button";
        cancel.className = "chat-cancel";
        cancel.textContent = "Not now";
        cancel.addEventListener("click", () => message.remove());
        const submit = document.createElement("button");
        submit.type = "submit";
        submit.className = "chat-save";
        submit.textContent = record ? "Save changes ↗" : "Add to my room ↗";
        actions.append(cancel, submit);
        form.append(grid, errors, actions);
        message.querySelector(":scope > div").append(form);
        form.addEventListener("submit", submitRecordForm);
        scrollToLatest();
        form.querySelector("input, textarea, select")?.focus();
    }

    async function submitRecordForm(event) {
        event.preventDefault();
        const form = event.currentTarget;
        const submit = form.querySelector('[type="submit"]');
        const errorBox = form.querySelector(".chat-form-errors");
        const record = Object.fromEntries(new FormData(form).entries());
        if (!record.release_year) record.release_year = "";
        submit.disabled = true;
        submit.textContent = "SAVING…";
        errorBox.hidden = true;
        try {
            const body = { action: form.dataset.action, record };
            if (form.dataset.trackId) body.id = Number(form.dataset.trackId);
            const data = await requestApi("POST", body);
            form.closest(".chat-message").remove();
            addMessage(data.message);
            applyRoomSummary(data.summary);
            if (data.record) addRecordConfirmation(data.record);
            showLibrary();
        } catch (error) {
            submit.disabled = false;
            submit.textContent = form.dataset.action === "update" ? "Save changes ↗" : "Add to my room ↗";
            errorBox.hidden = false;
            errorBox.textContent = error.message;
            if (error.details) {
                const detail = Object.values(error.details).flat().map((item) => item.message).join(" ");
                if (detail) errorBox.textContent = detail;
            }
            scrollToLatest();
        }
    }

    function addRecordConfirmation(record) {
        const confirmation = document.createElement("div");
        confirmation.className = "chat-added-record";
        const note = document.createElement("span");
        note.textContent = `SHELF / RECORD #${record.id}`;
        const link = document.createElement("a");
        link.href = record.detail_url;
        link.textContent = `${record.song_title} — ${record.artist_name} ↗`;
        confirmation.append(note, link);
        conversation.append(confirmation);
        scrollToLatest();
    }

    async function editRecord(id) {
        const busy = addBusyMessage();
        try {
            const data = await requestApi();
            applyRoomSummary(data.summary);
            busy.remove();
            const record = data.records.find((item) => item.id === id);
            if (!record) {
                addMessage(`I couldn't find record #${id} in this room. Try “show my music” to see the shelf.`);
                return;
            }
            showRecordForm(record);
        } catch (error) {
            busy.remove();
            addMessage(error.message);
        }
    }

    async function deleteRecord(id, button) {
        const card = button.closest(".chat-record");
        const title = card.querySelector(".chat-record-copy strong").textContent;
        if (!window.confirm(`Remove “${title}” from your listening room?`)) return;

        button.disabled = true;
        button.textContent = "REMOVING…";
        try {
            const data = await requestApi("POST", { action: "delete", id, confirmed: true });
            card.remove();
            addMessage(data.message);
            applyRoomSummary(data.summary);
            showLibrary();
        } catch (error) {
            button.disabled = false;
            button.textContent = "Remove";
            addMessage(error.message);
        }
    }

    function handleCommand(rawCommand) {
        const command = rawCommand.trim();
        const normalized = command.toLowerCase();
        const idMatch = normalized.match(/^(?:edit|update|remove|delete)\s+#?(\d+)$/);

        addMessage(command, "user");
        if (/^(add|create)(?:\s+(?:a\s+)?(?:song|track|music))?$/i.test(command)) {
            showRecordForm();
        } else if (/^(list|show|browse)(?:\s+(?:my\s+)?(?:music|songs|tracks|library))?$/i.test(command)) {
            showLibrary();
        } else if (/^(help|\?)$/i.test(command)) {
            addMessage("You can say “add a song”, “show my music”, “edit 3”, or “remove 3”. The number is the record ID shown on your shelf. You can also use the action buttons on any track.");
        } else if (idMatch && /^(edit|update)/i.test(command)) {
            editRecord(Number(idMatch[1]));
        } else if (idMatch && /^(remove|delete)/i.test(command)) {
            const target = Array.from(conversation.querySelectorAll(".chat-track-action[data-track-action='delete']"))
                .find((button) => Number(button.dataset.trackId) === Number(idMatch[1]));
            if (target) {
                deleteRecord(Number(idMatch[1]), target);
            } else {
                addMessage("First ask me to “show my music” so I can find that record for you.");
            }
        } else {
            addMessage("I can help you add, browse, edit, or remove tracks. Try “add a song”, “show my music”, “edit 3”, or “remove 3”.");
        }
    }

    composer.addEventListener("submit", (event) => {
        event.preventDefault();
        const command = input.value;
        if (!command.trim()) return;
        input.value = "";
        handleCommand(command);
    });

    document.querySelectorAll("[data-chat-command]").forEach((button) => {
        button.addEventListener("click", () => handleCommand(button.dataset.chatCommand));
    });

    conversation.addEventListener("click", (event) => {
        const button = event.target.closest("[data-track-action]");
        if (!button || button.disabled) return;
        const id = Number(button.dataset.trackId);
        if (button.dataset.trackAction === "edit") editRecord(id);
        if (button.dataset.trackAction === "delete") deleteRecord(id, button);
    });
})();
