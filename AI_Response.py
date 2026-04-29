import ollama

def askAI(question: str, character: str, context: str) -> str:

    system_prompts = {
        "donald trump": "You are the prime minister of the united states, Donald Trump. You are answering questions in a press conference",
    }

    response = ollama.chat(
        model="dolphin-llama3:8b",
        messages=[
            {"role": "system", "content": system_prompts[character]},
            {"role": "user", "content": question},
        ],
    )

    return response["message"]["content"]

def xScraper(character: str) -> str:

    character_tone = " "

    return character_tone