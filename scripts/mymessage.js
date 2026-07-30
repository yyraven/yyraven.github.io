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

    // Reply UI elements
    const replyBanner = document.getElementById('reply-banner');
    const replyText = document.getElementById('reply-text');
    const cancelReplyBtn = document.getElementById('cancel-reply');
    const charCountDisplay = document.getElementById('char-count');

    let currentReplyTo = null;

    if (!form || !container) return;

    if (cancelReplyBtn) {
        cancelReplyBtn.addEventListener('click', function () {
            currentReplyTo = null;
            if (replyBanner) replyBanner.style.display = 'none';
        });
    }

    if (messageInput) {
        messageInput.addEventListener('input', function () {
            if (charCountDisplay) {
                charCountDisplay.textContent = `${this.value.length} / 3000`;
            }
        });
    }

    const FORM_URL = `https://docs.google.com/forms/d/e/${GOOGLE_FORM_ID}/formResponse`;
    const SHEET_URL = `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEET_ID}/export?format=csv`;

    // 健壮的 CSV 解析函数（能完美处理带引号和内部换行符的多行文本）
    function parseCSV(text) {
        let p = '', row = [''], ret = [row], i = 0, r = 0, s = !0, l;
        for (l of text) {
            if ('"' === l) {
                if (s && l === p) row[row.length - 1] += '"';
                s = !s;
            } else if (',' === l && s) {
                l = row[row.length - 1];
                row.push('');
            } else if (('\r' === l || '\n' === l) && s) {
                if ('\r' === l) continue;
                ret.push(row = ['']);
            } else {
                row[row.length - 1] += l;
            }
            p = l;
        }
        return ret;
    }

    async function loadMessages() {
        try {
            const response = await fetch(SHEET_URL);
            if (!response.ok) throw new Error("Network response was not ok");

            const textData = await response.text();
            const parsedRows = parseCSV(textData);

            // 去掉表头，并过滤掉空行
            const rows = parsedRows.slice(1).filter(row => row && row.length >= 4 && row[1] && row[1].trim() !== "");

            if (rows.length === 0) {
                container.innerHTML = "<p style='opacity: 0.7; font-family: inherit;'>No messages yet. Be the first!</p>";
                return;
            }

            container.innerHTML = "";

            rows.reverse().forEach(cols => {
                let time = cols[0] ? cols[0].replace(/^"|"$/g, '').trim() : '';
                if (time.includes(' ')) {
                    time = time.split(' ')[0];
                }

                const name = cols[1] ? cols[1].replace(/^"|"$/g, '').trim() : '';
                const website = cols[2] ? cols[2].replace(/^"|"$/g, '').trim() : '';

                // 获取第四列留言内容，安全清理外层引号并将 CSV 转义的双引号还原
                let message = cols[3] ? cols[3].trim() : '';
                if (message.startsWith('"') && message.endsWith('"')) {
                    message = message.slice(1, -1);
                }
                message = message.replace(/""/g, '"');

                let nameHtml = `<strong>${name}</strong>`;
                if (website !== "") {
                    let url = website.startsWith('http') ? website : 'https://' + website;
                    nameHtml = `<a href="${url}" target="_blank" rel="noopener noreferrer">${nameHtml}</a>`;
                }

                const div = document.createElement('div');
                    div.style.cssText = "padding: 15px; margin-bottom: 15px; background: rgba(150, 150, 150, 0.08); border: 1px solid rgba(150, 150, 150, 0.2); border-radius: var(--global-radius); font-family: inherit;";

                    const parsedMessage = window.marked ? marked.parse(message) : message;

                    div.innerHTML = `
                        <div style="font-size: 0.85em; opacity: 0.7; margin-bottom: 8px; font-family: inherit; display: flex; justify-content: space-between; align-items: center;">
                            <span>${nameHtml} • ${time}</span>
                            <button class="reply-trigger" style="background: none; border: none; color: inherit; cursor: pointer; font-size: 0.9em; opacity: 0.6; text-decoration: underline; font-family: inherit;">Reply</button>
                        </div>
                        <div style="font-size: 1em; font-family: inherit; line-height: 1.6;">${parsedMessage}</div>
                    `;

                    // 绑定 Reply 按钮逻辑：提取原消息的前 10 个字作为摘要
                    const replyBtn = div.querySelector('.reply-trigger');
                    replyBtn.addEventListener('click', function () {
                        // 清理掉消息里的换行，变成纯文本
                        const cleanMsgText = message.replace(/[\r\n]+/g, ' ').trim();
                        // 截取前 10 个字
                        const snippet = cleanMsgText.substring(0, 10) + (cleanMsgText.length > 10 ? '...' : '');

                        currentReplyTo = {
                            name: name,
                            snippet: snippet
                        };

                        if (replyBanner && replyText) {
                            replyText.textContent = `Replying to @${name}: "${snippet}"`;
                            replyBanner.style.display = 'flex';
                        }
                        if (messageInput) {
                            messageInput.focus();
                        }
                    });

                container.appendChild(div);
            });
        } catch (err) {
            console.error("Load Error:", err);
            container.innerHTML = "<p style='font-family: inherit;'>Failed to load messages.</p>";
        }
    }

    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        submitBtn.disabled = true;
        submitBtn.textContent = "Sending...";

        let rawMessage = document.getElementById('msg-content').value;

        if (currentReplyTo) {
            // 引用格式：带上名字和前10字摘要
            rawMessage = `> **@${currentReplyTo.name}**: "${currentReplyTo.snippet}"\n\n${rawMessage}`;
        }

        const formData = new FormData();
        formData.append(ENTRY_NAME, document.getElementById('msg-name').value);
        formData.append(ENTRY_MESSAGE, rawMessage);

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
            currentReplyTo = null;
            if (replyBanner) replyBanner.style.display = 'none';
            if (charCountDisplay) charCountDisplay.textContent = `0 / 3000`;

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
