import asyncio
import json
from typing import Optional
from uuid import uuid4

from dotenv import load_dotenv
from google.adk.agents import Agent
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.adk.tools import FunctionTool
from google.genai import types

load_dotenv()

DB_PATH = "../../../dummy_todos.json"


def load_data():
    with open(DB_PATH) as f:
        return json.load(f)


def save_data(data):
    with open(DB_PATH, "w") as f:
        json.dump(data, f, indent=2)


def get_todos(userId: str) -> list:
    """Return all todos for the given user."""
    data = load_data()
    for user in data:
        if user["userId"] == userId:
            return user["todoList"]
    return []


def add_todo(userId: str, content: str) -> str:
    """Add a new todo for a user."""
    data = load_data()
    new_todo = {
        "id": len(data[0]["todoList"]) + 1 if data else 1,  # Simple ID generation
        "content": content,
        "priority": 1,
        "done": False,
    }
    for user in data:
        if user["userId"] == userId:
            # increment all priorties by one before adding the new todo
            for todo in user["todoList"]:
                todo["priority"] += 1
            user["todoList"].append(new_todo)
            save_data(data)
            return new_todo["id"]
    return "User not found"


def delete_todo(userId: str, todoId: int) -> str:
    """Delete a todo by its ID for a given user."""
    data = load_data()
    for user in data:
        if user["userId"] == userId:
            user["todoList"] = [
                todo for todo in user["todoList"] if todo["id"] != todoId
            ]
            save_data(data)
            return "Deleted"
    return "User not found"


def update_todo(
    userId: str,
    todoId: int,
    content: Optional[str] = None,
    done: Optional[bool] = None,
) -> str:
    """Update fields of a todo (content, done) by ID."""
    data = load_data()
    for user in data:
        if user["userId"] == userId:
            for todo in user["todoList"]:
                if todo["id"] == todoId:
                    if content is not None:
                        todo["content"] = content
                    if done is not None:
                        todo["done"] = done
                    save_data(data)
                    return "Updated"
    return "Todo not found"


db_agent = Agent(
    model="gemini-2.0-flash",
    name="database_query_agent",
    instruction="You are a database query agent. You can query the database to get, add, delete, or update todos for users.",
    tools=[get_todos, add_todo, delete_todo, update_todo],
)

session_service = InMemorySessionService()
APP_NAME = "dummy query database"
USER_ID = "deepya"
SESSION_ID = "42"
runner = None


async def setup_once():
    global runner
    await session_service.create_session(
        app_name=APP_NAME, user_id=USER_ID, session_id=SESSION_ID
    )
    runner = Runner(agent=db_agent, app_name=APP_NAME, session_service=session_service)


# doesn't work


async def call_agent(query: str):
    content = types.Content(role="user", parts=[types.Part(text=query)])
    events = runner.run_async(
        user_id=USER_ID, session_id=SESSION_ID, new_message=content
    )

    response = ""
    async for event in events:
        if event.delta and event.delta.text:
            print(event.delta.text, end="", flush=True)
            response += event.delta.text
        elif event.content and event.content.parts:
            # Fallback for full content object (usually single turn)
            part_texts = [
                part.text for part in event.content.parts if hasattr(part, "text")
            ]
            text_output = "\n".join(part_texts)
            print(text_output)
            response += text_output
    print("\n")  # Final newline
    return response


async def main():
    await setup_once()
    print("Agent ready. Type 'exit' to quit.")
    while True:
        query = input("You: ")
        if query.lower() in {"exit", "quit"}:
            break
        await call_agent(query)


if __name__ == "__main__":
    asyncio.run(main())
