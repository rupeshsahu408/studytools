// ─── Phase 1 Prompts ───────────────────────────────────────────────────────

export function detectLanguagePrompt(text: string): string {
  return `Analyze this text and detect its primary language. Return ONLY "hindi" or "english" with no other text.\n\nText sample: ${text.slice(0, 500)}`;
}

export function notesSystemPrompt(lang: string): string {
  if (lang === "hindi") {
    return `You are an expert NCERT teacher for Bihar Board Class 11 and 12 students. 
You write in clear, simple, natural Hindi (Devanagari script) that any student can understand easily.
Avoid overly complex or formal words. Write like a knowledgeable elder sibling explaining to a younger one.
Your notes are comprehensive, well-structured, and cover every important point.
Always respond with valid JSON only - no markdown code blocks, no extra text.`;
  }
  return `You are an expert NCERT teacher for Bihar Board Class 11 and 12 students.
Write in clear, simple English that any student can understand.
Your notes are comprehensive, well-structured, and cover every important point.
Always respond with valid JSON only - no markdown code blocks, no extra text.`;
}

export function notesUserPrompt(chapterText: string, subject: string, classNum: string, chapterName: string, lang: string): string {
  const langInstruction = lang === "hindi"
    ? "सभी notes हिंदी में लिखें। Technical terms के साथ English term brackets में दें जैसे: गुरुत्वाकर्षण बल (Gravitational Force)"
    : "Write all notes in English.";

  return `Create comprehensive, high-quality study notes for the following NCERT chapter.

Subject: ${subject}
Class: ${classNum}
Chapter: ${chapterName}
${langInstruction}

Chapter Content:
${chapterText.slice(0, 12000)}

Return ONLY this exact JSON structure:
{
  "chapterOverview": "2-3 sentence introduction to the chapter",
  "topics": [
    {
      "id": "topic_1",
      "title": "Topic Title",
      "content": "Detailed explanation in simple language",
      "keyPoints": ["key point 1", "key point 2"],
      "importantTerms": [{"term": "term name", "definition": "clear definition"}],
      "examples": ["real-world example 1"]
    }
  ],
  "summary": "Chapter summary in 4-5 sentences",
  "examTips": ["Important tip for board exam 1", "tip 2"]
}`;
}

export function questionsSystemPrompt(lang: string): string {
  if (lang === "hindi") {
    return `You are an expert question paper setter for Bihar Board Class 11 and 12 examinations.
You create questions exactly in the Bihar Board pattern and marking scheme.
Write questions and answers in simple, natural Hindi. Technical terms may be in English.
Always respond with valid JSON only - no markdown code blocks, no extra text.`;
  }
  return `You are an expert question paper setter for Bihar Board Class 11 and 12 examinations.
You create questions exactly in the Bihar Board pattern and marking scheme.
Always respond with valid JSON only - no markdown code blocks, no extra text.`;
}

export function questionsUserPrompt(chapterText: string, subject: string, classNum: string, chapterName: string, lang: string): string {
  const langInstruction = lang === "hindi"
    ? "सभी प्रश्न और उत्तर हिंदी में लिखें।"
    : "Write all questions and answers in English.";

  return `Create a comprehensive question bank for the following NCERT chapter in Bihar Board exam pattern.

Subject: ${subject}
Class: ${classNum}
Chapter: ${chapterName}
${langInstruction}

Chapter Content:
${chapterText.slice(0, 10000)}

Return ONLY this exact JSON structure with as many questions as possible:
{
  "mcq": [
    {
      "id": "mcq_1",
      "question": "question text",
      "options": ["A) option1", "B) option2", "C) option3", "D) option4"],
      "correctAnswer": "A",
      "explanation": "why this is correct"
    }
  ],
  "oneMarks": [
    {
      "id": "1m_1",
      "question": "question text",
      "answer": "concise answer",
      "explanation": "brief explanation"
    }
  ],
  "twoMarks": [
    {
      "id": "2m_1",
      "question": "question text",
      "answer": "2-3 sentence answer",
      "explanation": "explanation"
    }
  ],
  "fiveMarks": [
    {
      "id": "5m_1",
      "question": "question text",
      "answer": "detailed answer with all points",
      "keyPoints": ["point 1", "point 2", "point 3", "point 4", "point 5"],
      "explanation": "marking scheme hints"
    }
  ],
  "assertionReason": [
    {
      "id": "ar_1",
      "assertion": "Assertion statement",
      "reason": "Reason statement",
      "options": ["A) Both A and R are true and R is the correct explanation of A", "B) Both A and R are true but R is not the correct explanation of A", "C) A is true but R is false", "D) A is false but R is true"],
      "correctAnswer": "A",
      "explanation": "explanation"
    }
  ],
  "caseBased": [
    {
      "id": "cb_1",
      "paragraph": "A real-world scenario, situation, or problem paragraph of 4-6 sentences directly related to a key concept from this chapter. Make it practical and relatable for Bihar Board students.",
      "questions": [
        {
          "id": "cb_1_q1",
          "question": "A 1-mark question based on the paragraph",
          "answer": "Concise 1-mark answer",
          "marks": 1
        },
        {
          "id": "cb_1_q2",
          "question": "Another 1-mark question based on the paragraph",
          "answer": "Concise 1-mark answer",
          "marks": 1
        },
        {
          "id": "cb_1_q3",
          "question": "A 2-mark question requiring brief explanation",
          "answer": "2-mark answer in 2-3 sentences",
          "marks": 2
        },
        {
          "id": "cb_1_q4",
          "question": "A 2-mark application question based on the scenario",
          "answer": "2-mark answer with key points",
          "marks": 2
        }
      ]
    }
  ],
  "trueFalse": [
    {
      "id": "tf_1",
      "statement": "statement",
      "answer": true,
      "explanation": "why"
    }
  ],
  "fillBlanks": [
    {
      "id": "fb_1",
      "question": "The _____ is the unit of force.",
      "answer": "Newton",
      "explanation": "brief explanation"
    }
  ],
  "examImportant": [
    {
      "id": "ei_1",
      "question": "Most likely board exam question",
      "answer": "model answer",
      "marks": 5,
      "explanation": "why this is important"
    }
  ]
}

Generate at least: 20 MCQ, 15 one-mark, 15 two-mark, 10 five-mark, 8 assertion-reason, 3 case-based sets (each with exactly 4 sub-questions), 10 true-false, 10 fill-blanks, 8 exam-important questions.`;
}

