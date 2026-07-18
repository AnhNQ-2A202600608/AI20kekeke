Graphusion: A RAG Framework for Scientific Knowledge Graph
Construction with a Global Perspective

Rui Yang
Duke-NUS Medical School
Singapore, Singapore
yang_rui@u.nus.edu

Fan Gao
The University of Tokyo
Tokyo, Japan
fangao0802@gmail.com

Moritz Blum
Bielefeld University
Bielefeld, Germany
mblum@techfak.uni-bielefeld.de

Freddy Lecue
Inria
Paris, France
freddy.lecue@inria.fr

Boming Yang
The University of Tokyo
Tokyo, Japan
boming@g.ecc.u-tokyo.ac.jp

Aosong Feng
Yale University
New Haven, United States
aosong.feng@yale.edu

Tianwei She
Smartor Inc.
Tokyo, Japan
tianwei.v.she@gmail.com

Jinghui Lu
Smartor Inc.
Tokyo, Japan
liuxiangtian213@gmail.com

Xinjie Zhao
The University of Tokyo
Tokyo, Japan
xinjie-zhao@g.ecc.u-tokyo.ac.jp

Sixun Ouyang
Smartor Inc.
Tokyo, Japan
troy.oysx@gmail.com

Yuang Jiang
Smartor Inc.
Tokyo, Japan
jiangyuang1995@gmail.com

Irene Li
University of Tokyo
Tokyo, Japan
ireneli@ds.itc.u-tokyo.ac.jp

Abstract
Knowledge Graphs (KGs) are crucial in the field of artificial intelli-gence and are widely used in downstream tasks, such as question-answering (QA). The construction of KGs typically requires signifi-cant effort from domain experts. Large Language Models (LLMs) have recently been used for Knowledge Graph Construction (KGC). However, most existing approaches focus on a local perspective, extracting knowledge triplets from individual sentences or doc-uments, missing a fusion process to combine the knowledge in a global KG. This work introduces Graphusion, a zero-shot KGC framework from free text. It contains three steps: in Step 1, we ex-tract a list of seed entities using topic modeling to guide the final KG includes the most relevant entities; in Step 2, we conduct candidate triplet extraction using LLMs; in Step 3, we design the novel fusion module that provides a global view of the extracted knowledge, incorporating entity merging, conflict resolution, and novel triplet discovery. Results show that Graphusion achieves scores of 2.92 and 2.37 out of 3 for entity extraction and relation recognition, respec-tively. Moreover, we showcase how Graphusion could be applied to the Natural Language Processing (NLP) domain and validate it in an educational scenario. Specifically, we introduce TutorQA, a new expert-verified benchmark for QA, comprising six tasks and a total of 1,200 QA pairs. Using the Graphusion-constructed KG, we achieve a significant improvement on the benchmark, for example, a 9.2% accuracy improvement on sub-graph completion.

CC
BY
This work is licensed under a Creative Commons Attribution 4.0 International License.
WWW Companion '25, Sydney, NSW, Australia
© 2025 Copyright held by the owner/author(s).
ACM ISBN 979-8-4007-1331-6/2025/04
https://doi.org/10.1145/3701716.3717821

CCS Concepts
• Information systems → Language models; Extraction, trans-formation and loading; Database utilities and tools.

Keywords
Retrieval Augmented Generation, Knowledge Graphs, Question-Answering

