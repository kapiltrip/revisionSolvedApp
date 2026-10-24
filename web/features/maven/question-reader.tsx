"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Eye, MessageCircle, Play } from "lucide-react";
import type { Material, PracticeMode, Question } from "./types";

export const modes: Array<{ id: PracticeMode; label: string; prompt: string }> = [
  {
    id: "concept",
    label: "Concept",
    prompt:
      "Define the idea in your own words. State its assumptions, bit order and signal polarity before looking at the answer.",
  },
  {
    id: "application",
    label: "Application",
    prompt:
      "Give one concrete use of this representation or circuit. Explain why you would choose it and what could go wrong.",
  },
  {
    id: "solve",
    label: "Solve",
    prompt:
      "Work through the question from a blank page. Derive the result, then test a boundary case or trace the relevant clock edges.",
  },
  {
    id: "speak",
    label: "Speak",
    prompt:
      "Give a 60–90 second explanation aloud: definition → mechanism → example → one pitfall. Then compare with the original discussion.",
  },
];

export function QuestionReader({
  assignment,
  questionId,
  mode,
  attemptVersion,
  onQuestion,
  onPractise,
  onAsk,
}: {
  assignment: number;
  questionId: string | null;
  mode: PracticeMode;
  attemptVersion: number;
  onQuestion: (id: string) => void;
  onPractise: (question: Question) => void;
  onAsk: (question: Question) => void;
}) {
  const [material, setMaterial] = useState<Material | null>(null);
  const [error, setError] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [extra, setExtra] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    setMaterial(null);
    setError("");
    void fetch(`/api/maven/materials?assignment=${assignment}`, { signal: controller.signal })
      .then(async (response) => {
        const result = (await response.json()) as Material & { error?: string };
        if (!response.ok) throw new Error(result.error ?? "Could not load the assignment.");
        setMaterial(result);
      })
      .catch((error) => {
        if (error.name !== "AbortError") setError(error.message);
      });
    return () => controller.abort();
  }, [assignment]);
  const question = material?.questions.find((q) => q.id === questionId) ?? material?.questions[0];
  useEffect(() => {
    setRevealed(false);
    setExtra(false);
  }, [question?.id, mode, attemptVersion]);
  if (error)
    return (
      <p role="alert" className="m-error">
        {error}
      </p>
    );
  if (!material || !question)
    return (
      <div className="m-panel" aria-busy="true">
        Loading original question and handwriting…
      </div>
    );
  const index = material.questions.findIndex((q) => q.id === question.id);
  return (
    <div className="m-reader-grid">
      <aside className="m-question-index" aria-label="Assignment question index">
        <strong>{material.questions.length} questions</strong>
        {material.questions.map((q) => (
          <button
            key={q.id}
            className={q.id === question.id ? "is-active" : ""}
            onClick={() => onQuestion(q.id)}
          >
            <span>{String(q.number).padStart(2, "0")}</span>
            {q.title}
          </button>
        ))}
        <button onClick={() => setExtra(!extra)}>
          {extra ? "Back to question" : "Extra notes"}
        </button>
      </aside>
      <article className="m-reader">
        {extra ? (
          <>
            <h2>Assignment {assignment} · Extra notes</h2>
            <div className="m-prose" dangerouslySetInnerHTML={{ __html: material.extraHtml }} />
          </>
        ) : (
          <>
            <div className="m-row m-between">
              <span className="m-eyebrow">
                Assignment {assignment} / Question {String(question.number).padStart(2, "0")}
              </span>
              <a className="m-text-link" href={question.sourceUrl} target="_blank" rel="noreferrer">
                Source notebook ↗
              </a>
            </div>
            <h2>{question.title}</h2>
            <p className="m-practice-prompt">{modes.find((m) => m.id === mode)?.prompt}</p>
            <div className="m-originals">
              {question.images
                .filter((image) => image.kind === "question")
                .map((image) => (
                  <figure key={image.src}>
                    <a href={image.src} target="_blank" rel="noreferrer">
                      <img src={image.src} alt={image.alt} loading="lazy" />
                    </a>
                  </figure>
                ))}
            </div>
            <div className="m-row m-wrap">
              <button className="m-button m-primary" onClick={() => onPractise(question)}>
                <Play size={16} />
                Start recall
              </button>
              <button className="m-button" onClick={() => onAsk(question)}>
                <MessageCircle size={16} />
                Ask trainer
              </button>
            </div>
            {!revealed ? (
              <div className="m-reveal">
                <p>Try it from memory first. Your original answer and explanation are below.</p>
                <button className="m-button" onClick={() => setRevealed(true)}>
                  <Eye size={17} />
                  Show my solution & discussion
                </button>
              </div>
            ) : (
              <>
                <h3>Your handwritten solution</h3>
                <div className="m-originals">
                  {question.images
                    .filter((image) => image.kind !== "question")
                    .map((image) => (
                      <figure key={image.src}>
                        <a href={image.src} target="_blank" rel="noreferrer">
                          <img src={image.src} alt={image.alt} loading="lazy" />
                        </a>
                        <figcaption>{image.alt}</figcaption>
                      </figure>
                    ))}
                </div>
                <h3>Discussion</h3>
                <div className="m-prose" dangerouslySetInnerHTML={{ __html: question.html }} />
                <button className="m-button" onClick={() => setRevealed(false)}>
                  Hide solution for another recall
                </button>
              </>
            )}
            <div className="m-reader-footer">
              <button
                className="m-button"
                disabled={index === 0}
                onClick={() => onQuestion(material.questions[index - 1].id)}
              >
                <ArrowLeft size={16} />
                Previous
              </button>
              <span className="m-muted">
                {index + 1} / {material.questions.length}
              </span>
              <button
                className="m-button"
                disabled={index === material.questions.length - 1}
                onClick={() => onQuestion(material.questions[index + 1].id)}
              >
                Next
                <ArrowRight size={16} />
              </button>
            </div>
          </>
        )}
      </article>
    </div>
  );
}
