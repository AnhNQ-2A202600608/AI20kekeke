// @ts-nocheck
import * as __fd_glob_20 from "../content/docs/quiz-generation/question-evolution.mdx?collection=docs"
import * as __fd_glob_19 from "../content/docs/quiz-generation/quality-validation.mdx?collection=docs"
import * as __fd_glob_18 from "../content/docs/quiz-generation/knowledge-extraction.mdx?collection=docs"
import * as __fd_glob_17 from "../content/docs/quiz-generation/index.mdx?collection=docs"
import * as __fd_glob_16 from "../content/docs/quiz-generation/adaptive-progression.mdx?collection=docs"
import * as __fd_glob_15 from "../content/docs/algorithms/question-gen.mdx?collection=docs"
import * as __fd_glob_14 from "../content/docs/algorithms/mem-recall.mdx?collection=docs"
import * as __fd_glob_13 from "../content/docs/algorithms/index.mdx?collection=docs"
import * as __fd_glob_12 from "../content/docs/algorithms/graph.mdx?collection=docs"
import * as __fd_glob_11 from "../content/docs/algorithms/evaluation.mdx?collection=docs"
import * as __fd_glob_10 from "../content/docs/algorithms/elo.mdx?collection=docs"
import * as __fd_glob_9 from "../content/docs/algorithms/bkt.mdx?collection=docs"
import * as __fd_glob_8 from "../content/docs/algorithms/bandit.mdx?collection=docs"
import * as __fd_glob_7 from "../content/docs/learning-path.mdx?collection=docs"
import * as __fd_glob_6 from "../content/docs/index.mdx?collection=docs"
import * as __fd_glob_5 from "../content/docs/frontend-runtime.mdx?collection=docs"
import * as __fd_glob_4 from "../content/docs/data-rpc-contracts.mdx?collection=docs"
import * as __fd_glob_3 from "../content/docs/architecture.mdx?collection=docs"
import * as __fd_glob_2 from "../content/docs/ai-tutor-rag.mdx?collection=docs"
import * as __fd_glob_1 from "../content/docs/adaptive-engine.mdx?collection=docs"
import * as __fd_glob_0 from "../content/docs/academic-citations.mdx?collection=docs"
import { server } from 'fumadocs-mdx/runtime/server';
import type * as Config from '../source.config';

const create = server<typeof Config, import("fumadocs-mdx/runtime/types").InternalTypeConfig & {
  DocData: {
  }
}>({"doc":{"passthroughs":["extractedReferences"]}});

export const docs = await create.docs("docs", "content/docs", {}, {"academic-citations.mdx": __fd_glob_0, "adaptive-engine.mdx": __fd_glob_1, "ai-tutor-rag.mdx": __fd_glob_2, "architecture.mdx": __fd_glob_3, "data-rpc-contracts.mdx": __fd_glob_4, "frontend-runtime.mdx": __fd_glob_5, "index.mdx": __fd_glob_6, "learning-path.mdx": __fd_glob_7, "algorithms/bandit.mdx": __fd_glob_8, "algorithms/bkt.mdx": __fd_glob_9, "algorithms/elo.mdx": __fd_glob_10, "algorithms/evaluation.mdx": __fd_glob_11, "algorithms/graph.mdx": __fd_glob_12, "algorithms/index.mdx": __fd_glob_13, "algorithms/mem-recall.mdx": __fd_glob_14, "algorithms/question-gen.mdx": __fd_glob_15, "quiz-generation/adaptive-progression.mdx": __fd_glob_16, "quiz-generation/index.mdx": __fd_glob_17, "quiz-generation/knowledge-extraction.mdx": __fd_glob_18, "quiz-generation/quality-validation.mdx": __fd_glob_19, "quiz-generation/question-evolution.mdx": __fd_glob_20, });