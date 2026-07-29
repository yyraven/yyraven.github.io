document.addEventListener('DOMContentLoaded', function () {

    // ==========================================
    // 1. PASTE YOUR EXACT IDs HERE
    // ==========================================
    const GOOGLE_FORM_ID = "1FAIpQLScCcPxSG286dr8gCpCxMpdXM_kwKoOCVcjbuLzG9FvVjp5dMQ";
    const GOOGLE_SHEET_ID = "1BYI91OPX8Uev6tRtIYzHjG857MbZw47UJnzPoHX1oKI";
    const ENTRY_NAME = "entry.470289015";
    const ENTRY_MESSAGE = "entry.1327680408";
    const ENTRY_WEBSITE = "entry.785894166";
    // ==========================================

    const form = document.getElementById('msg-form');
    const container = document.getElementById('messages-container');
    const feedback = document.getElementById('msg-feedback');
    const submitBtn = document.getElementById('msg-submit');
    const messageInput = document.getElementById('msg-content');

    if (!form || !container) return;

    const charCountDisplay = document.getElementById('char-count');

    // 2. PREVENT LINE BREAKS & TRACK CHARACTER LIMIT
    if (messageInput) {
        messageInput.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') {
                e.preventDefault();
            }
        });

        messageInput.addEventListener('paste', function (e) {
            e.preventDefault();
            const text = (e.clipboardData || window.clipboardData).getData('text');
            const cleanText = text.replace(/[\r\n]+/g, ' ');

            const start = this.selectionStart;
            const end = this.selectionEnd;

            // Respect the maxlength attribute even during pastes
            const currentVal = this.value;
            const allowedLength = 3000 - (currentVal.length - (end - start));
            const truncatedText = cleanText.substring(0, allowedLength);

            this.value = currentVal.substring(0, start) + truncatedText + currentVal.substring(end);
            this.selectionStart = this.selectionEnd = start + truncatedText.length;

            if (charCountDisplay) {
                charCountDisplay.textContent = `${this.value.length} / 3000`;
            }
        });

        messageInput.addEventListener('input', function () {
            if (charCountDisplay) {
                charCountDisplay.textContent = `${this.value.length} / 3000`;
            }
        });
    }

    const FORM_URL = `https://docs.google.com/forms/d/e/${GOOGLE_FORM_ID}/formResponse`;
    const SHEET_URL = `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEET_ID}/export?format=csv`;

    // 3. LOAD MESSAGES FROM GOOGLE SHEETS
    async function loadMessages() {
        try {
            const response = await fetch(SHEET_URL);
            if (!response.ok) throw new Error("Network response was not ok");

            const data = await response.text();
            const rows = data.split('\n').slice(1).filter(row => row.trim() !== "");

            if (rows.length === 0) {
                container.innerHTML = "<p style='opacity: 0.7; font-family: inherit;'>No messages yet. Be the first!</p>";
                return;
            }

            container.innerHTML = "";

            rows.reverse().forEach(row => {
                const cols = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);

                if (cols.length >= 4) {
                    let time = cols[0].replace(/^"|"$/g, '').trim();
                    if (time.includes(' ')) {
                        time = time.split(' ')[0];
                    }

                    const name = cols[1].replace(/^"|"$/g, '').trim();
                    const website = cols[2].replace(/^"|"$/g, '').trim();
                    const message = cols[3].replace(/^"|"$/g, '').trim();

                    let nameHtml = `<strong>${name}</strong>`;
                    if (website !== "") {
                        let url = website.startsWith('http') ? website : 'https://' + website;
                        nameHtml = `<a href="${url}" target="_blank" rel="noopener noreferrer">${nameHtml}</a>`;
                    }

                    const div = document.createElement('div');
                    div.style.cssText = "padding: 15px; margin-bottom: 15px; background: rgba(150, 150, 150, 0.08); border: 1px solid rgba(150, 150, 150, 0.2); border-radius: var(--global-radius); font-family: inherit;";

                    // Render markdown using the marked library, while preserving inline formatting cleanly
                    const parsedMessage = window.marked ? marked.parse(message) : message;

                    div.innerHTML = `
                        <div style="font-size: 0.85em; opacity: 0.7; margin-bottom: 8px; font-family: inherit;">
                            ${nameHtml} • ${time}
                        </div>
                        <div style="font-size: 1em; font-family: inherit; line-height: 1.6;">${parsedMessage}</div>
                    `;
                    container.appendChild(div);
                }
            });
        } catch (err) {
            console.error("Load Error:", err);
            container.innerHTML = "<p style='font-family: inherit;'>Failed to load messages.</p>";
        }
    }

    // 4. SUBMIT MESSAGE TO GOOGLE FORMS
    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        submitBtn.disabled = true;
        submitBtn.textContent = "Sending...";

        const formData = new FormData();
        formData.append(ENTRY_NAME, document.getElementById('msg-name').value);
        formData.append(ENTRY_MESSAGE, document.getElementById('msg-content').value);

        const websiteVal = document.getElementById('msg-website').value;
        if (websiteVal.trim() !== "") {
            formData.append(ENTRY_WEBSITE, websiteVal);
        }

        try {
            await fetch(FORM_URL, {
                method: 'POST',
                mode: 'no-cors',
                body: formData
            });

            form.reset();
            feedback.textContent = "Message posted! Reloading...";
            feedback.style.display = "block";

            setTimeout(() => {
                feedback.style.display = "none";
                submitBtn.disabled = false;
                submitBtn.textContent = "Post Message";
                loadMessages();
            }, 2000);

        } catch (err) {
            console.error("Submit Error:", err);
            feedback.textContent = "Error submitting message. Please try again.";
            feedback.style.display = "block";

            submitBtn.disabled = false;
            submitBtn.textContent = "Post Message";
        }
    });

    loadMessages();
});
