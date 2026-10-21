(() => {
    const feed = document.querySelector("#room-chat-messages");
    const loopToggle = document.querySelector("#chat-loop-toggle");

    if (!feed || !loopToggle) return;

    const messages = Array.from(feed.querySelectorAll(".chat-feed-message")).map((element) => ({
        name: element.dataset.name,
        text: element.dataset.text,
        side: element.dataset.side,
        time: element.dataset.time,
        avatar: element.querySelector(".chat-feed-avatar img")?.src || "",
        profileUrl: element.dataset.profileUrl,
    }));
    if (!messages.length) return;

    const chatLoops = [
        [
            ["no_future.exe", "am i cooked?"],
            ["unpaidtherapist", "you're the recipe."],
            ["no_future.exe", "damn."],
            ["unpaidtherapist", 'even the oven said "nah."'],
            ["no_future.exe", "anyway, am i cooked?"],
        ],
        [
            ["ghostedagain", "she said i'm not her type."],
            ["redflag.zip", "you're not even a type."],
            ["ghostedagain", "what does that mean?"],
            ["redflag.zip", "you're an error message."],
            ["ghostedagain", "at least errors get attention."],
            ["redflag.zip", "from people trying to close them."],
        ],
        [
            ["admin", "everyone behave. important announcement."],
            ["ratking", "your haircut has a loading screen."],
            ["admin", "i'm deleting this server."],
            ["SYSTEM", "#general has been deleted."],
            ["admin", "who made a backup?"],
            ["ratking", "welcome back, idiots."],
        ],
    ];
    const messageByName = new Map(messages.map((message) => [message.name, message]));
    const profiledSpeakers = Array.from(
        new Map(
            messages
                .filter((message) => message.avatar && message.profileUrl)
                .map((message) => [message.name, message])
        ).values()
    );
    const dialogueSpeakerByName = new Map();
    let dialogueSpeakerIndex = 0;
    const conversations = [
        messages,
        ...chatLoops.map((chat, chatIndex) => chat.map(([speaker, text], messageIndex) => {
            if (!dialogueSpeakerByName.has(speaker) && profiledSpeakers.length) {
                const profile = profiledSpeakers[dialogueSpeakerIndex % profiledSpeakers.length];
                dialogueSpeakerByName.set(speaker, profile);
                dialogueSpeakerIndex += 1;
            }

            const profile = dialogueSpeakerByName.get(speaker) || messageByName.get(speaker);
            return {
                ...profile,
                text,
                time: `03:${String(41 + chatIndex * 5 + messageIndex).padStart(2, "0")} AM`,
                serverDeleted: speaker === "SYSTEM" && text.includes("deleted"),
            };
        }).filter((message) => message.name && message.avatar && message.profileUrl)),
    ];

    let conversationIndex = 0;
    let messageIndex = 0;
    let messageCount = 0;
    let paused = false;
    let userIsReadingHistory = false;
    let timer;
    let pendingTyping = null;
    const maxVisibleMessages = 10;

    function scrollToLatest() {
        if (!userIsReadingHistory) {
            feed.scrollTo({ top: feed.scrollHeight, behavior: "smooth" });
        }
    }

    function makeAvatar(source, name, className, profileUrl) {
        const avatar = document.createElement(profileUrl ? "a" : "span");
        avatar.className = className;
        if (profileUrl) {
            avatar.href = profileUrl;
            avatar.setAttribute("aria-label", `Open ${name}'s profile`);
            avatar.title = `Open ${name}'s profile`;
        }
        if (source) {
            const image = document.createElement("img");
            image.src = source;
            image.alt = profileUrl ? `${name} profile picture` : `${name} avatar`;
            avatar.appendChild(image);
        } else {
            avatar.textContent = name.slice(0, 1).toUpperCase();
        }
        return avatar;
    }

    function addReactions(message, target) {
        const reactions = document.createElement("div");
        reactions.className = "chat-feed-reactions";
        ["🔥", "💜", "😂"].forEach((emoji) => {
            const button = document.createElement("button");
            button.type = "button";
            button.className = "chat-feed-reaction";
            button.setAttribute("aria-label", `React to ${message.name}'s message with ${emoji}`);
            button.innerHTML = `${emoji}<span>0</span>`;
            button.addEventListener("click", () => {
                const count = button.querySelector("span");
                count.textContent = String(Number(count.textContent) + 1);
                button.classList.remove("is-popping");
                requestAnimationFrame(() => button.classList.add("is-popping"));
                window.setTimeout(() => button.classList.remove("is-popping"), 450);
            });
            reactions.appendChild(button);
        });
        target.querySelector(".chat-feed-copy").appendChild(reactions);
    }

    function appendMessage(message) {
        const target = document.createElement("article");
        target.className = `chat-feed-message ${message.side} chat-loop-message`;
        target.id = `room-message-${messageCount}`;
        target.dataset.name = message.name;

        const avatar = makeAvatar(message.avatar, message.name, "chat-feed-avatar", message.profileUrl);
        const copy = document.createElement("div");
        copy.className = "chat-feed-copy";

        const meta = document.createElement("div");
        meta.className = "chat-feed-meta";
        const name = document.createElement("strong");
        name.textContent = message.name;
        const time = document.createElement("span");
        time.textContent = message.time;
        meta.append(name, time);

        const text = document.createElement("p");
        text.textContent = message.text;
        copy.append(meta, text);
        target.append(avatar, copy);
        addReactions(message, target);
        feed.appendChild(target);
        messageCount += 1;
        if (message.serverDeleted) {
            showServerDeletedNotice();
        }

        const visibleMessages = feed.querySelectorAll(".chat-loop-message:not(.chat-feed-typing)");
        if (visibleMessages.length > maxVisibleMessages) {
            const oldestMessage = visibleMessages[0];
            oldestMessage.classList.add("is-fading");
            window.setTimeout(() => oldestMessage.remove(), 420);
        }

        requestAnimationFrame(() => target.classList.add("is-visible"));
        scrollToLatest();
    }

    function showServerDeletedNotice() {
        const windowElement = feed.closest(".chat-feed-window");
        if (!windowElement) return;

        const notice = document.createElement("div");
        notice.className = "chat-server-notice";
        notice.setAttribute("role", "status");
        notice.textContent = "SYSTEM: SERVER DELETED";
        windowElement.appendChild(notice);
        requestAnimationFrame(() => notice.classList.add("is-visible"));
        window.setTimeout(() => {
            notice.classList.remove("is-visible");
            window.setTimeout(() => notice.remove(), 350);
        }, 1400);
    }

    function appendTyping(message) {
        const target = document.createElement("article");
        target.className = "chat-feed-message incoming chat-loop-message chat-feed-typing";
        target.setAttribute("aria-label", `${message.name} is typing`);
        target.append(makeAvatar(message.avatar, message.name, "chat-feed-avatar", message.profileUrl));

        const copy = document.createElement("div");
        copy.className = "chat-feed-copy";
        const meta = document.createElement("div");
        meta.className = "chat-feed-meta";
        const name = document.createElement("strong");
        name.textContent = message.name;
        const status = document.createElement("span");
        status.textContent = "is typing";
        meta.append(name, status);

        const dots = document.createElement("div");
        dots.className = "typing-dots";
        dots.setAttribute("aria-hidden", "true");
        for (let dot = 0; dot < 3; dot += 1) dots.appendChild(document.createElement("span"));
        copy.append(meta, dots);
        target.appendChild(copy);
        feed.appendChild(target);
        requestAnimationFrame(() => target.classList.add("is-visible"));
        scrollToLatest();
        return target;
    }

    function playNextMessage() {
        if (paused) return;
        const conversation = conversations[conversationIndex];
        const message = conversation[messageIndex];
        messageIndex += 1;
        if (messageIndex >= conversation.length) {
            messageIndex = 0;
            conversationIndex = (conversationIndex + 1) % conversations.length;
        }

        if (message.side === "incoming" && messageCount % 4 === 0) {
            pendingTyping = appendTyping(message);
            timer = window.setTimeout(() => {
                pendingTyping.remove();
                pendingTyping = null;
                appendMessage(message);
                timer = window.setTimeout(playNextMessage, 1750);
            }, 850);
            return;
        }

        appendMessage(message);
        timer = window.setTimeout(playNextMessage, 1750);
    }

    feed.addEventListener("scroll", () => {
        userIsReadingHistory = feed.scrollTop + feed.clientHeight < feed.scrollHeight - 50;
    });

    loopToggle.addEventListener("click", () => {
        paused = !paused;
        loopToggle.setAttribute("aria-pressed", String(paused));
        loopToggle.textContent = paused ? "RESUME LOOP" : "PAUSE LOOP";
        feed.classList.toggle("is-paused", paused);
        window.clearTimeout(timer);
        if (paused && pendingTyping) {
            pendingTyping.remove();
            pendingTyping = null;
        } else if (!paused) {
            playNextMessage();
        }
    });

    feed.replaceChildren();
    playNextMessage();
})();