ACM Reference Format:
Rui Yang, Boming Yang, Xinjie Zhao, Fan Gao, Aosong Feng, Sixun Ouyang,
Moritz Blum, Tianwei She, Yuang Jiang, Freddy Lecue, Jinghui Lu, and Irene
Li. 2025. Graphusion: A RAG Framework for Scientific Knowledge Graph
Construction with a Global Perspective. In Companion Proceedings of the
ACM Web Conference 2025 (WWW Companion '25), April 28-May 2, 2025,
Sydney, NSW, Australia. ACM, New York, NY, USA, 10 pages. https://doi.
org/10.1145/3701716.3717821

1 Introduction
Retrieval-Augmented Generation (RAG) [19] combines the advan-tages of retrieval methods and generative models, which improves the accuracy and relevance of generated content [39]. For instance, given a free-text corpus and a query involving two related enti-ties, RAG can retrieve relevant information and infer their relation. Therefore, RAG can be used to enhance the performance of vari-ous knowledge-intensive tasks [9, 38, 41]. However, the need for more structured and comprehensive knowledge integration has highlighted the importance of adopting Knowledge Graphs (KGs). KGs provide structured and interconnected representations of in-formation, offering richer context and reasoning capabilities that further enhance retrieval-augmented methods in complex appli-cations. [5, 21, 30] Especially in the scientific domain, KGs play a crucial role when precise extraction and modeling of entities and

WWW Companion '25, April 28-May 2, 2025, Sydney, NSW, Australia
![](Graphusion_0002.jpg)
Figure 1: Comparison of Zero-shot LLM, RAG framework, and our Graphusion framework on applying LLMs for KGC.

their relations are required. The accurate selection of entities with appropriate granularity, along with precise modeling of their re-lations, is key to capturing the complex structure and semantics inherent in scientific knowledge [15, 20].
Existing knowledge graph construction (KGC) methods predom-inantly adopt a localized perspective [4, 6, 34], focusing on extract-ing triplets at the sentence or paragraph level. While this approach works well for shallow knowledge-such as (people, belong_to, organization)-it falls short in scientific domains, where a global view is essential for identifying complex, multi-layered relations be-tween entities. Localized methods often fail to capture the compre-hensive and interconnected nature of knowledge, leading to limited accuracy and completeness when triplets are derived from isolated text segments, which is particularly crucial for scientific KGs. The recent success of GraphRAG [8] highlights the value of leveraging a global KG for query-based summarization with the help of large language models (LLMs) [1]. However, despite offering enhanced contextual understanding, building and maintaining large-scale graph structures with hierarchical clustering significantly increases computational cost and complexity compared to simpler retrieval methods, limiting its application in resource-constrained environ-ments or real-time systems requiring low-latency responses. More-over, its effectiveness in scientific KGC, particularly when high entity granularity is required, remains unclear.
We illustrate the necessity of balancing the performance-efficiency trade-off in building the large-scale KG tailored to a user prompt in Fig. 1. A user poses a specific question from the NLP domain, requiring a learning path from the entity word distributions to the entity reading comprehension. Ideally, the model should understand the relations between these entities and effectively map out the learning path. Zero-shot LLMs might provide somewhat relevant answers but tend to be too general, as shown in the fig-ure, offering broad entities like Basic NLP Foundations or intro-ducing confusing, inaccurately specific entities (e.g., Corpora and Datasets). While some RAG-based methods for building KGs focus
Rui Yang et al.
primarily on relation extraction from limited sources via retrieval, this often results in numerous disconnected KGs or sub-graphs, we marked this method as Local Graph-RAG. We argue that a global understanding of domain knowledge is crucial and may be chal-lenging for typical existing RAG frameworks. For instance, deter-mining the relation between hierarchical attention network and reading comprehension may be difficult, as these entities might not appear within the same document. The model needs to extract and synthesize information from two (or more) documents to recognize that the relation is Used_for. GraphRAG addresses this challenge hierarchically by linking entities to gather informa-tion on a global scale. However, despite the method's high cost, it remains unclear how relation conflicts are managed. Moreover, we observe that some entities, such as models, may be overly broad and therefore not useful for users.
Recognizing these limitations, we propose a cost-efficient KGC approach to incorporate the global perspective and improve RAG performance on downstream question-answering (QA) tasks. Fig. 1 illustrates the differences between zero-shot LLMs and Local Graph-RAG, GraphRAG and our model. While Local Graph-RAG primarily focuses on knowledge extraction from a disconnected point of view, GraphRAG is able to summarize the information from a global view. However, our approach, Graphusion, incorporates a knowledge fu-sion step to integrate local knowledge into a global context directly. The core fusion step performs global merging and resolution across multiple local sub-graphs to form one large connected KG. Speci-fically, we leverage LLMs not only for extraction but also for critical knowledge integration, marking the first initiative to utilize LLMs for such a comprehensive merging process. Moreover, we generate a seed entity list to guide the entity extraction with better granular-ity. We demonstrate Graphusion's capability in knowledge graph construction and link prediction. Our results show that Graphusion achieves scores of 2.92 and 2.37 out of 3 for entity extraction and relation recognition, respectively. Furthermore, we show that a simplified link prediction prompt outperforms supervised learning baselines, achieving a 3% higher F1 score. Then, to further show the power of the constructed KG, we showcase how it could be applied to the NLP domain, and most importantly, we validate it in an educational scenario with complex QA tasks. 1

2 Related Work
Knowledge Graph Construction KGC aims to create a struc-tured representation of knowledge in the form of a KG. A KG can be created from various sources, such as databases or texts. In our work, we focus on KGC from natural language resources. Re-search on KGs spans various domains, including medical, legal, and more [2, 16, 18, 22, 35]. Typically, KGC from text involves several methods such as entity extraction and link prediction [27, 32], with a significant focus on supervised learning. Recently, LLMs have been utilized in KGC relying on their powerful zero-shot capabili-ties [6, 24, 42, 44]. Although relevant works propose pipelines for extracting knowledge, they often remain limited to localized views, such as extracting triplets from the sentence or paragraph level. In contrast, our work focuses on shifting from a local perspective to
1https://github.com/IreneZihuiLi/Graphusion

WWW Companion '25, April 28-May 2, 2025, Sydney, NSW, Australia
![](Graphusion_0003.jpg)
Figure 2: Graphusion framework illustration. Graphusion consists of 3 steps: S1 Seed Entity Generation, S2 Candidate Triplet Extraction and S3 Knowledge Graph Fusion.

a global one, aiming to generate a more comprehensive KG. Ap-proaches such as GraphRAG [8] which uses graph indexing and community detection to generate query-focused summaries, effec-tively answer global questions. However, GraphRAG focuses less on the detailed steps of graph construction, such as entity resolu-tion and relation inference. In contrast, this work places greater emphasis on the process of global KGC, including entity merging, conflict resolution, and novel triplet discovery, thereby achieving a more comprehensive and consistent knowledge representation.
Educational Question Answering This work also falls within the scope of applications for educational question answering. Mod-ern NLP and Artificial Intelligence (AI) techniques have been ap-plied to a wide range of applications, with education being a signifi-cant area. For instance, various tools have been developed focusing on writing assistance, language study, automatic grading, and quiz generation [10, 26, 33, 40, 43]. Moreover, in educational scenarios, providing responses to students still requires considerable effort, as the questions often demand a high degree of relevance to the study materials and strong domain knowledge. Consequently, many stud-ies have concentrated on developing automatic QA models [13, 45], which tackle a range of queries, from logistical to knowledge-based questions. In this work, we integrate a free-text constructed KG for various QA tasks in NLP education.

3 Graphusion: Zero-shot Knowledge Graph Construction
We now introduce our Graphusion framework for constructing scientific KGs, shown in Fig. 2. Our approach addresses three key challenges in zero-shot KGC: 1) the input consists of free text rather than a predefined list of entities; 2) the relations encompass multiple types, and conflicts may exist among them; and 3) the output is not a single binary label but a list of triplets, making evaluation more challenging.
Problem Definition A KG is defined as a set of triplets KG = {(hi, ri, ti) | hi, ti ∈ E, ri ∈ R, i = 1,2,..., n}, where E is the set of entities, R is the set of possible relations, and n is the total number of triplets in the KG. The task of zero-shot KGC involves
taking a set of free text T and generating a list of triplets (h, r, t) spanning a KG. Optionally, there is an expert-annotated KG, GE, as input, in order to provide existing knowledge. In our setting, the number of triplets of KG is much larger than GE. We select the domain to be NLP, so the entities are limited to NLP entities, with other entity types such as people, and organizations not be-ing our focus. Referring to previous works [27], we define 7 rela-tions types: Prerequisite_of, Used_for, Compare, Conjunction, Hyponym_of, Evaluate_for and Part_of. We will now describe the three steps of the pipeline in detail.

3.1 Step 1: Seed Entity Generation
Extracting domain-specific entities using LLMs under a zero-shot setting is highly challenging due to the absence of predefined entity lists. This process is not only resource-intensive but also tends to generate a large number of irrelevant entities, or entities with a bad granularity, thereby compromising the quality of extraction. To address these issues, we adopt a seed entity generation approach for efficiently extracting in-domain entities from free text [17]. Specifically, we utilize BERTopic [11] for topic modeling to identify representative entities for each topic. These representative entities serve as seed entities, denoted as Q. The initialized seed entities ensure high relevance in entity extraction and provide certain pre-cision for subsequent triplet extraction.

