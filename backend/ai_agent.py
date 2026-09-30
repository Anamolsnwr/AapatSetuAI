import os

from dotenv import load_dotenv
from openai import OpenAI


# ======================================================
# LOAD ENVIRONMENT VARIABLES
# ======================================================

load_dotenv()

groq_api_key = os.getenv("GROQ_API_KEY")


if not groq_api_key:

    raise ValueError(
        "GROQ_API_KEY was not found in the .env file."
    )


# ======================================================
# GROQ CLIENT
# ======================================================

client = OpenAI(

    api_key=groq_api_key,

    base_url="https://api.groq.com/openai/v1"
)


# ======================================================
# AI EXPLANATION
# ======================================================

def generate_explanation(
    plan,
    incidents,
    resources,
    previous_plan=None
):

    prompt = f"""
You are the AI Explanation Agent for AapatSetu AI.

AapatSetu AI is an emergency response coordination
system.

The Python planner makes all resource allocation
decisions.

Your role is ONLY to explain those decisions.

IMPORTANT RULES:

1. Do not change resource assignments.
2. Do not create new assignments.
3. Do not recommend dispatch decisions.
4. Do not invent information.
5. Use only the provided data.
6. If information is missing, say so.
7. Keep the explanation simple and concise.

CURRENT INCIDENTS:

{incidents}


AVAILABLE RESOURCES:

{resources}


CURRENT RESPONSE PLAN:

{plan}


PREVIOUS RESPONSE PLAN:

{previous_plan}


Explain the situation using exactly these sections:

Situation:
Explain the current emergency situation.

Resource Decisions:
Explain which resources are assigned to which incidents.

Why:
Explain why the Python planner selected these resources.

Plan Changes:
Compare the current plan with the previous plan.
If there is no previous plan, say that this is the initial plan.

Human Action:
Explain whether human approval or attention is required.

Important:
The Python planner is the decision-making system.
You are only explaining its output.
"""


    try:

        response = client.chat.completions.create(

            model="openai/gpt-oss-20b",

            messages=[
                {
                    "role":
                        "user",

                    "content":
                        prompt
                }
            ]
        )


        answer = (
            response
            .choices[0]
            .message
            .content
        )


        return {

            "summary":
                answer
        }


    except Exception as error:

        print()
        print(
            "========================================"
        )
        print(
            "          GROQ API ERROR"
        )
        print(
            "========================================"
        )

        print(
            "Error type:",
            type(error).__name__
        )

        print(
            "Error:",
            str(error)
        )

        print(
            "========================================"
        )

        print()

        raise