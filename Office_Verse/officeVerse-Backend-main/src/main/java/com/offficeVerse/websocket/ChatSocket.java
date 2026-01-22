package com.offficeVerse.websocket;

import org.springframework.stereotype.Component;
import org.springframework.web.socket.*;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.io.IOException;

@Component
public class ChatSocket extends TextWebSocketHandler {

    // Store all active chat sessions for global broadcast
    private final Set<WebSocketSession> sessions = ConcurrentHashMap.newKeySet();
    // Map PlayerID to Session for private messaging
    private final Map<Long, WebSocketSession> playerSessions = new ConcurrentHashMap<>();

    public ChatSocket() {
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        System.out.println("Chat WebSocket connected: " + session.getId());
        sessions.add(session);
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        String payload = message.getPayload();
        String[] parts = payload.split(":", 4); // expect at most 4 parts

        if (payload.startsWith("REGISTER:")) {
            // REGISTER:PlayerID
            if (parts.length >= 2) {
                Long playerId = Long.parseLong(parts[1]);
                playerSessions.put(playerId, session);
                System.out.println("Registered Chat Player: " + playerId);
                broadcast("GLOBAL:System:Player " + playerId + " joined the game.");
                broadcastPlayerList();
            }
        } else if (payload.startsWith("GLOBAL:")) {
            // GLOBAL:SenderID:Msg
            if (parts.length >= 3) {
                String senderId = parts[1];
                String text = parts[2];
                broadcast("GLOBAL:" + senderId + ":" + text);
            }
        } else if (payload.startsWith("PRIVATE:")) {
            // PRIVATE:SenderID:TargetID:Msg
            if (parts.length >= 4) {
                String senderId = parts[1];
                Long targetId = Long.parseLong(parts[2]);
                String text = parts[3];

                WebSocketSession targetSession = playerSessions.get(targetId);
                if (targetSession != null && targetSession.isOpen()) {
                    targetSession.sendMessage(new TextMessage("PRIVATE:" + senderId + ":" + text));
                    // Echo back to sender so they see their own message
                    session.sendMessage(new TextMessage("PRIVATE:To " + targetId + ":" + text));
                } else {
                    session.sendMessage(new TextMessage("SYSTEM:Player " + targetId + " not found/offline."));
                }
            }
        }
    }

    private void broadcastPlayerList() {
        try {
            // Format: PLAYER_LIST:id1,id2,id3
            String ids = String.join(",",
                    playerSessions.keySet().stream().map(String::valueOf).toArray(String[]::new));
            broadcast("PLAYER_LIST:" + ids);
        } catch (Exception e) {
            System.out.println("Error broadcasting player list: " + e.getMessage());
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        System.out.println("Chat WebSocket disconnected: " + session.getId());
        sessions.remove(session);

        // Find player ID for this session to announce departure
        Long leaverId = null;
        for (Map.Entry<Long, WebSocketSession> entry : playerSessions.entrySet()) {
            if (entry.getValue().getId().equals(session.getId())) {
                leaverId = entry.getKey();
                break;
            }
        }

        // Remove from playerSessions and announce
        if (leaverId != null) {
            playerSessions.remove(leaverId);
            broadcast("GLOBAL:System:Player " + leaverId + " left the game.");
            broadcastPlayerList();
        }
    }

    private void broadcast(String message) {
        for (WebSocketSession s : sessions) {
            if (s.isOpen()) {
                try {
                    s.sendMessage(new TextMessage(message));
                } catch (IOException e) {
                    System.out.println("Error sending message: " + e.getMessage());
                }
            }
        }
    }
}
