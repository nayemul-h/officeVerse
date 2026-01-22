export function initChat(playerId) {
    const socket = new WebSocket('ws://localhost:8080/chat');

    // UI Elements
    const globalView = document.getElementById('global-view');
    const personalView = document.getElementById('personal-view');
    const globalHistory = document.getElementById('global-history');
    const personalHistory = document.getElementById('personal-history');
    const chatInput = document.getElementById('chat-input');

    const activePlayersList = document.getElementById('active-players-list');

    let activeTab = 'global';
    let selectedTargetId = null;

    const tabs = document.querySelectorAll('.chat-tab');

    // Tab Switching Logic
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active from all
            tabs.forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.chat-view').forEach(v => v.classList.remove('active'));

            // Set active
            tab.classList.add('active');
            const type = tab.getAttribute('data-tab');
            activeTab = type;
            document.getElementById(`${type}-view`).classList.add('active');
        });
    });

    const appendMessage = (historyDiv, text, color) => {
        const msgDiv = document.createElement('div');
        msgDiv.className = 'message';
        msgDiv.textContent = text;
        if (color) msgDiv.style.color = color;
        historyDiv.appendChild(msgDiv);
        historyDiv.scrollTop = historyDiv.scrollHeight;
    };

    const renderPlayerList = (ids) => {
        activePlayersList.innerHTML = '';
        if (ids.length === 0) {
            activePlayersList.innerHTML = '<div style="color:#666">No one else online</div>';
            return;
        }

        ids.forEach(id => {
            if (id == playerId) return; // Don't list self

            const div = document.createElement('div');
            div.className = 'player-item';
            div.textContent = `Player ${id}`;
            if (id == selectedTargetId) div.classList.add('selected');

            div.addEventListener('click', () => {
                selectedTargetId = id;
                // Update visuals
                document.querySelectorAll('.player-item').forEach(el => el.classList.remove('selected'));
                div.classList.add('selected');
                appendMessage(personalHistory, `System: Chatting with ${id}`, '#fea');
            });
            activePlayersList.appendChild(div);
        });
    };

    socket.onopen = () => {
        console.log('Chat Connected');
        // Register ID
        socket.send(`REGISTER:${playerId}`);
        appendMessage(globalHistory, 'System: Connected as ' + playerId, '#0f0');
    };

    socket.onmessage = (event) => {
        const data = event.data;
        const parts = data.split(':', 3); // Type:Sender:Msg or Type:Data

        if (data.startsWith("GLOBAL:")) {
            // GLOBAL:SenderID:Msg
            const sender = parts[1];
            const msg = parts[2];
            appendMessage(globalHistory, `[Global] P${sender}: ${msg}`);
        } else if (data.startsWith("PRIVATE:")) {
            // PRIVATE:SenderID:Msg OR PRIVATE:To Target:Msg
            const sender = parts[1];
            const msg = parts[2];
            appendMessage(personalHistory, `[Private] ${sender}: ${msg}`, '#fea');
        } else if (data.startsWith("PLAYER_LIST:")) {
            const listStr = data.substring(12); // Remove "PLAYER_LIST:"
            const ids = listStr ? listStr.split(',') : [];
            renderPlayerList(ids);
        } else {
            // System or Error
            appendMessage(globalHistory, data, '#aaa');
        }
    };

    socket.onclose = () => {
        console.log('Chat Disconnected');
        appendMessage(globalHistory, 'System: Disconnected', '#f00');
    };

    chatInput.addEventListener('keydown', (e) => {
        // Prevent game from capturing keys (WASD, Space, etc.)
        e.stopPropagation();

        if (e.key === 'Enter') {
            const text = chatInput.value.trim();
            if (text && socket.readyState === WebSocket.OPEN) {
                if (activeTab === 'global') {
                    // GLOBAL:MyID:Msg
                    socket.send(`GLOBAL:${playerId}:${text}`);
                } else {
                    // PRIVATE:MyID:TargetID:Msg
                    if (!selectedTargetId) {
                        appendMessage(personalHistory, 'System: Select a player from the list first', '#f00');
                        return;
                    }
                    socket.send(`PRIVATE:${playerId}:${selectedTargetId}:${text}`);
                }
                chatInput.value = '';
            }
        }
    });

    // Also stop propagation on keyup to be safe
    chatInput.addEventListener('keyup', (e) => e.stopPropagation());
}
