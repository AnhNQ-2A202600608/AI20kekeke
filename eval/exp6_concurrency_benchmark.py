import csv
import logging
import os
import statistics
import time
import uuid
from concurrent.futures import ThreadPoolExecutor, as_completed

import numpy as np

from src.api.adaptive_routes import get_adaptive_db

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("exp6_concurrency_benchmark")


def run_benchmark():
    db = get_adaptive_db()
    if db._stub_mode or db.app_client is None:
        logger.warning("Database client is in STUB MODE. Concurrency benchmark requires a live Supabase database.")
        print("SKIP: Database in STUB MODE")
        return

    logger.info("Initializing test data on database for concurrency benchmark...")

    # 1. Setup test parameters
    concurrency_levels = [5, 10, 20, 50]
    course_id = uuid.uuid4()
    concept_id = uuid.uuid4()
    question_id = uuid.uuid4()
    policy_id = uuid.uuid4()

    # Pre-generate student IDs
    student_ids = [uuid.uuid4() for _ in range(200)]

    try:
        # 2. Insert shared metadata
        db.app_client.table("courses").insert(
            {"id": str(course_id), "code": f"bench-course-{course_id.hex[:6]}", "title": "Concurrency Benchmark Course"}
        ).execute()

        db.app_client.table("concepts").insert(
            {
                "id": str(concept_id),
                "course_id": str(course_id),
                "code": f"bench-concept-{concept_id.hex[:6]}",
                "name": "Concurrency Benchmark Concept",
            }
        ).execute()

        db.app_client.table("questions").insert(
            {
                "id": str(question_id),
                "course_id": str(course_id),
                "concept_id": str(concept_id),
                "type": "mcq",
                "prompt": "Benchmark Hotspot Question Prompt",
                "answer_key": {"options": {"A": "Choice A"}, "correct": "A"},
                "difficulty_elo": 1200.0,
                "calibration_status": "published",
            }
        ).execute()

        db.audit_client.table("adaptive_policies").insert(
            {
                "id": str(policy_id),
                "name": "zpd_selector",
                "version": f"v-{policy_id.hex[:6]}",
                "status": "active",
                "course_id": str(course_id),
            }
        ).execute()

        # Batch insert users to bypass 200 HTTP calls
        logger.info(f"Batch inserting {len(student_ids)} users...")
        users_to_insert = [
            {"id": str(s_id), "email": f"bench-student-{s_id.hex[:8]}@example.com", "full_name": "Benchmark Student"}
            for s_id in student_ids
        ]
        db.app_client.table("users").insert(users_to_insert).execute()

        results_data = []

        # 3. Iterate through concurrency levels
        for n in concurrency_levels:
            logger.info(f"--- Running benchmark with Concurrency Level: {n} ---")

            # A. SYNC BENCHMARK (submit_attempt_v2 - locking)
            sync_latencies = []
            sync_decisions = [uuid.uuid4() for _ in range(n)]

            # Batch insert decisions for sync
            sync_decisions_to_insert = [
                {
                    "id": str(sync_decisions[idx]),
                    "policy_id": str(policy_id),
                    "student_id": str(student_ids[idx]),
                    "course_id": str(course_id),
                    "concept_id": str(concept_id),
                    "selected_action_id": str(question_id),
                    "expected_success": 0.5,
                    "context_snapshot": [1.0, 0.25, 0.5],
                }
                for idx in range(n)
            ]
            db.audit_client.table("adaptive_decisions").insert(sync_decisions_to_insert).execute()

            def run_sync_thread(thread_idx):
                payload = {
                    "p_decision_id": str(sync_decisions[thread_idx]),
                    "p_student_id": str(student_ids[thread_idx]),
                    "p_course_id": str(course_id),
                    "p_concept_id": str(concept_id),
                    "p_question_id": str(question_id),
                    "p_student_answer": {"selected_option": "A"},
                    "p_actual_score": 1.0,
                    "p_hint_count": 0,
                    "p_used_ai_help": False,
                    "p_context": [1.0, 0.25, 0.5],
                    "p_reward": 1.0,
                    "p_k_question": 32.0,
                }
                t_start = time.perf_counter()
                try:
                    db.submit_attempt_v2(payload)
                    t_end = time.perf_counter()
                    return t_end - t_start, True
                except Exception as e:
                    t_end = time.perf_counter()
                    logger.error(f"Sync thread {thread_idx} failed: {e}")
                    return t_end - t_start, False

            # Run concurrent Sync threads
            t_sync_start = time.perf_counter()
            with ThreadPoolExecutor(max_workers=n) as executor:
                futures = [executor.submit(run_sync_thread, i) for i in range(n)]
                for fut in as_completed(futures):
                    duration, success = fut.result()
                    if success:
                        sync_latencies.append(duration * 1000.0)  # ms
            t_sync_end = time.perf_counter()
            sync_total_duration = t_sync_end - t_sync_start
            sync_throughput = len(sync_latencies) / sync_total_duration if sync_total_duration > 0 else 0.0

            # B. ASYNC BENCHMARK (submit_attempt_v3 - lock-free outbox)
            async_latencies = []
            async_decisions = [uuid.uuid4() for _ in range(n)]

            # Batch insert decisions for async
            async_decisions_to_insert = [
                {
                    "id": str(async_decisions[idx]),
                    "policy_id": str(policy_id),
                    "student_id": str(student_ids[n + idx]),  # use second half of student pool
                    "course_id": str(course_id),
                    "concept_id": str(concept_id),
                    "selected_action_id": str(question_id),
                    "expected_success": 0.5,
                    "context_snapshot": [1.0, 0.25, 0.5],
                }
                for idx in range(n)
            ]
            db.audit_client.table("adaptive_decisions").insert(async_decisions_to_insert).execute()

            def run_async_thread(thread_idx):
                payload = {
                    "p_decision_id": str(async_decisions[thread_idx]),
                    "p_student_id": str(student_ids[n + thread_idx]),
                    "p_course_id": str(course_id),
                    "p_concept_id": str(concept_id),
                    "p_question_id": str(question_id),
                    "p_student_answer": {"selected_option": "A"},
                    "p_actual_score": 1.0,
                    "p_hint_count": 0,
                    "p_used_ai_help": False,
                    "p_context": [1.0, 0.25, 0.5],
                    "p_reward": 1.0,
                    "p_k_question": 32.0,
                    "p_response_time_ms": 30000,
                }
                t_start = time.perf_counter()
                try:
                    db.submit_attempt_v3(payload)
                    t_end = time.perf_counter()
                    return t_end - t_start, True
                except Exception as e:
                    t_end = time.perf_counter()
                    logger.error(f"Async thread {thread_idx} failed: {e}")
                    return t_end - t_start, False

            # Run concurrent Async threads
            t_async_start = time.perf_counter()
            with ThreadPoolExecutor(max_workers=n) as executor:
                futures = [executor.submit(run_async_thread, i) for i in range(n)]
                for fut in as_completed(futures):
                    duration, success = fut.result()
                    if success:
                        async_latencies.append(duration * 1000.0)  # ms
            t_async_end = time.perf_counter()
            async_total_duration = t_async_end - t_async_start
            async_throughput = len(async_latencies) / async_total_duration if async_total_duration > 0 else 0.0

            # Calculate percentiles
            p50_sync = statistics.median(sync_latencies) if sync_latencies else 0.0
            p95_sync = np.percentile(sync_latencies, 95) if sync_latencies else 0.0
            p99_sync = np.percentile(sync_latencies, 99) if sync_latencies else 0.0

            p50_async = statistics.median(async_latencies) if async_latencies else 0.0
            p95_async = np.percentile(async_latencies, 95) if async_latencies else 0.0
            p99_async = np.percentile(async_latencies, 99) if async_latencies else 0.0

            logger.info(
                f"Sync (FOR UPDATE) - Throughput: {sync_throughput:.2f} att/sec, P50: {p50_sync:.1f}ms, P95: {p95_sync:.1f}ms, P99: {p99_sync:.1f}ms"
            )
            logger.info(
                f"Async (Outbox)     - Throughput: {async_throughput:.2f} att/sec, P50: {p50_async:.1f}ms, P95: {p95_async:.1f}ms, P99: {p99_async:.1f}ms"
            )

            results_data.append(
                {
                    "Concurrency": n,
                    "Sync_Throughput": sync_throughput,
                    "Sync_P50": p50_sync,
                    "Sync_P95": p95_sync,
                    "Sync_P99": p99_sync,
                    "Async_Throughput": async_throughput,
                    "Async_P50": p50_async,
                    "Async_P95": p95_async,
                    "Async_P99": p99_async,
                }
            )

        # Save to CSV
        os.makedirs("eval/results", exist_ok=True)
        csv_path = "eval/results/exp6_concurrency_benchmark.csv"
        with open(csv_path, "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(
                f,
                fieldnames=[
                    "Concurrency",
                    "Sync_Throughput",
                    "Sync_P50",
                    "Sync_P95",
                    "Sync_P99",
                    "Async_Throughput",
                    "Async_P50",
                    "Async_P95",
                    "Async_P99",
                ],
            )
            writer.writeheader()
            writer.writerows(results_data)
        logger.info(f"Concurrency benchmark results successfully written to: {csv_path}")
        return results_data

    finally:
        logger.info("Cleaning up test data from database...")
        # Clean up database records in batch queries
        try:
            db.app_client.table("quiz_attempts").delete().eq("course_id", str(course_id)).execute()
            db.audit_client.table("adaptive_rewards").delete().eq("target_success", 0.7500).execute()
            db.audit_client.table("mastery_events").delete().eq("course_id", str(course_id)).execute()
            db.audit_client.table("adaptive_decisions").delete().eq("course_id", str(course_id)).execute()
            db.audit_client.table("adaptive_policies").delete().eq("id", str(policy_id)).execute()
            db.app_client.table("questions").delete().eq("id", str(question_id)).execute()
            db.app_client.table("student_concept_mastery").delete().eq("course_id", str(course_id)).execute()
            db.app_client.table("concepts").delete().eq("id", str(concept_id)).execute()
            db.app_client.table("courses").delete().eq("id", str(course_id)).execute()
            db.app_client.table("users").delete().in_("id", [str(s_id) for s_id in student_ids]).execute()
        except Exception as e:
            logger.error(f"Database cleanup failed: {e}")


if __name__ == "__main__":
    run_benchmark()
