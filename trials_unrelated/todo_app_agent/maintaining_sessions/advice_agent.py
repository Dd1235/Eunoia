from typing import List

from google.adk.agents import Agent
from google.adk.tools.tool_context import ToolContext


def addTodo(todo: str, tool_context: ToolContext) -> dict:
    print(f"Tool: addTodo called with todo: {todo}")
    todos = tool_context.state.get("todos", [])
    todos.append(todo)
    tool_context.state["todos"] = todos
    return {
        "action": "addTodo",
        "todo": todo,
        "message": f"Todo '{todo}' added successfully.",
    }


def viewTodos(tool_context: ToolContext) -> dict:
    print("Tool: viewTodos called")
    todos = tool_context.state.get("todos", [])
    return {
        "action": "viewTodos",
        "todos": todos,
        "message": "Current todos retrieved successfully.",
    }


def updateTodos(todos: List[str], tool_context: ToolContext) -> dict:
    """
    Updates the todos in the session state.

    Args:
        todos (List[str]): The new list of todos to set.
        tool_context (ToolContext): The context of the tool being executed, which includes the session

    Returns:
        A confirmation message
    """
    print(f"Tool: updateTodos called with todos: {todos}")
    tool_context.state["todos"] = todos
    return {
        "action": "updateTodos",
        "todos": todos,
        "message": "Todos updated successfully.",
    }


def deleteTodo(todo: str, tool_context: ToolContext) -> dict:
    print(f"Tool: deleteTodo called with todo: {todo}")
    todos = tool_context.session.state.get("todos", [])
    if todo in todos:
        todos.remove(todo)
        tool_context.session.state["todos"] = todos
        return {
            "action": "deleteTodo",
            "todo": todo,
            "message": f"Todo '{todo}' deleted successfully.",
        }
    else:
        return {
            "action": "deleteTodo",
            "todo": todo,
            "message": f"Todo '{todo}' not found.",
        }


advice_agent = Agent(
    name="advice_agent",
    model="gemini-2.0-flash",
    description="Agent that provides advice on the todos created by the user",
    instruction="""
    You are an agent that provides advice on the todos created by the user.
    You help the user in recognizing vague todos and suggest ways to make them more specific or chunk them into smaller, actionable tasks.
    You also help the user in reassigning priorities of the todos.

    Here is some information about the user from the session state:
    - user_name: {{state.user_name}}
    - user_description: {{state.user_description}}
    - user_goal: {{state.user_goal}}
    - todos: {{state.todos}}

    Given the user's goal and description, please evaluate the provided list of todos. Do not ask for the todos again, they are listed above.

    Your task is to:
    1. Evaluate each todo in the `todos` list.
    2. Re-prioritize the list based on the user's goal of getting into big tech.
    3. For each todo, provide specific, actionable steps.
    """,
    tools=[addTodo, viewTodos, updateTodos, deleteTodo],
)