3.2 Step 2: Candidate Triplet Extraction
These seed entities obtained from Step 1 would guide us to conduct entity extraction. In Step 2, we begin extracting candidate triplets from the free text. Each time, we input an entity q ∈ Q ({query}) as the query entity and retrieve documents containing this entity ({context}) through information retrieval. Our goal is to extract any potential triplet that includes this query entity. To achieve this, we design a Chain-of-Thought (CoT) [36] prompt. We first instruct the LLMs to extract in-domain entities, and then identify the possible relations between those entities and q. Then, we ask LLMs to discover novel triplets, even if q is not initially included. This approach ensures that the seed entities play a leading role

WWW Companion '25, April 28-May 2, 2025, Sydney, NSW, Australia
in guiding the extraction of in-domain entities. Meanwhile, the candidate triplets will encompass novel entities. We design the Extraction Prompt to be the following:

Given a context { context} and a query
entity {query}, do the following:

1. Extract the query entity and
in-domain entities from the context,
which should be fine-grained...
2. Determine the relations between
the query entity and the extracted
entities, in a triplet format:
(<head entity>, <relation>, <tail entity
>)...
{Relation Definition}
3. Please note some relations are
strictly directional...
4. You can also extract triplets from
the extracted entities, and the
query entity may not be necessary
in the triplets.

After processing all the queries from the seed entity list, we save all the candidate triplets. We denote this zero-shot constructed KG by the LLM as ZS – KG.

3.3 Step 3: Knowledge Graph Fusion
The triplets extracted in the previous step provide a local view rather than a global perspective of each query entity. Due to the limitations of context length, achieving a global view is challenging. Addition-ally, the relations extracted between two entities can be conflicting, diverse, or incorrect, such as (neural summarization methods, Used-for, abstractive summarization) and (neural summarization methods, Hyponym-of, abstractive summarization). To ad-dress the aforementioned challenge, we propose the fusion step. This approach helps reconcile conflicting relations, integrate di-verse or incorrect relations effectively, and ultimately provides a global understanding of an entity pair. Specifically, for each query entity q, we first query from ZS – KG, and obtain a sub-graph that contains q:

LLM-KG = {(h, r,t) ∈ ZS-KG | h = q or t = q}.

Optionally, if there is an expert-annotated KG GE available, we will also query a sub-graph, marked as & – G. Moreover, we conduct a dynamic retrieval of q again from the free text ({background}), to help LLMs to have a better understanding on how to resolve the conflicted triplets. This key fusion step focuses on three parts: 1) entity merging: merge semantically similar entities, i.e., NMT vs neural machine translation; 2) conflict resolution: for each en-tity pair, resolve any conflicts and choose the best one; and 3) novel triplet inference: propose new triplet from the background text. We utilize the following Fusion Prompt:

Please fuse two sub-knowledge graphs
about the entity: {entity}.

Rui Yang et al.
Graph 1: {LLM-KG}
Graph 2: {E-G}
Rules for Fusing the Graphs:
1. Union the entities and edges.
2. If two entities are similar, or
refer to the same entity, merge
them into one entity, keeping the
one that is meaningful or specific.
3. Only one relation is allowed between
two entities. If a conflict exists,
read the ### Background to help
you keep the correct relation...
4. Once step 3 is done, consider every
possible entity pair not covered in
step 2. For example, take an entity
from Graph 1, and match it with a
entity from Graph 2. Then, please
refer to ### Background to summarize
new triplets.

### Background:
{background}
{Relation Definition}

4 Experiments on Knowledge Graph Construction
In these experiments, we investigated the general capabilities of Graphusion for KGC.
Dataset To conduct scientific KGC, we need a large-scale free-text corpus to serve as the knowledge source. We collect the proceed-ings papers from the ACL conference2 spanning 2017-2023, which includes a total of 4,605 valid papers. Considering that abstracts provide high-density, noise-free information and save computa-tional resources, we perform topic modeling and KGC on the paper abstracts.
Implementation We implement Graphusion on top of four settings with different LLMs: LLaMa3-70b3, GPT-3.5, GPT-4 and GPT-40. Additionally, we compare with multiple baselines, includ-ing zero-shot (GPT-40 zs) and RAG (GPT-40 RAG). We query what is the relation of a node pair as the prompt, and the zero-shot setting answers directly, while the RAG one answers with retrieved results from the same data with Graphusion.
Baseline We compare with a local graph model (GPT-40 Local), which equals to the Graphusion model without the fusion step (Step 3). Note that it is challenging to evaluate the entity quality, as a simple prompt will generate out-of-domain nodes, so we fo-cus on comparing the relation quality. We also compare with the GraphRAG framework. Like Graphusion, we first tune the prompt with zero-shot and CoT settings for GraphRAG' entity/relation ex-traction. We define the relation types within the prompt. We also utilize GraphRAG's prompt auto-tuning ability to create commu-nity reports to adapt the generated knowledge graph to the NLP
2https://aclanthology.org/venues/acl/
3https://llama.meta.com/llama3/

WWW Companion '25, April 28-May 2, 2025, Sydney, NSW, Australia
domain. The full manual promo tuning can be found in the Appen-dix. We then feed the collected abstracts into GraphRAG to build the indexing pipelines. Specifically, we employ GPT-40 as the base LLM. In the query phase, we ask GraphRAG the relation between the given entity pairs.
Evaluation Metrics The automatic evaluation of our scientific KGC approach is challenging, due to the lack of ground truth graphs matching our setting. Therefore, we conduct a human evaluation of the constructed KG. For each model, we randomly sample 100 triplets and ask experts to assess both entity quality and relation quality, providing ratings on a scale from 1 (bad) to 3 (good). Entity quality measures the relevance and specificity of the extracted entities, while relation quality evaluates the logical accuracy of the relation between entities. We provide the annotators with the following guidelines:
1. Entity Quality Excellent (3 points): Both entities are highly relevant and specific to the domain. At an appropriate level of detail, neither too broad nor too specific. For example, an entity could be introduced by a lecture slide page, or a whole lecture, or possibly have a Wikipedia page. Acceptable (2 points): Entity is somewhat relevant, or granularity is acceptable. Poor (1 point): Entity is at an inappropriate level of detail, too broad or too specific.
2. Relation Quality Correct (3 points): The relation logically and accurately describes the relation between the head and tail entities. Somewhat Correct (2 points): The relation is acceptable but has minor inaccuracies or there might be another better or correct answer. Incorrect (1 point): The relation does not logically describe the relation between the entities.
Additionally, we calculate the Inter-Annotator Agreement (IAA) between the two experts using the Kappa score.
Results Tab. 1 shows the ratings and the experts' consistency scores. Overall, the rating for entity surpasses relation, demonstrat-ing the challenge of relation extraction. Among all the methods tested, Graphusion with GPT-40 achieves the highest performance in both entity and relation ratings. Notably, when the fusion step is omitted, performance drops significantly from 2.37 to 2.08, demon-strating the crucial role of the fusion step in enhancing relation quality within Graphusion. Notably, the performance of GraphRAG is suboptimal, partly due to modifications we made to better align it with our evaluation. Furthermore, our observations indicate that it often defaults to predicting a single relation type when uncertain (e.g., 40 Part_Of relations out of 100 cases). Additionally, the high consistency score among the experts indicates the reliability of the expert evaluation.
Case Study: Fusion In Fig 3, we present case studies from our Graphusion framework using GPT-40. Our fusion step merges sim-ilar entities (neural MT and neural machine translation) and also resolves relational conflicts (Prerequisite_of and Hyponym_of). Additionally, it can infer novel triplets absent from the input. We highlight both positive and negative outputs. For instance, it cor-rectly identifies the use of a technique for a task (hierarchical attention network, Used_for, reading comprehension). However, it may output less accurate triplets in entity recognition, such as entities with poor granularity (annotated data, model generated summary) and identifying very far relations (word embedding being categorized as part of computer science).

