# OfficeVerse

## 🚀 Overview
**OfficeVerse** is a real-time 2D virtual office environment designed to facilitate remote collaboration and social interaction. Built with **Spring Boot** (Backend) and **Phaser 3** (Frontend), it features seamless multiplayer movement, a dual-mode chat system (Global & Private), and an interactive tile-based map.

![OfficeVerse Screenshot](https://via.placeholder.com/800x400?text=OfficeVerse+Gameplay) 
*(Replace this link with a real screenshot of your game!)*

## ✨ Features
*   **Real-Time Multiplayer**: See other players move and interact in real-time (powered by WebSockets).
*   **Dual-Mode Chat System**:
    *   **Global Chat**: Broadcast messages to everyone in the office.
    *   **Private Chat**: Click any player in the **Active Player List** to start a private conversation.
*   **Live Player List**: Dynamically updates as players join or leave. Handles disconnects gracefully.
*   **Robust Connectivity**: Includes "Heartbeat" mechanisms to ensure background tabs stay visible and connected.
*   **Interactive Environment**: Proximity-based interactions (e.g., "Press E to Interact" prompts).
*   **Responsive UI**: The game adapts to the screen size, keeping the chat sidebar accessible.

## 🛠️ Technology Stack
### Backend
*   **Java 17+**
*   **Spring Boot**: Handles WebSocket connections and broadcasting.
*   **WebSocket API**: Native Spring `TextWebSocketHandler` for low-latency communication.
*   **Maven**: Project dependency management.

### Frontend
*   **Phaser 3**: Powerful 2D Game Engine for rendering sprites, maps, and physics.
*   **HTML5 / CSS3**: Responsive UI overlay for the Chat Sidebar and Menus.
*   **JavaScript (ES6 Modules)**: Modular game logic and network handling.

## ⚙️ Setup & Installation

### Prerequisites
*   **Java JDK 17** or higher.
*   **Maven** (for building the backend).
*   A local web server (e.g., VS Code **Live Server** extension, Python `http.server`, or Node.js `http-server`).

### 1. Backend Setup
1.  Navigate to the backend directory:
    ```bash
    cd officeVerse-Backend-main
    ```
2.  Run the application using Maven:
    ```bash
    mvn spring-boot:run
    ```
    *   The WebSocket server will start on `ws://localhost:8080`.

### 2. Frontend Setup
1.  Navigate to the client directory:
    ```bash
    cd officeVerse-Client-main/officeVerse_client
    ```
2.  **Important**: Do not open `index.html` directly from the file system. You MUST serve it via a local server to load assets (JSON maps, images) correctly.
    *   **Using VS Code Live Server**: Open `index.html`, Right-Click -> **Open with Live Server**.
    *   **Using Python**:
        ```bash
        python -m http.server 5500
        ```
3.  Open your browser to the local server address (usually `http://127.0.0.1:5500` or `http://localhost:5500`).

## 🎮 How to Play
1.  **Move**: Use **WASD** or **Arrow Keys**.
2.  **Chat**:
    *   Type in the box and press **Enter**.
    *   Switch between **Global** and **Personal** tabs.
    *   Click a player's name in the **Personal** tab to whisper to them.
3.  **Interact**: Walk close to an object or player. If an interaction is available, a prompt will appear. Press **E**.

## 🚀 Future Roadmap
*   [ ] Avatar Selection Screen.
*   [ ] Multiple Office Rooms/Zones.
*   [ ] Voice Chat Integration.
*   [ ] Persistent User Accounts/Login.

## 📄 License
This project is open-source. Feel free to modify and distribute.
