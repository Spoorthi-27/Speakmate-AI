import { useState } from "react";
import "./App.css";

const sessionId =
  localStorage.getItem("speakmate_session_id") ||
  crypto.randomUUID();

localStorage.setItem("speakmate_session_id", sessionId);

function App() {
  const savedProfile = JSON.parse(
    localStorage.getItem("speakmate_profile")
  );

  const [profileCreated, setProfileCreated] = useState(
    savedProfile !== null
  );

  const [name, setName] = useState(
    savedProfile?.name || ""
  );

  const [englishLevel, setEnglishLevel] = useState(
    savedProfile?.englishLevel || "beginner"
  );

  const [goal, setGoal] = useState(
    savedProfile?.goal || "Speak English confidently"
  );

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const createProfile = async () => {
    if (!name.trim()) return;

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/profile?session_id=${sessionId}&name=${encodeURIComponent(
          name
        )}&english_level=${encodeURIComponent(
          englishLevel
        )}&goal=${encodeURIComponent(goal)}`,
        {
          method: "POST"
        }
      );

      if (!response.ok) {
        throw new Error("Profile creation failed");
      }
      localStorage.setItem(
        "speakmate_profile",
        JSON.stringify({
          name,
          englishLevel,
          goal
        })
      );

      setProfileCreated(true);

    } catch (error) {
      console.error("Profile error:", error);
      alert("Could not create your profile.");
    }
  };

  const sendMessage = async () => {
    if (!message.trim() || isLoading) return;

    const userMessage = message;

    setMessages((prev) => [
      ...prev,
      { role: "user", content: userMessage }
    ]);

    setMessage("");
    setIsLoading(true);

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/chat?message=${encodeURIComponent(
          userMessage
        )}&session_id=${sessionId}`
      );

      if (!response.ok) {
        throw new Error("Server error");
      }

      const data = await response.json();

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.ai_response }
      ]);
    } catch (error) {
      console.error("Error:", error);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I couldn't connect to SpeakMate."
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = async () => {
    try {
      await fetch(
        `http://127.0.0.1:8000/chat/clear?session_id=${sessionId}`,
        {
          method: "POST"
        }
      );

      setMessages([]);
    } catch (error) {
      console.error("Could not clear conversation:", error);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      sendMessage();
    }
  };

  // PROFILE SCREEN
  if (!profileCreated) {
    return (
      <div className="profile-page">
        <div className="profile-card">
          <h1>💬 SpeakMate AI</h1>

          <p className="subtitle">
            Your friendly English-speaking companion
          </p>

          <h2>👋 Welcome!</h2>

          <p>
            Tell me a little about yourself so I can make our
            conversations more personal.
          </p>

          <label>Your name</label>

          <input
            type="text"
            placeholder="Enter your name"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />

          <label>Your English level</label>

          <select
            value={englishLevel}
            onChange={(event) => setEnglishLevel(event.target.value)}
          >
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>

          <label>Your goal</label>

          <select
            value={goal}
            onChange={(event) => setGoal(event.target.value)}
          >
            <option value="Speak English confidently">
              Speak English confidently
            </option>

            <option value="Improve grammar">
              Improve grammar
            </option>

            <option value="Improve vocabulary">
              Improve vocabulary
            </option>

            <option value="Prepare for interviews">
              Prepare for interviews
            </option>

            <option value="Practice everyday conversation">
              Practice everyday conversation
            </option>
          </select>

          <button
            className="continue-button"
            onClick={createProfile}
          >
            Continue →
          </button>
        </div>
      </div>
    );
  }

  // CHAT SCREEN
  return (
    <div className="app">
      <header className="header">
        <div>
          <h1>💬 SpeakMate AI</h1>
          <p>Your friendly English-speaking companion</p>
        </div>

        <button
          className="new-chat-button"
          onClick={clearChat}
        >
          + New Chat
        </button>
      </header>

      <main className="chat-container">
        <div className="messages">

          {messages.length === 0 && (
            <div className="welcome">
              <h2>Hey {name}! 👋</h2>

              <p>
                I'm SpeakMate. Talk to me about your day,
                your interests, or anything you want.
              </p>

              <p>
                Don't worry about making English mistakes. 😊
              </p>
            </div>
          )}

          {messages.map((msg, index) => (
            <div
              key={index}
              className={`message ${msg.role === "user"
                ? "user-message"
                : "ai-message"
                }`}
            >
              {msg.content}
            </div>
          ))}

          {isLoading && (
            <div className="message ai-message">
              🤔 Thinking...
            </div>
          )}

        </div>

        <div className="input-area">
          <input
            type="text"
            placeholder="Type something in English..."
            value={message}
            onChange={(event) =>
              setMessage(event.target.value)
            }
            onKeyDown={handleKeyDown}
          />

          <button
            onClick={sendMessage}
            disabled={isLoading}
          >
            {isLoading ? "Thinking..." : "Send"}
          </button>
        </div>
      </main>
    </div>
  );
}

export default App;