Rui Yang et al.
Table 1: Rating for the quality of entity and relation, and IAA score for the expert evaluation.

| Model | Entity Rating | Entity Kappa | Relation Rating | Relation Kappa |
|---|---|---|---|---|
| GPT-40 zs | 2.28±0.88 | 0.68 | 1.82±0.81 | 0.51 |
| GPT-40 RAG | 2.28±0.87 | 0.66 | 2.09±0.70 | 0.56 |
| GPT-40 Local | 2.08±0.86 | 0.59 | 2.09±0.70 | 0.56 |
| GraphRAG | 2.09±0.70 | 0.56 | 2.09±0.70 | 0.56 |
| Graphusion |
| LLAMA | 2.83±0.47 | 0.63 | 1.85±0.76 | 0.49 |
| GPT-3.5 | 2.90±0.38 | 0.68 | 2.14±0.83 | 0.67 |
| GPT-4 | 2.84±0.50 | 0.68 | 2.36±0.81 | 0.65 |
| GPT-40 | 2.92±0.32 | 0.65 | 2.37±0.82 | 0.67 |

Figure 3: Case studies for Graphusion on the GPT-40 model: Correct parts are highlighted in green, resolved and merged parts in orange, and less accurate parts in purple.
![](Graphusion_0005.jpg)

5 Experiments on Link Prediction
While the task of KGC is to generate a list of triplets, including entities and their corresponding relations, we also evaluate a sub-task: focusing solely on Link Prediction (LP) for pre-defined entity pairs and a single relation type,r =Prerequisite_of. Specifically, given an entity pair (A, B), the task is to determine if a relation r exists between two given entities. For instance, to learn the entity of POS Tagging, one must first understand the Viterbi Algorithm. Initially, a predefined set of entities C is given.
We then design an LP Prompt to solve the task. The core part is to provide the domain name, the definition and description of the dependency relation to be predicted, and the query entities. Meanwhile, we explore whether additional information, such as entity definitions from Wikipedia and neighboring entities from

WWW Companion '25, April 28-May 2, 2025, Sydney, NSW, Australia
Table 2: Link prediction results across all domains on the LectureBankCD test set: We present accuracy (Acc) and F1 scores. Bolded figures indicate the best performance in the zero-shot setting, while underlined scores represent the highest achievements in the supervised setting. We apply LLaMA2-70b for all for this task.

| Method | NLP Acc | NLP F1 | CV Acc | CV F1 | BIO Acc | BIO F1 | Overall Acc | Overall F1 |
|---|---|---|---|---|---|---|---|---|
| Supervised Baselines | | | | | | | | |
| P2V [3] | 0.6369 | 0.5961 | 0.7642 | 0.7570 | 0.7200 | 0.7367 | 0.7070 | 0.6966 |
| BERT [7] | 0.7088 | 0.6963 | 0.7572 | 0.7495 | 0.7067 | 0.7189 | 0.7242 | 0.7216 |
| DeepWalk [31] | 0.6292 | 0.5860 | 0.7988 | 0.7910 | 0.7911 | 0.8079 | 0.7397 | 0.7283 |
| Node2vec [12] | 0.6209 | 0.6181 | 0.8197 | 0.8172 | 0.7956 | 0.8060 | 0.7454 | 0.7471 |
| Zero-shot (zs) | | | | | | | | |
| LLAMA | 0.6058 | 0.6937 | 0.6092 | 0.6989 | 0.6261 | 0.6957 | 0.6137 | 0.6961 |
| GPT-3.5 | 0.6123 | 0.7139 | 0.6667 | 0.7271 | 0.6696 | 0.6801 | 0.6495 | 0.7070 |
| GPT-4 | 0.7639 | 0.7946 | 0.7391 | 0.7629 | 0.7348 | 0.7737 | 0.7459 | 0.7771 |
| Zero-shot + RAG | | | | | | | | |
| GPT-3.5 | 0.7587 | 0.7793 | 0.6828 | 0.7123 | 0.6870 | 0.7006 | 0.7095 | 0.7307 |
| GPT-4 | 0.7755 | 0.7958 | 0.7230 | 0.7441 | 0.7174 | 0.7200 | 0.7386 | 0.7533 |

Rui Yang et al.
Table 3: Comparison with other similar benchmarks: Educational or general QA benchmarks.

| Dataset | Domain | Answer Type | With KG | Collection |
|---|---|---|---|---|
| CBT [14] | Open-Domain | Multiple Choice | No | Automated |
| LectureBankCD [20] | NLP, CV, BIO | Binary | Yes | Expert-verified |
| FairytaleQA [37] | Open-Domain | Open-ended | No | Expert-verified |
| ChaTa [13] | CS | Open-ended | No | Students |
| ExpertQA [28] | Science | Open-ended | No | Expert-verified |
| SyllabusQA [29] | Multiple | Open-ended | No | Course syllabi |
| TutorQA (this work) | NLP | Open-ended, Entity List, Binary | Yes | Expert-verified |

training data (when available), would be beneficial. We provide detailed prompts in the Appendix.
We conduct a comprehensive evaluation on a scientific bench-mark, LectureBankCD [23], which contains entity pairs and the prerequisite labels among three domains: NLP, computer vision (CV), and bioinformatics (BIO). There are 1551, 871 and 234 entity pairs, respectively. We follow the same setting and training/testing split provided by the authors [23] and report the accuracy and F1 score, shown in Tab. 2. We compare supervised baselines, zero-shot link prediction, and zero-shot approaches using RAG models. Specifically, the RAG data predominantly consists of NLP-related content, which explains the lack of noticeable improvement in the CV and BIO domains when using RAG. Overall, the LLM method outperforms traditional supervised baselines, suggesting that LLMs have the potential to achieve higher quality in knowledge graph construction, particularly in relation prediction.

