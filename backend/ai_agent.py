# ============================================================
# backend/ai_agent.py
# ============================================================

import os

from dotenv import load_dotenv

from openai import OpenAI


load_dotenv()


groq_api_key = os.getenv(
    "GROQ_API_KEY"
)


if not groq_api_key:

    raise ValueError(
        "GROQ_API_KEY was not found "
        "in the .env file."
    )


client = OpenAI(

    api_key=groq_api_key,

    base_url=
        "https://api.groq.com/openai/v1"
)


def generate_explanation(

    plan,

    incidents,

    resources,

    previous_plan=None

):

    prompt = f"""

You are the AI Explanation Agent
for AapatSetu AI.

AapatSetu AI is an emergency
response coordination system.

The Python Resource Planner makes
the actual resource allocation
decisions.

Your job is ONLY to explain
the response plan.

IMPORTANT RULES:

- Do NOT change resource assignments.
- Do NOT create new assignments.
- Do NOT make dispatch decisions.
- Do NOT invent incidents.
- Do NOT invent resources.
- Explain only the information provided.

CURRENT INCIDENTS:

{incidents}


AVAILABLE RESOURCES:

{resources}


CURRENT RESPONSE PLAN:

{plan}


PREVIOUS RESPONSE PLAN:

{previous_plan}


Explain the situation using
these sections:

Situation:

Describe the current emergency
situation.


Resource Decisions:

Explain which resources are
assigned to which incidents.


Why:

Explain why the current resources
were selected.


Plan Changes:

If a previous plan exists,
explain what changed between
the previous plan and the
current plan.


Human Action:

Explain whether human approval
or attention is required.


Keep the explanation simple
and concise.

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


        answer = response[
            "choices"
        ][0][
            "message"
        ][
            "content"
        ]


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