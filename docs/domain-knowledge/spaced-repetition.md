# Spaced Repetition

## Overview

Spaced repetition schedules review based on memory strength and recent performance. In this project, it supports active recall through typed answers, AI-assisted grading, and mastery updates.

## Core Idea

Students should answer flashcards by typing a short response. The system then grades the answer and schedules the next review. This avoids passive self-rating and encourages active recall.

## Review Flow

1. Lecturer uploads or approves course material.
2. AI Microservice extracts concepts and generates flashcards.
3. Core Backend stores flashcards and links them to course concepts.
4. Student requests today's review.
5. Core Backend returns due flashcards.
6. Student types an answer.
7. Backend grades deterministically when possible.
8. AI Microservice grades semantic answers when needed.
9. Backend updates repetition state, mastery, and next due date.
10. Student receives score and Socratic feedback.

## SM-2 Inspired Fields

| Field | Purpose |
| --- | --- |
| repetitions | Number of successful reviews in a row. |
| interval | Days until next review. |
| easeFactor | Multiplier representing recall ease. |
| dueDate | Next scheduled review date. |
| lastScore | Latest normalized grade. |

## AI Grading

AI grading should return bounded structured data:

```json
{
  "score": 0,
  "feedback": "Short Socratic feedback"
}
```

Score should map to a `0-5` scale for SM-2-style scheduling. Backend must validate the shape and range before using it.

## Latency and Cost Controls

- Use deterministic exact/keyword matching before calling the LLM.
- Call AI only when semantic judgment is needed.
- Use fast, cost-effective models for short grading tasks.
- Show clear loading state when AI grading is running.

## Guardrails

- Feedback should guide recall and correction, not reveal unrelated assignment answers.
- Flashcards should be generated from official course material.
- Store source references where possible for auditability.