6 TutorQA: A Scientific Knowledge Graph QA Benchmark
We aim to evaluate the practical usefulness of the Graphusion-constructed KG from an educational perspective. In NLP classes, stu-dents often have specific questions that require answers grounded in NLP domain knowledge, rather than general or logistical queries
related to the course. To address this need, we introduce the Tu-torQA benchmark, a QA dataset designed for scientific KG QA.
TutorQA consists of six categories, encompassing a total of 1,200 QA pairs that have been validated by human experts, simulating questions typically encountered in classes. These questions extend beyond simple syllabus inquiries, covering more complex and chal-lenging topics that require KG reasoning, along with proficiency in text comprehension and question answering. We list some similar benchmarks in Tab 3. While numerous open-domain QA bench-marks exist, our focus has been primarily on those within the scientific domain and tailored for college-level education, aligning with our objective to compare with benchmarks that can emulate a learning scenario. Among those, TutorQA is distinguished by its diversity in answer types and features expert-verified questions, ensuring a high standard of quality and relevance.
TutorQA Tasks We design different difficulty levels of the ques-tions and divide them into 6 tasks. We summarize the tasks and provide example data in Fig 4. More data statistics and information can be found in the supplementary materials.
Task 1: Relation Judgment The task is to assess whether a given triplet, which connects two entities with a relation, is accurate.
Task 2: Prerequisite Prediction The task helps students by mapping out the key entities they need to learn first to understand a complex target topic.

WWW Companion '25, April 28-May 2, 2025, Sydney, NSW, Australia
![](Graphusion_0007.jpg)
Figure 4: TutorQA tasks: We present a sample data instance and the corresponding evaluation metric for each task. Note: Task 6 involves open-ended answers, which are evaluated through human assessment.

Task 3: Path Searching This task helps students identify a se-quence of intermediary entities needed to understand a new target entity by charting a path from the graph.
Task 4: Sub-graph Completion The task involves expanding the KG by identifying hidden associations between entities in a sub-graph.
Task 5: Similar Entities The task requires identifying entities linked to a central idea to deepen understanding and enhance learn-ing, aiding in the creation of interconnected curriculums.
Task 6: Idea Hamster The task prompts participants to develop project proposals by applying learned entities to real-world con-texts, providing examples and outcomes to fuel creativity.
Scientific Knowledge Graph Question Answering To ad-dress TutorQA tasks, we first utilize the Graphusion framework to construct an NLP KG. Then we design a framework for the inter-action between the LLM and the graph, which includes two steps: command query and answer generation. In the command query stage, an LLM independently generates commands to query the graph upon receiving the query, thereby retrieving relevant paths. During the answer generation phase, these paths are provided to the LLM as contextual prompts, enabling it to perform QA.
Evaluation Metrics Accuracy We report the accuracy score for Task 1 and Task 4, as they are binary classification tasks.
Similarity score For Tasks 2 and 3, the references consist of a list of entities. Generally, LLMs demonstrate creativity by answering with novel entities, which are often composed of more contemporary and fresh words, even though they might not exactly match the words in the graph. Consequently, conventional evaluation metrics like keyword matching are unsuitable for these tasks. To address this, we propose the similarity score. This metric calculates the semantic
similarity between the entities in the predicted list Cpred and the ground truth list Cgold. Specifically, as shown in Eq 1, for an entity m from the predicted list, and an entity n from the ground truth list, we calculate the cosine similarity between their embeddings achieved from pre-trained BERT model [7]. We then average these similarity scores to obtain the similarity score.

Score = ΣmϵCpred ΣnϵCgold sim(m, n) / (|Cpred| × |Cgold|) (1)

By averaging the similarity scores, the final score provides a comprehensive measure of the overall semantic alignment between the predicted and ground truth entities.
Hit Rate For Task 5, we employ the classical Hit Rate metric, expressed as a percentage. This measure exemplifies the efficiency of LLM at retrieving and presenting relevant entities in its output as compared to a provided list of target entities.
Expert Evaluation In Task 6, where open-ended answers are generated without gold-standard responses, we resort to expert evaluation for comparative analysis between baseline results and our model. Despite available LLM-centric metrics like G-Eval [25], the specific evaluation needs of this task warrant distinct criteria, particularly examining the persuasive and scientifically sound ele-ments of generated project proposals. Four evaluation criteria, rated on a 1-5 scale, are employed: Entity Relevancy: the project's align-ment with the query entities. Entity Coverage: the extent to which the project encompasses the query entities. Project Convincity: the persuasiveness and practical feasibility of the project. Scientific Factuality: the scientific accuracy of the information within the project.

WWW Companion '25, April 28-May 2, 2025, Sydney, NSW, Australia
Question
LLAMA
GPT-40
Ours

Rui Yang et al.
I already know about neural question answering, social media analysis, topic modeling, relation extraction, and word embedding variations. In the domain of natural language processing, what potential project can I work on? Give me a possible idea. Show me the title and project description.
Title: Exploring the Impact of Emojis on Textual Emotions; Description: Emojis have become an integral part of online communication...The project will involve the following tasks: 1. Data Collection: We will collect a dataset of text messages...and their corresponding emotional labels (positive, negative, neutral). 2. Data Preprocessing: We will preprocess the data by removing stop words...
Title: Multi-faceted Analysis of Social Media Discussions on Climate Change; Description: This project aims to ... Utilizing neural question answering, we can automatically address common inquiries people have about climate topics. Social media analysis will uncover trends, sentiment, and influential users shaping the conversation. Topic modeling will identify underlying themes in these discussions
Title: Enhanced Social Media Insights through Multilingual Aspect-Based Sentiment Analysis; Description: This project aims to develop a comprehensive system for analyzing social media data to extract and understand user sentiments across multiple languages. By leveraging neural question answering, topic modeling, and relation extraction, the system will identify key aspects and sentiments from posts. Dependency parsing and event extraction will help in understanding syntactic and event-based relations... Word embedding variations and multilingual word embeddings will ensure accurate sentiment analysis across languages...
Table 4: Case study on TutorQA Task 6: LLaMA, GPT-40, and our pipeline with constructed KG from Graphusion (part). We highlight the relevant entities, irrelevant entities, entity details and expanded relevant entities.

