from google.adk.agents.llm_agent import Agent
from agent_tools.forecaster import get_market_forecast
from agent_tools.risk_assessor import get_risk_assessment

root_agent = Agent(
    model='gemini-2.5-flash',
    name='root_agent',
    description='A helpful assistant for user questions.',
    instruction='Answer user questions to the best of your knowledge',
    tools=[get_market_forecast, get_risk_assessment],
)