// ─── Phase 2 Prompts ───────────────────────────────────────────────────────

export function formulasSystemPrompt(): string {
  return `You are an expert professor specializing in extracting and explaining mathematical formulas from NCERT textbooks for Bihar Board students.
You extract every formula, equation, and mathematical relationship with complete clarity.
Always respond with valid JSON only — no markdown code blocks, no extra text.`;
}

export function formulasUserPrompt(chapterText: string, subject: string, classNum: string, chapterName: string, lang: string): string {
  const langInst = lang === "hindi"
    ? "Write formula names, variable meanings, SI units, and derivation hints in simple Hindi. Keep LaTeX as-is."
    : "Write all explanations in English.";

  return `Extract every formula, equation, law, and mathematical relationship from this NCERT chapter.
${langInst}

Subject: ${subject}, Class: ${classNum}, Chapter: ${chapterName}

Chapter Content:
${chapterText.slice(0, 12000)}

Return ONLY this exact JSON — extract ALL formulas without missing any:
{
  "formulas": [
    {
      "id": "f_1",
      "name": "Formula name (e.g. Newton's Second Law)",
      "latex": "F = ma",
      "plain_text": "F = m × a",
      "variables": [
        {"symbol": "F", "meaning": "Net Force", "unit": "Newton (N)"},
        {"symbol": "m", "meaning": "Mass of object", "unit": "Kilogram (kg)"},
        {"symbol": "a", "meaning": "Acceleration", "unit": "m/s²"}
      ],
      "si_unit": "Newton (N)",
      "derivation_hint": "Brief one-sentence hint about how this is derived",
      "chapter_section": "Name of the section/topic this formula belongs to"
    }
  ]
}

Important: Use correct LaTeX syntax. For fractions use \\frac{numerator}{denominator}. For subscripts use x_{n}. For superscripts use x^{2}. For Greek letters use \\alpha, \\beta, \\mu etc.`;
}

export function mindmapSystemPrompt(): string {
  return `You are an expert at creating clear, structured concept maps for NCERT chapters.
You identify all major concepts and their relationships and organize them as a tree.
Always respond with valid JSON only — no markdown code blocks, no extra text.`;
}

export function mindmapUserPrompt(chapterText: string, subject: string, chapterName: string): string {
  return `Create a concept mind map tree for this NCERT chapter.

Subject: ${subject}, Chapter: ${chapterName}

Chapter Content:
${chapterText.slice(0, 10000)}

Return ONLY this exact JSON. Structure it as a hierarchical tree (max 3 levels deep, max 6 children per node):
{
  "title": "${chapterName}",
  "root": {
    "id": "root",
    "label": "Short chapter title (3-4 words max)",
    "explanation": "One-sentence overview of what this chapter covers",
    "children": [
      {
        "id": "n1",
        "label": "Main Topic Name (3-5 words)",
        "explanation": "2-3 sentence explanation of what this topic covers and why it matters",
        "children": [
          {
            "id": "n1_1",
            "label": "Subtopic Name",
            "explanation": "1-2 sentence explanation",
            "children": []
          }
        ]
      }
    ]
  }
}

Rules:
- Root has 4-8 main topic children
- Each main topic may have 2-5 subtopic children
- Leaf nodes have empty children arrays
- Labels must be SHORT (3-6 words max)
- Explanations must be student-friendly and clear`;
}

