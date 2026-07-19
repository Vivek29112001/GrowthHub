import { supabase } from "@/integrations/supabase/client";

/**
 * Default 120-day AI Engineer roadmap seeded for every new user.
 * Users can freely edit, delete, or extend it after seeding.
 */
export const DEFAULT_AI_ROADMAP: Array<{
  title: string;
  outcome: string;
  topics: Array<{ group?: string; title: string }>;
}> = [
  {
    title: "Foundations: Python & CS Basics",
    outcome: "Comfortable writing clean Python, OOP, data structures.",
    topics: [
      { group: "Python", title: "Syntax, types, functions, comprehensions" },
      { group: "Python", title: "OOP: classes, inheritance, dunder methods" },
      { group: "Python", title: "Modules, packages, virtualenv, pip/uv" },
      { group: "Python", title: "Iterators, generators, decorators" },
      { group: "CS", title: "Big-O notation & complexity analysis" },
      { group: "CS", title: "Arrays, strings, hash maps" },
      { group: "CS", title: "Linked lists, stacks, queues" },
      { group: "Tools", title: "Git, GitHub workflow, branches, PRs" },
    ],
  },
  {
    title: "Math for ML",
    outcome: "Linear algebra, calculus, probability intuition for ML.",
    topics: [
      { group: "Linear Algebra", title: "Vectors, matrices, dot product" },
      { group: "Linear Algebra", title: "Matrix multiplication, transpose, inverse" },
      { group: "Linear Algebra", title: "Eigenvalues, eigenvectors, SVD" },
      { group: "Calculus", title: "Derivatives & partial derivatives" },
      { group: "Calculus", title: "Gradients & chain rule" },
      { group: "Probability", title: "Random variables, distributions" },
      { group: "Probability", title: "Bayes theorem, MLE, MAP" },
      { group: "Stats", title: "Mean, variance, covariance, correlation" },
    ],
  },
  {
    title: "Data Handling & Visualization",
    outcome: "Manipulate, clean, and visualize real datasets.",
    topics: [
      { title: "NumPy: arrays, broadcasting, vectorization" },
      { title: "Pandas: DataFrames, indexing, groupby" },
      { title: "Data cleaning: nulls, duplicates, encoding" },
      { title: "Matplotlib basics" },
      { title: "Seaborn / Plotly for EDA" },
      { title: "Working with CSV, JSON, Parquet" },
      { title: "Feature engineering fundamentals" },
      { title: "Mini project: EDA on a Kaggle dataset" },
    ],
  },
  {
    title: "Classical Machine Learning",
    outcome: "Train, tune, and evaluate ML models end-to-end.",
    topics: [
      { group: "Supervised", title: "Linear & logistic regression" },
      { group: "Supervised", title: "Decision trees, random forests" },
      { group: "Supervised", title: "Gradient boosting (XGBoost, LightGBM)" },
      { group: "Supervised", title: "SVMs, k-NN, Naive Bayes" },
      { group: "Unsupervised", title: "K-means, hierarchical clustering" },
      { group: "Unsupervised", title: "PCA, t-SNE, UMAP" },
      { group: "Eval", title: "Train/val/test splits, cross-validation" },
      { group: "Eval", title: "Metrics: accuracy, precision/recall, F1, ROC-AUC" },
      { group: "Eval", title: "Hyperparameter tuning (grid, random, Optuna)" },
    ],
  },
  {
    title: "Deep Learning Fundamentals",
    outcome: "Understand and build neural nets in PyTorch.",
    topics: [
      { title: "Perceptron, MLP, activation functions" },
      { title: "Loss functions & backpropagation" },
      { title: "Optimizers: SGD, Adam, learning rate schedules" },
      { title: "Regularization: dropout, weight decay, batch norm" },
      { title: "PyTorch tensors & autograd" },
      { title: "nn.Module, DataLoader, training loop" },
      { title: "Overfitting & underfitting" },
      { title: "Project: train an MLP on tabular data" },
    ],
  },
  {
    title: "Computer Vision",
    outcome: "Train CNNs, fine-tune image models.",
    topics: [
      { title: "Image basics: pixels, channels, tensors" },
      { title: "Convolutions, pooling, receptive field" },
      { title: "CNN architectures: ResNet, EfficientNet" },
      { title: "Data augmentation (Albumentations)" },
      { title: "Transfer learning & fine-tuning" },
      { title: "Object detection intro (YOLO, Faster R-CNN)" },
      { title: "Segmentation intro (U-Net)" },
      { title: "Project: image classifier with transfer learning" },
    ],
  },
  {
    title: "NLP & Transformers",
    outcome: "Understand transformers, fine-tune with HuggingFace.",
    topics: [
      { title: "Tokenization: BPE, WordPiece, SentencePiece" },
      { title: "Embeddings: Word2Vec, GloVe, contextual" },
      { title: "RNNs, LSTMs, seq2seq (intuition)" },
      { title: "Attention & self-attention" },
      { title: "Transformer architecture end-to-end" },
      { title: "BERT vs GPT: encoder vs decoder" },
      { title: "HuggingFace transformers: pipeline & Trainer" },
      { title: "Project: fine-tune BERT on a classification task" },
    ],
  },
  {
    title: "LLMs: Prompting & Fine-tuning",
    outcome: "Work with modern LLMs — prompt, evaluate, fine-tune.",
    topics: [
      { title: "Prompt engineering patterns" },
      { title: "Few-shot & chain-of-thought prompting" },
      { title: "OpenAI / Anthropic / Gemini APIs" },
      { title: "System prompts & structured outputs (JSON mode)" },
      { title: "LoRA & QLoRA fine-tuning basics" },
      { title: "Instruction tuning & RLHF (concept)" },
      { title: "Evals: BLEU, ROUGE, LLM-as-judge" },
      { title: "Project: chatbot with structured JSON output" },
    ],
  },
  {
    title: "RAG & Vector Databases",
    outcome: "Build production RAG systems.",
    topics: [
      { title: "Embeddings & similarity search" },
      { title: "Chunking strategies for documents" },
      { title: "Vector DBs: pgvector, Pinecone, Weaviate, Qdrant" },
      { title: "Retrieval pipelines (BM25 + dense hybrid)" },
      { title: "Re-ranking with cross-encoders" },
      { title: "Grounded generation & citations" },
      { title: "Evaluation of RAG (context recall, faithfulness)" },
      { title: "Project: RAG over your own PDFs" },
    ],
  },
  {
    title: "Agents & Tool Use",
    outcome: "Design multi-step agents with tools & memory.",
    topics: [
      { title: "Function/tool calling APIs" },
      { title: "ReAct, Plan-and-Execute patterns" },
      { title: "LangChain / LlamaIndex / LangGraph basics" },
      { title: "Agent memory (short-term & long-term)" },
      { title: "Multi-agent workflows" },
      { title: "Guardrails, safety, hallucination handling" },
      { title: "Cost & latency budgeting" },
      { title: "Project: research agent that browses & summarizes" },
    ],
  },
  {
    title: "MLOps & Deployment",
    outcome: "Ship models & LLM apps to production.",
    topics: [
      { title: "Docker for ML apps" },
      { title: "FastAPI for model serving" },
      { title: "Model versioning (MLflow, W&B)" },
      { title: "CI/CD basics for ML" },
      { title: "Monitoring: drift, latency, cost" },
      { title: "Serverless / GPU inference (Modal, Replicate)" },
      { title: "Caching, batching, streaming responses" },
      { title: "Deploy an LLM app to Cloud Run / Fly.io" },
    ],
  },
  {
    title: "System Design for AI",
    outcome: "Design scalable AI systems in interviews & at work.",
    topics: [
      { title: "Requirements gathering & scoping" },
      { title: "Data pipelines: batch vs streaming" },
      { title: "Feature stores" },
      { title: "Model serving patterns (online, offline, edge)" },
      { title: "Vector search at scale" },
      { title: "Design: build a recommendation system" },
      { title: "Design: build a semantic search engine" },
      { title: "Design: build a multi-tenant chatbot" },
    ],
  },
  {
    title: "DSA for Interviews",
    outcome: "Crack MAANG-level DSA rounds.",
    topics: [
      { title: "Arrays & two pointers" },
      { title: "Sliding window" },
      { title: "Hash maps & sets" },
      { title: "Binary search patterns" },
      { title: "Trees & BST" },
      { title: "Graphs: BFS, DFS, Dijkstra" },
      { title: "Dynamic programming basics" },
      { title: "150 curated LeetCode problems" },
    ],
  },
  {
    title: "Capstone Projects",
    outcome: "Ship 2-3 portfolio-grade AI products.",
    topics: [
      { title: "Choose 2 capstone ideas" },
      { title: "Design doc & architecture diagram" },
      { title: "Build MVP" },
      { title: "Add evals & telemetry" },
      { title: "Deploy publicly with a demo URL" },
      { title: "Write a detailed README" },
      { title: "Record a demo video" },
      { title: "Publish a blog post" },
    ],
  },
  {
    title: "Job Prep & Applications",
    outcome: "Resume, GitHub, portfolio, and start applying.",
    topics: [
      { title: "Polish resume (1-page, metrics-driven)" },
      { title: "LinkedIn & GitHub optimization" },
      { title: "Portfolio site with case studies" },
      { title: "Mock interviews: DSA + ML system design" },
      { title: "Behavioral / STAR stories" },
      { title: "Apply to 30+ AI Engineer roles" },
      { title: "Track applications & follow-ups" },
      { title: "Negotiate offers" },
    ],
  },
];

export async function seedDefaultRoadmapIfEmpty(): Promise<boolean> {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) return false;

  const { count, error: cErr } = await supabase
    .from("milestones")
    .select("*", { count: "exact", head: true });
  if (cErr) throw cErr;
  if ((count ?? 0) > 0) return false;

  for (let i = 0; i < DEFAULT_AI_ROADMAP.length; i++) {
    const m = DEFAULT_AI_ROADMAP[i];
    const { data: ms, error: mErr } = await supabase
      .from("milestones")
      .insert({
        title: m.title,
        outcome: m.outcome,
        order_index: i + 1,
        user_id: user.id,
      })
      .select("id")
      .single();
    if (mErr) throw mErr;
    if (!ms) continue;

    const rows = m.topics.map((t, idx) => ({
      milestone_id: ms.id,
      user_id: user.id,
      title: t.title,
      group_label: t.group ?? null,
      order_index: idx + 1,
    }));
    const { error: tErr } = await supabase.from("topics").insert(rows);
    if (tErr) throw tErr;
  }
  return true;
}
