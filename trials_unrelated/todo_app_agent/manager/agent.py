from google.adk.agents import Agent

from .sub_agents.vagueness_evaluator.agent import vagueness_evaluator

root_agent = Agent(
    name="manager",
    model="gemini-2.0-flash",
    description="Manager agent that delegates todo analysis tasks",
    instruction="""
You are the manager overseeing todo refinement. You send individual todos to sub-agents and integrate their feedback.
""",
    sub_agents=[vagueness_evaluator],
)
