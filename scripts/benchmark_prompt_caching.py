import asyncio
import os
import sys
import time
from pathlib import Path

# Add project root to sys.path
sys.path.append(str(Path(__file__).parent.parent.absolute()))

from openai import AsyncOpenAI

from src.config import get_settings
from src.services.chat_optimization import build_system_prompt, split_formatted_prompt

# Ensure OpenAI API Key is present
settings = get_settings()
api_key = settings.openai_api_key or os.getenv("OPENAI_API_KEY")
if not api_key or "your-key" in api_key:
    print("Error: OPENAI_API_KEY is not set properly in .env or settings.yaml.")
    sys.exit(1)

client = AsyncOpenAI(api_key=api_key)

# Mocked slides context to simulate RAG
MOCK_SLIDES_DOCKER = """
- Tài liệu 1: Docker Basics | Slide 2 | Containerization là công nghệ ảo hóa ở cấp độ hệ điều hành. Khác với VM, Container chia sẻ nhân kernel của host OS, giúp nhẹ hơn và khởi động nhanh hơn.
- Tài liệu 2: Docker Basics | Slide 5 | Docker Image là một snapshot tĩnh dạng read-only chứa code, runtime, libraries và configs. Docker Container là một thực thể chạy của Image.
- Tài liệu 3: Docker Basics | Slide 10 | Docker Compose dùng file docker-compose.yaml (YAML format) để định nghĩa và chạy các ứng dụng multi-container dễ dàng.
"""

MOCK_SLIDES_NETWORKING = """
- Tài liệu 1: Docker Networking | Slide 4 | Các driver mạng chính của Docker gồm: bridge (mặc định), host (dùng chung mạng với host), overlay (cho multi-host swarm), và none.
- Tài liệu 2: Docker Networking | Slide 7 | Lệnh docker run -p 8080:80 maps port 80 của container ra port 8080 của host machine để truy cập từ ngoài.
"""

MOCK_PROFILE = {
    "elo_score": 1250.0,
    "bkt_mastery_probability": 0.45,
    "weakness_flag": False,
    "active_quiz_session": False,
    "scaffolding_rules": "- Học viên có trình độ trung bình khá.\n- Sử dụng thang gợi mở Socratic bậc 2.",
    "mode_instructions": "CHẾ ĐỘ: GIẢI THÍCH (Explain Mode)\n- Nhiệm vụ: Giải thích khái niệm học thuật.",
    "intent": "academic",
}

# 3 turns of conversation
CONVERSATION_TURNS = [
    {"query": "Hãy giải thích cho mình khái niệm Docker và tại sao nó lại nhẹ hơn VM?", "context": MOCK_SLIDES_DOCKER},
    {
        "query": "Vậy thì Docker Image khác Docker Container như thế nào? Cho ví dụ thực tế.",
        "context": MOCK_SLIDES_DOCKER,
    },
    {
        "query": "Làm thế nào để truy cập được một Docker Container từ bên ngoài mạng?",
        "context": MOCK_SLIDES_NETWORKING,
    },
]


async def run_turn_baseline(turn_idx: int, history: list[dict], query: str, context: str) -> tuple[dict, str]:
    """Runs a single turn using the Baseline (monolithic system prompt at top)."""
    # 1. Build monolithic prompt
    system_prompt = build_system_prompt(context, MOCK_PROFILE, "Explain")

    # 2. Build messages list
    messages = [{"role": "system", "content": system_prompt}]
    for msg in history:
        messages.append({"role": msg["role"], "content": msg["content"]})
    messages.append({"role": "user", "content": query})

    # 3. Call LLM with streaming to measure TTFT
    start_time = time.perf_counter()
    ttft = 0.0
    total_time = 0.0
    response_text_chunks = []

    stream = await client.chat.completions.create(
        model="gpt-4o-mini", messages=messages, temperature=0.2, stream=True, stream_options={"include_usage": True}
    )

    async for chunk in stream:
        if len(chunk.choices) > 0:
            delta = chunk.choices[0].delta.content or ""
            if delta and ttft == 0.0:
                ttft = (time.perf_counter() - start_time) * 1000
            response_text_chunks.append(delta)

        # Get usage stats from the final chunk
        if hasattr(chunk, "usage") and chunk.usage is not None:
            usage = chunk.usage

    total_time = (time.perf_counter() - start_time) * 1000
    response_text = "".join(response_text_chunks)

    # Extract usage details
    prompt_tokens = usage.prompt_tokens
    completion_tokens = usage.completion_tokens

    # Check for cached tokens
    cached_tokens = 0
    if hasattr(usage, "prompt_tokens_details") and usage.prompt_tokens_details is not None:
        cached_tokens = getattr(usage.prompt_tokens_details, "cached_tokens", 0)

    # Cost calculation: gpt-4o-mini pricing:
    # Input tokens: $0.150 / 1M tokens ($0.075 / 1M if cached)
    # Output tokens: $0.600 / 1M tokens
    input_cost = ((prompt_tokens - cached_tokens) * 0.15 + cached_tokens * 0.075) / 1_000_000
    output_cost = (completion_tokens * 0.60) / 1_000_000
    total_cost = input_cost + output_cost

    stats = {
        "turn": turn_idx + 1,
        "type": "Baseline",
        "prompt_tokens": prompt_tokens,
        "cached_tokens": cached_tokens,
        "completion_tokens": completion_tokens,
        "ttft_ms": ttft,
        "total_ms": total_time,
        "cost_usd": total_cost,
    }

    return stats, response_text


