package com.offficeVerse.websocket;

import org.springframework.stereotype.Component;
import org.springframework.web.socket.*;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.util.HashMap;
import java.util.Map;

@Component
public class MovementSocket extends TextWebSocketHandler {

    // Track sessions for broadcasting
    private final Map<String, WebSocketSession> sessions = new HashMap<>();
    // Track player ID per session for disconnect handling
    private final Map<String, Long> sessionToPlayerId = new HashMap<>();

    public MovementSocket() {
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        System.out.println("WebSocket connected: " + session.getId());
        sessions.put(session.getId(), session);
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {

        String[] parts = message.getPayload().split(":");
        if (parts.length != 3) {
            session.sendMessage(new TextMessage("Invalid format. Use playerId:x:y"));
            return;
        }

        try {
            Long playerId = Long.parseLong(parts[0]);
            int x = Integer.parseInt(parts[1]);
            int y = Integer.parseInt(parts[2]);

            // Map session to player ID
            sessionToPlayerId.put(session.getId(), playerId);

            // DB interactions removed for performance and to solve
            // StaleObjectStateException.
            // Using in-memory broadcast only for this prototype.

            // System.out.println("Broadcasting to " + sessions.size() + " sessions");
            // broadcast to other players in the same room
            for (WebSocketSession s : sessions.values()) {
                if (s.isOpen()) {
                    try {
                        s.sendMessage(new TextMessage("Broadcast:" + playerId + ":" + x + ":" + y));
                    } catch (Exception e) {
                        System.out.println("Error broadcasting movement: " + e.getMessage());
                    }
                }
            }

        } catch (NumberFormatException e) {
            System.out.println("Error parsing numbers: " + e.getMessage());
            session.sendMessage(new TextMessage("Invalid numbers"));
        } catch (Exception e) {
            System.out.println("Error in handleTextMessage: " + e.getMessage());
            e.printStackTrace();
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        System.out.println("WebSocket disconnected: " + session.getId());

        Long playerId = sessionToPlayerId.get(session.getId());
        if (playerId != null) {
            System.out.println("Player " + playerId + " left. Broadcasting disconnect.");
            for (WebSocketSession s : sessions.values()) {
                if (s.isOpen()) { // Don't send to self (already closed)
                    try {
                        s.sendMessage(new TextMessage("PlayerLeft:" + playerId));
                    } catch (Exception e) {
                        System.out.println("Error broadcasting left: " + e.getMessage());
                    }
                }
            }
        }

        sessions.remove(session.getId());
        sessionToPlayerId.remove(session.getId());
    }
}