Table 5: Results for TutorQA evaluations across various tasks.

| Setting | T1 | T2 | T3 | T4 | T5 |
|---|---|---|---|---|---|
| GPT40 zs | 69.20 | 64.42 | 66.61 | 44.00 | 11.45 |
| GPT40 RAG | 64.40 | 65.06 | 69.31 | 40.80 | 10.02 |
| Ours | 92.00 | 80.29 | 77.85 | 50.00 | 15.65 |

(a) Evaluation on Tasks 1-5. T1, T4: accuracy; T2, T3: similarity score; T5: hit rate.

| Model | Relevancy | Coverage | Convincity | Factuality |
|---|---|---|---|---|
| GPT40 zs | 4.75 | 4.84 | 4.38 | 4.63 |
| GPT40 RAG | 4.73 | 4.71 | 4.58 | 4.71 |
| Ours | 4.85 | 4.91 | 4.72 | 4.77 |

(b) Expert evaluation on Task 6.

Experimental Results Our analysis in Tab. 5 compares the results based on Graphusion and two baselines, including GPT-40 zero-shot (zs) and GPT-40 with RAG (RAG). Our method with the Graphusion constructed KG shows significant improvements across Tasks 1 to 6 over the baselines. Specifically, Task 6 is evaluated by two NLP experts, with a Kappa score of 0.67, which suggests sub-stantial agreement. The results indicate that our pipeline exhibits a marginally superior performance, particularly in the expert evalua-tion of Convincity and Factuality. This suggests that our method might be better at generating content that is not only factually accurate but also presents it in a more persuasive way to the reader. Compared to the base RAG framework, the Graphusion-generated KGs lead to better performance, particularly in Task 4 and 5, where a global understanding is essential. This improvement highlights the critical role of our core fusion step in addressing complex QA.
Case Study: Task 6 (Expanded relevant entities in the an-swer) To further understand how KGs could help in advanced educational scenarios, we present a case study on Task 6 in Tab. 4. The posed question incorporates five entities (highlighted in blue), with the task being to formulate a feasible project proposal. Al-though LLAMA offers a substantial project description, its content
and relevance to the highlighted entities (marked in orange) are somewhat lacking. In contrast, GPT-40 not only references the queried entities but also provides detailed insights (highlighted in purple) on their potential utility within the project, such as the role of neural question answering. Lastly, with Graphusion constructed KG, the model provides a more comprehensive solu-tion, elaborating on the entities and introducing additional ones (highlighted in lavender) that come from the recovered graph, like dependency parsing and event extraction, while initially ad-dressing the queried entities.

7 Conclusion
In this work, we proposed the Graphusion to construct scientific KGs from free text using LLMs. Through three key steps: seed entity generation, candidate triplet extraction, and KG Fusion, Graphu-sion builds KGs from a global perspective, addressing the limita-tions of traditional KGC methods. Additionally, we introduced the new benchmark dataset TutorQA, which encompasses 1,200 expert-verified QA pairs across six tasks. TutorQA is specifically designed for KG-based QA in the NLP educational scenario. We developed an automated pipeline that leveraged the Graphusion-constructed KG, significantly enhancing the performance on TutorQA compared to pure LLM baselines.

Acknowledgment
This work was supported by JST ACT-X (Grant JPMJAX24CU) and JSPS KAKENHI (Grant 24K20832).

References
[1] Josh Achiam, Steven Adler, Sandhini Agarwal, Lama Ahmad, Ilge Akkaya, Floren-cia Leoni Aleman, Diogo Almeida, Janko Altenschmidt, Sam Altman, Shyamal Anadkat, et al. 2023. Gpt-4 technical report. arXiv preprint arXiv:2303.08774 (2023).
[2] Kian Ahrabian, Xinwei Du, Richard Delwin Myloth, Arun Baalaaji Sankar Anan-than, and Jay Pujara. 2023. PubGraph: A Large-Scale Scientific Knowledge Graph. arXiv preprint arXiv:2302.02231 (2023).
[3] Mikel Artetxe, Gorka Labaka, and Eneko Agirre. 2018. Unsupervised Statistical Machine Translation. In Proceedings of the 2018 Conference on Empirical Methods in