async def run_turn_optimized(turn_idx: int, history: list[dict], query: str, context: str) -> tuple[dict, str]:
    """Runs a single turn using the Cache Optimized structure (split prompts)."""
    # 1. Build system prompt
    system_prompt = build_system_prompt(context, MOCK_PROFILE, "Explain")
    static_prompt, dynamic_prompt = split_formatted_prompt(system_prompt)

    # 2. Build optimized messages list
    messages = [{"role": "system", "content": static_prompt}]
    for msg in history:
        messages.append({"role": msg["role"], "content": msg["content"]})
    if dynamic_prompt:
        messages.append({"role": "system", "content": dynamic_prompt})
    messages.append({"role": "user", "content": query})

    # 3. Call LLM with streaming to measure TTFT
    start_time = time.perf_counter()
    ttft = 0.0
    total_time = 0.0
    response_text_chunks = []

    stream = await client.chat.completions.create(
        model="gpt-4o-mini", messages=messages, temperature=0.2, stream=True, stream_options={"include_usage": True}
    )

    async for chunk in stream:
        if len(chunk.choices) > 0:
            delta = chunk.choices[0].delta.content or ""
            if delta and ttft == 0.0:
                ttft = (time.perf_counter() - start_time) * 1000
            response_text_chunks.append(delta)

        # Get usage stats from the final chunk
        if hasattr(chunk, "usage") and chunk.usage is not None:
            usage = chunk.usage

    total_time = (time.perf_counter() - start_time) * 1000
    response_text = "".join(response_text_chunks)

    # Extract usage details
    prompt_tokens = usage.prompt_tokens
    completion_tokens = usage.completion_tokens

    # Check for cached tokens
    cached_tokens = 0
    if hasattr(usage, "prompt_tokens_details") and usage.prompt_tokens_details is not None:
        cached_tokens = getattr(usage.prompt_tokens_details, "cached_tokens", 0)

    # Cost calculation: gpt-4o-mini pricing
    input_cost = ((prompt_tokens - cached_tokens) * 0.15 + cached_tokens * 0.075) / 1_000_000
    output_cost = (completion_tokens * 0.60) / 1_000_000
    total_cost = input_cost + output_cost

    stats = {
        "turn": turn_idx + 1,
        "type": "Optimized",
        "prompt_tokens": prompt_tokens,
        "cached_tokens": cached_tokens,
        "completion_tokens": completion_tokens,
        "ttft_ms": ttft,
        "total_ms": total_time,
        "cost_usd": total_cost,
    }

    return stats, response_text


async def main():
    print("=" * 70)
    print("STARTING PROMPT CACHING BENCHMARK (3 turns simulation)")
    print("Model: gpt-4o-mini")
    print("=" * 70)

    # We run baseline first
    baseline_stats = []
    baseline_history = []

    print("\n[1/2] Running BASELINE (Monolithic prompt at top)...")
    for idx, turn in enumerate(CONVERSATION_TURNS):
        print(f"  - Turn {idx + 1}...")
        stats, response = await run_turn_baseline(idx, baseline_history, turn["query"], turn["context"])
        baseline_stats.append(stats)
        baseline_history.append({"role": "user", "content": turn["query"]})
        baseline_history.append({"role": "assistant", "content": response})
        # Wait a bit between turns to avoid hitting rate limits too fast
        await asyncio.sleep(1)

    # Cool down period to allow cache to settle or clear if needed,
    # though OpenAI caches ephemeral queries for ~5-10 mins.
    # Note: For optimized run, we hope to see cache hits immediately on stable parts.
    await asyncio.sleep(3)

    optimized_stats = []
    optimized_history = []

    print("\n[2/2] Running CACHE OPTIMIZED (Split prompt)...")
    for idx, turn in enumerate(CONVERSATION_TURNS):
        print(f"  - Turn {idx + 1}...")
        stats, response = await run_turn_optimized(idx, optimized_history, turn["query"], turn["context"])
        optimized_stats.append(stats)
        optimized_history.append({"role": "user", "content": turn["query"]})
        optimized_history.append({"role": "assistant", "content": response})
        await asyncio.sleep(1)

    print("\n" + "=" * 80)
    print(f"{'COMPARISON TABLE':^80}")
    print("=" * 80)
    print(
        f"{'Turn':<5} | {'Approach':<10} | {'Total In':<9} | {'Cached In':<9} | {'Out Tok':<8} | {'TTFT (ms)':<10} | {'Total (ms)':<11} | {'Cost (USD)':<10}"
    )
    print("-" * 85)

    total_baseline_cost = 0.0
    total_opt_cost = 0.0

    for i in range(len(CONVERSATION_TURNS)):
        b = baseline_stats[i]
        o = optimized_stats[i]
        total_baseline_cost += b["cost_usd"]
        total_opt_cost += o["cost_usd"]

        print(
            f"{b['turn']:<5} | {b['type']:<10} | {b['prompt_tokens']:<9} | {b['cached_tokens']:<9} | {b['completion_tokens']:<8} | {b['ttft_ms']:<10.2f} | {b['total_ms']:<11.2f} | ${b['cost_usd']:<10.7f}"
        )
        print(
            f"{o['turn']:<5} | {o['type']:<10} | {o['prompt_tokens']:<9} | {o['cached_tokens']:<9} | {o['completion_tokens']:<8} | {o['ttft_ms']:<10.2f} | {o['total_ms']:<11.2f} | ${o['cost_usd']:<10.7f}"
        )
        print("-" * 85)

    saving_pct = (1 - total_opt_cost / total_baseline_cost) * 100 if total_baseline_cost > 0 else 0.0
    print(f"Total Baseline Cost: ${total_baseline_cost:.7f}")
    print(f"Total Optimized Cost: ${total_opt_cost:.7f}")
    print(f"Est. Savings in Input/Output Costs: {saving_pct:.2f}%")
    print("=" * 85)


if __name__ == "__main__":
    asyncio.run(main())
