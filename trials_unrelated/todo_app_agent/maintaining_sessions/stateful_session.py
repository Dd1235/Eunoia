import asyncio
import os
import uuid

from advice_agent import advice_agent
from dotenv import load_dotenv
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.genai import types

load_dotenv()

APP_NAME = "advice bot"
USER_ID = "dedeepya"

initial_state = {
    "user_name": "Dedeepya",
    "user_description": (
        "third year computer science student, trying to balance academics, internships, "
        "multiple personal projects, personal academic pursuits, studying ahead for the upcoming fifth semester, "
        "and wants to start preparing DSA and CP for placements."
    ),
    "user_goal": "get into big tech for next internship",
    "todos": [
        "Start leetcode",
        "Finish Eunoia project",
        "Start a golang project",
        "Learn about image models",
        "Lear about Kohnen clustering",
    ],
}


async def main():
    session_service_stateful = InMemorySessionService()
    SESSION_ID = str(uuid.uuid4())

    await session_service_stateful.create_session(
        app_name=APP_NAME,
        user_id=USER_ID,
        session_id=SESSION_ID,
        state=initial_state,
    )

    print("Created new session with ID:", SESSION_ID)

    runner = Runner(
        agent=advice_agent,
        app_name=APP_NAME,
        session_service=session_service_stateful,
    )

    while True:
        user_input = input("You: ")
        if user_input.lower() == "exit":
            print("Exiting conversation.")
            break

        new_message = types.Content(role="user", parts=[types.Part(text=user_input)])

        async for event in runner.run_async(
            user_id=USER_ID,
            session_id=SESSION_ID,
            new_message=new_message,
        ):
            if event.is_final_response():
                print(f"Agent: {event.content.parts[0].text}")

        session = await session_service_stateful.get_session(
            app_name=APP_NAME,
            user_id=USER_ID,
            session_id=SESSION_ID,
        )
        print("\n--- Current Todos ---")
        for todo in session.state.get("todos", []):
            print(f"- {todo}")
        print("---------------------\n")


if __name__ == "__main__":
    asyncio.run(main())