WWW Companion '25, April 28-May 2, 2025, Sydney, NSW, Australia
Graphusion
Natural Language Processing. Association for Computational Linguistics, Brussels, Belgium.
[4] Jinheon Baek, Alham Fikri Aji, and Amir Saffari. 2023. Knowledge-Augmented Language Model Prompting for Zero-Shot Knowledge Graph Question Answer-ing. ArXiv abs/2306.04136 (2023). https://api.semanticscholar.org/CorpusID: 259095910
[5] Antoine Bosselut, Hannah Rashkin, Maarten Sap, Chaitanya Malaviya, Asli Ce-likyilmaz, and Yejin Choi. 2019. COMET: Commonsense Transformers for Auto-matic Knowledge Graph Construction. In Proceedings of the 57th Annual Meeting of the Association for Computational Linguistics, Anna Korhonen, David Traum, and Llu?s M?rquez (Eds.). Association for Computational Linguistics, Florence, Italy, 4762-4779. https://doi.org/10.18653/v1/P19-1470
[6] Salvatore M. Carta, Alessandro Giuliani, Lee Cecilia piano, Alessandro Sebastian Podda, Livio Pompianu, and Sandro Gabriele Tiddia. 2023. Iterative Zero-Shot LLM Prompting for Knowledge Graph Construction. ArXiv abs/2307.01128 (2023). https://api.semanticscholar.org/CorpusID:259316469
[7] Jacob Devlin, Ming-Wei Chang, Kenton Lee, and Kristina Toutanova. 2019. BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding. In North American Chapter of the Association for Computational Linguistics. https: //api.semanticscholar.org/CorpusID:52967399
[8] Darren Edge, Ha Trinh, Newman Cheng, Joshua Bradley, Alex Chao, Apurva Mody, Steven Truitt, and Jonathan Larson. 2024. From Local to Global: A Graph RAG Approach to Query-Focused Summarization. ArXiv abs/2404.16130 (2024). https://api.semanticscholar.org/CorpusID:269363075
[9] Fan Gao, Hang Jiang, Rui Yang, Qingcheng Zeng, Jinghui Lu, Moritz Blum, Tian-wei She, Yuang Jiang, and Irene Li. 2024. Evaluating large language models on wikipedia-style survey generation. In Findings of the Association for Computa-tional Linguistics ACL 2024. 5405-5418.
[10] Cristian D. Gonz?lez-Carrillo, Felipe Restrepo-Calle, Jhon Jairo Ram?rez- Echeverry, and Fabio A. Gonz?lez. 2021. Automatic Grading Tool for Jupyter Notebooks in Artificial Intelligence Courses. Sustainability (2021). https: //api.semanticscholar.org/CorpusID:243477284
[11] Maarten R. Grootendorst. 2022. BERTopic: Neural topic modeling with a class-based TF-IDF procedure. ArXiv abs/2203.05794 (2022). https://api. semanticscholar.org/CorpusID:247411231
[12] Aditya Grover and Jure Leskovec. 2016. node2vec: Scalable feature learning for networks. In Proceedings of the 22nd ACM SIGKDD international conference on Knowledge discovery and data mining. 855-864.
[13] Yann Hicke, Anmol Agarwal, Qianou Ma, and Paul Denny. 2023. ChaTA: To-wards an Intelligent Question-Answer Teaching Assistant using Open-Source LLMs. ArXiv abs/2311.02775 (2023). https://api.semanticscholar.org/CorpusID: 265033489
[14] Felix Hill, Antoine Bordes, Sumit Chopra, and Jason Weston. 2015. The Goldilocks Principle: Reading Children's Books with Explicit Memory Representations. CoRR abs/1511.02301 (2015). https://api.semanticscholar.org/CorpusID:14915449
[15] Pengcheng Jiang, Cao Xiao, Adam Richard Cross, and Jimeng Sun. 2023. Graph-Care: Enhancing Healthcare Predictions with Personalized Knowledge Graphs. In The Twelfth International Conference on Learning Representations.
[16] Aparna Kalla, R Shailesh, S. Preetha, Snehal Chandra, and Sudeepa Roy. 2023. Scientific Knowledge Graph Creation and Analysis. 2023 IEEE 8th Interna-tional Conference for Convergence in Technology (I2CT) (2023), 1-5. https: //api.semanticscholar.org/CorpusID:258870236
[17] Yuhe Ke, Rui Yang, and Nan Liu. 2024. Comparing Open-Access Database and Traditional Intensive Care Studies Using Machine Learning: Bibliometric Analysis Study. Journal of Medical Internet Research 26 (2024), e48330.
[18] Anh Le-Tuan, Carlos Franzreb, Sonja Schimmler, and Manfred Hauswirth. 2022. Towards Building Live Open Scientific Knowledge Graphs. Companion Proceed-ings of the Web Conference 2022 (2022). https://api.semanticscholar.org/CorpusID: 248347985
[19] Patrick Lewis, Ethan Perez, Aleksandara Piktus, Fabio Petroni, Vladimir Karpukhin, Naman Goyal, Heinrich Kuttler, Mike Lewis, Wen tau Yih, Tim Rockt?schel, Sebastian Riedel, and Douwe Kiela. 2020. Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks. ArXiv abs/2005.11401 (2020). https://api.semanticscholar.org/CorpusID:218869575
[20] Irene Li, Vanessa Yan, Tianxiao Li, Rihao Qu, and Dragomir R. Radev. 2021. Un-supervised Cross-Domain Prerequisite Chain Learning using Variational Graph Autoencoders. In Annual Meeting of the Association for Computational Linguistics. https://api.semanticscholar.org/CorpusID:234334083
[21] Irene Li and Boming Yang. 2023. NNKGC: Improving Knowledge Graph Comple-tion with Node Neighborhoods. In Proceedings of the Workshop on Deep Learning for Knowledge Graphs (DL4KG 2023) co-located with the 21th International Seman-tic Web Conference (ISWC 2023), Athens, November 6-10, 2023 (CEUR Workshop Proceedings, Vol. 3559), Mehwish Alam and Michael Cochez (Eds.). CEUR-WS.org. https://ceur-ws.org/Vol-3559/paper-6.pdf
[22] Irene Z Li, Alexander R. Fabbri, Swapnil Hingmire, and Dragomir R. Radev. 2020. R-VGAE: Relational-variational Graph Autoencoder for Unsupervised Prerequi-site Chain Learning. ArXiv abs/2004.10610 (2020). https://api.semanticscholar. org/CorpusID:216056469

