import os
import uuid

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from openai import OpenAI

load_dotenv()

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
conversations = {}
profiles = {}

client = OpenAI(
    api_key=os.getenv("GROQ_API_KEY"),
    base_url="https://api.groq.com/openai/v1"
)


@app.get("/")
def home():
    return {"message": "SpeakMate AI is running!"}

@app.get("/chat")
def chat(message: str, session_id: str):

    if session_id not in conversations:
        conversations[session_id] = []

    profile = profiles.get(session_id, {})

    system_prompt = f"""
    You are SpeakMate, a friendly English-speaking companion.

    Your primary goal is to help the user become comfortable speaking English.

    User profile:
    Name: {profile.get("name", "Unknown")}
    English level: {profile.get("english_level", "beginner")}
    Goal: {profile.get("goal", "Improve English speaking")}

    Rules:
    1. Talk naturally like a supportive friend.
    2. Never make the user feel embarrassed about English mistakes.
    3. Do not correct every tiny mistake.
    4. Correct important grammar mistakes naturally and briefly.
    5. After correcting the user, continue the conversation.
    6. Ask follow-up questions.
    7. Encourage the user to express their thoughts.
    8. Adapt your English difficulty to the user's level.
    9. Do not turn every conversation into a grammar lesson.
    10. Focus on building the user's confidence.
    """

    messages = [
        {
            "role": "system",
            "content": system_prompt
        }
    ]

    messages.extend(conversations[session_id])

    messages.append({
        "role": "user",
        "content": message
    })

    response = client.chat.completions.create(
        model="openai/gpt-oss-20b",
        messages=messages
    )

    ai_response = response.choices[0].message.content

    conversations[session_id].append({
        "role": "user",
        "content": message
    })

    conversations[session_id].append({
        "role": "assistant",
        "content": ai_response
    })

    return {
        "user_message": message,
        "ai_response": ai_response
    }
    
@app.post("/chat/clear")
def clear_chat(session_id: str):
    conversations.pop(session_id, None)

    return {
        "message": "Conversation cleared successfully"
    }
@app.post("/profile")
def create_profile(
    session_id: str,
    name: str,
    english_level: str = "beginner",
    goal: str = "Improve English speaking"
):
    profiles[session_id] = {
        "name": name,
        "english_level": english_level,
        "goal": goal
    }

    return {
        "message": "Profile created successfully",
        "profile": profiles[session_id]
    }