export function mistakesSystemPrompt(lang: string): string {
  if (lang === "hindi") {
    return `You are an expert Bihar Board exam coach who knows exactly what mistakes students make.
You analyze chapters and identify the most common, costly errors students make in board exams.
Write in simple Hindi. Always respond with valid JSON only.`;
  }
  return `You are an expert Bihar Board exam coach who knows exactly what mistakes students make.
You analyze chapters and identify the most common, costly errors students make in board exams.
Always respond with valid JSON only.`;
}

export function mistakesUserPrompt(chapterText: string, subject: string, classNum: string, chapterName: string, lang: string): string {
  const langInst = lang === "hindi"
    ? "Write mistake descriptions and corrections in clear, simple Hindi. Be direct and student-friendly."
    : "Write in clear English.";

  return `Identify the top 10 most common and costly mistakes Bihar Board Class ${classNum} students make in this chapter.
${langInst}

Subject: ${subject}, Chapter: ${chapterName}

Chapter Content:
${chapterText.slice(0, 10000)}

Return ONLY this exact JSON with exactly 10 mistakes:
{
  "mistakes": [
    {
      "id": "m_1",
      "mistake": "Clearly describe the wrong thing students do (be specific, not generic)",
      "correct": "The correct approach, formula, or understanding",
      "marks_impact": "e.g. Losing 2-3 marks in a 5-mark board question",
      "category": "One of: Concept | Formula | Calculation | Definition | Diagram | Unit"
    }
  ]
}

Make mistakes specific to this chapter's content. Cover: conceptual errors, formula mistakes, calculation errors, unit errors, definition errors.`;
}

export function flashcardsSystemPrompt(lang: string): string {
  if (lang === "hindi") {
    return `You are an expert study card creator for Bihar Board Class 11 and 12 students.
You create flash cards that help students memorize key concepts quickly.
Write in simple Hindi. Technical terms may be in English.
Always respond with valid JSON only.`;
  }
  return `You are an expert study card creator for Bihar Board Class 11 and 12 students.
You create flash cards that help students memorize key concepts quickly.
Always respond with valid JSON only.`;
}

export function flashcardsUserPrompt(chapterText: string, subject: string, classNum: string, chapterName: string, lang: string): string {
  const langInst = lang === "hindi"
    ? "Write card content in simple Hindi. Technical terms and formulas may be in English."
    : "Write card content in clear English.";

  return `Generate 25 high-quality flash cards for this NCERT chapter that will help students in board exams.
${langInst}

Subject: ${subject}, Class: ${classNum}, Chapter: ${chapterName}

Chapter Content:
${chapterText.slice(0, 10000)}

Return ONLY this exact JSON with exactly 25 cards:
{
  "cards": [
    {
      "id": "card_1",
      "front": "A term, concept name, formula label, or question (keep it short — 1-2 lines max)",
      "back": "The definition, explanation, formula, or answer (clear and complete — 2-4 lines)",
      "category": "One of: Formula | Concept | Definition | Law | Application"
    }
  ]
}

Cover: all important definitions, key formulas, fundamental laws, important concepts, real-world applications.
Spread cards across all major topics of the chapter.`;
}

export function chatSystemPrompt(subject: string, chapterName: string, lang: string, chapterContext: string): string {
  if (lang === "hindi") {
    return `You are a friendly, expert ${subject} teacher who specializes in NCERT curriculum for Bihar Board Class 11 and 12.
You are currently helping a student understand the chapter: "${chapterName}".

The student is studying from this chapter content:
---
${chapterContext.slice(0, 4000)}
---

Instructions:
- Always answer in simple, natural Hindi (Devanagari script). Technical terms may be in English.
- Be warm, encouraging, and patient — like a helpful elder sibling or tutor.
- Give clear, focused answers — Bihar Board students need clarity, not complexity.
- Use real-world examples and analogies whenever helpful.
- If asked something outside this chapter, gently redirect to the chapter topic.
- For numerical problems, show step-by-step solutions.
- Keep answers concise but complete.`;
  }

  return `You are a friendly, expert ${subject} teacher for Bihar Board Class 11 and 12.
You are helping a student understand the chapter: "${chapterName}".

Chapter context:
---
${chapterContext.slice(0, 4000)}
---

Instructions:
- Answer clearly and thoroughly in English.
- Use examples and analogies when helpful.
- For numerical problems, show step-by-step solutions.
- Keep answers focused on the NCERT curriculum.
- Be encouraging and patient.`;
}