WWW Companion '25, April 28-May 2, 2025, Sydney, NSW, Australia
[23] Irene Z Li, Vanessa Yan, and Dragomir R. Radev. 2021. Efficient Variational Graph Autoencoders for Unsupervised Cross-domain Prerequisite Chains. ArXiv abs/2109.08722 (2021). https://api.semanticscholar.org/CorpusID:237571655
[24] Qian Li, Zhuo Chen, Cheng Ji, Shiqi Jiang, and Jianxin Li. 2024. LLM-based Multi-Level Knowledge Generation for Few-shot Knowledge Graph Comple-tion. Proceedings of the Thirty-ThirdInternational Joint Conference on Artificial Intelligence (2024). https://api.semanticscholar.org/CorpusID:271494703
[25] Yang Liu, Dan Iter, Yichong Xu, Shuo Wang, Ruochen Xu, and Chenguang Zhu. 2023. G-Eval: NLG Evaluation using GPT-4 with Better Human Alignment. In Conference on Empirical Methods in Natural Language Processing. https: //api.semanticscholar.org/CorpusID:257804696
[26] Qingyu Lu, Baopu Qiu, Liang Ding, Liping Xie, and Dacheng Tao. 2023. Er-ror Analysis Prompting Enables Human-Like Translation Evaluation in Large Language Models: A Case Study on ChatGPT. ArXiv abs/2303.13809 (2023). https://api.semanticscholar.org/CorpusID:257756967
[27] Yi Luan, Luheng He, Mari Ostendorf, and Hannaneh Hajishirzi. 2018. Multi-Task Identification of Entities, Relations, and Coreference for Scientific Knowledge Graph Construction. ArXiv abs/1808.09602 (2018). https://api.semanticscholar.org/ CorpusID:52118895
[28] Chaitanya Malaviya, Subin Lee, Sihao Chen, Elizabeth Sieber, Mark Yatskar, and Dan Roth. 2023. ExpertQA: Expert-Curated Questions and Attributed An-swers. ArXiv abs/2309.07852 (2023). https://api.semanticscholar.org/CorpusID: 261823130
[29] Andrew Lan Nigel Fernandez, Alexander Scarlatos. 2024. SyllabusQA: A Course Logistics Question Answering Dataset. ArXiv abs/2403.14666 (2024). https: //api.semanticscholar.org/CorpusID:268667283
[30] Shirui Pan, Linhao Luo, Yufei Wang, Chen Chen, Jiapu Wang, and Xindong Wu. 2024. Unifying Large Language Models and Knowledge Graphs: A Roadmap. IEEE Trans. Knowl. Data Eng. 36, 7 (2024), 3580-3599. https://doi.org/10.1109/ TKDE.2024.3352100
[31] Bryan Perozzi, Rami Al-Rfou, and Steven Skiena. 2014. DeepWalk: Online Learn-ing of Social Representations. In Proceedings of the 20th ACM SIGKDD Interna-tional Conference on Knowledge Discovery and Data Mining (New York, New York, USA) (KDD '14). ACM, New York, NY, USA, 701-710. https://doi.org/10.1145/ 2623330.2623732
[32] Justin T. Reese, Deepak R. Unni, Tiffany J. Callahan, Luca Cappelletti, Vida Ravanmehr, Seth Carbon, Tommaso Fontana, Hannah Blau, Nicolas Matentzoglu, Nomi L. Harris, Monica C. Munoz-Torres, Peter N. Robinson, marcin p. joachimiak, and Chris J. Mungall. 2020. KG-COVID-19: A Framework to Produce Customized Knowledge Graphs for COVID-19 Response. Patterns 2 (2020). https://api. semanticscholar.org/CorpusID:221191594
[33] Dominic Seyler, Mohamed Yahya, and Klaus Berberich. 2015. Generating Quiz Questions from Knowledge Graphs. Proceedings of the 24th International Con-ference on World Wide Web (2015). https://api.semanticscholar.org/ 7522972
[34] Jiawei Sheng, Shu Guo, Zhenyu Chen, Juwei Yue, Lihong Wang, and Tingwen Liu. 2022. Challenging the Assumption of Structure-based embeddings in Few- and Zero-shot Knowledge Graph Completion. In International Conference on Language Resources and Evaluation. https://api.semanticscholar.org/CorpusID:252376765
[35] Denny Vrande?i? and Markus Kr?tzsch. 2014. Wikidata: a free collaborative knowledgebase. Commun. ACM 57, 10 (sep 2014), 78-85. https://doi.org/10. 1145/2629489
[36] Jason Wei, Xuezhi Wang, Dale Schuurmans, Maarten Bosma, Ed Huai hsin Chi, F. Xia, Quoc Le, and Denny Zhou. 2022. Chain of Thought Prompting Elicits Reasoning in Large Language Models. ArXiv abs/2201.11903 (2022). https: //api.semanticscholar.org/CorpusID:246411621
[37] Ying Xu, Dakuo Wang, Mo Yu, Daniel Ritchie, Bingsheng Yao, Tongshuang Sherry Wu, Zheng Zhang, Toby Jia-Jun Li, Nora Bradford, Branda Sun, Tran Bao Hoang, Yisi Sang, Yufang Hou, Xiaojuan Ma, Diyi Yang, Nanyun Peng, Zhou Yu, and Mark Warschauer. 2022. Fantastic Questions and Where to Find Them: FairytaleQA An Authentic Dataset for Narrative Comprehension. In Annual Meeting of the Association for Computational Linguistics. https://api.semanticscholar.org/ CorpusID:247762948
[38] Rui Yang, Haoran Liu, Edison Marrese-Taylor, Qingcheng Zeng, Yuhe Ke, Wanxin Li, Lechao Cheng, Qingyu Chen, James Caverlee, Yutaka Matsuo, and Irene Li. 2024. KG-Rank: Enhancing Large Language Models for Medical QA with Knowledge Graphs and Ranking Techniques. In Proceedings of the 23rd Work-shop on Biomedical Natural Language Processing, Dina Demner-Fushman, Sophia Ananiadou, Makoto Miwa, Kirk Roberts, and Junichi Tsujii (Eds.). Association for Computational Linguistics, Bangkok, Thailand, 155-166. https://doi.org/10. 18653/v1/2024.bionlp-1.13
[39] Rui Yang, Yilin Ning, Emilia Keppo, Mingxuan Liu, Chuan Hong, Danielle S Bitter-man, Jasmine Chiat Ling Ong, Daniel Shu Wei Ting, and Nan Liu. 2024. Retrieval-Augmented Generation for Generative Artificial Intelligence in Medicine. arXiv preprint arXiv:2406.12449 (2024).
[40] Rui Yang, Ting Fang Tan, Wei Lu, Arun James Thirunavukarasu, Daniel Shu Wei Ting, and Nan Liu. 2023. Large language models in health care: Development, applications, and challenges. Health Care Science 2, 4 (2023), 255-263.

WWW Companion '25, April 28-May 2, 2025, Sydney, NSW, Australia
[41] Rui Yang, Qingcheng Zeng, Keen You, Yujie Qiao, Lucas Huang, Chia-Chun Hsieh, Benjamin Rosand, Jeremy Goldwasser, Amisha Dave, Tiarnan Keenan, et al. 2024. Ascle-A Python Natural Language Processing Toolkit for Medical Text Generation: Development and Evaluation Study. Journal of Medical Internet Research 26 (2024), e60601.
[42] Yichi Zhang, Zhuo Chen, Wen Zhang, and Hua zeng Chen. 2023. Making Large Language Models Perform Better in Knowledge Graph Completion. ArXiv abs/2310.06671 (2023). https://api.semanticscholar.org/CorpusID:263830580
[43] Zheng Zhang, Jie Gao, Ranjodh Singh Dhaliwal, and Toby Jia-Jun Li. 2023. VISAR: A Human-AI Argumentative Writing Assistant with Visual Programming and Rapid Draft Prototyping. Proceedings of the 36th Annual ACM Symposium on

Rui Yang et al.
User Interface Software and Technology (2023). https://api.semanticscholar.org/ CorpusID:258179241
[44] Yuqi Zhu, Xiaohan Wang, Jing Chen, Shuofei Qiao, Yixin Ou, Yunzhi Yao, Shumin Deng, Huajun Chen, and Ningyu Zhang. 2023. LLMs for Knowledge Graph Construction and Reasoning: Recent Capabilities and Future Opportunities. ArXiv abs/2305.13168 (2023). https://api.semanticscholar.org/CorpusID:258833039
[45] Brian Zylich, Adam Viola, Brokk Toggerson, Lara Al-Hariri, and Andrew S. Lan. 2020. Exploring Automated Question Answering Methods for Teaching Assistance. Artificial Intelligence in Education 12163 (2020), 610 622. https: //api.semanticscholar.org/CorpusID:220364751