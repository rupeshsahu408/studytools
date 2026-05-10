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

Generate at least: 20 MCQ, 15 one-mark, 15 two-mark, 10 five-mark, 8 assertion-reason, 10 true-false, 10 fill-blanks, 8 exam-important questions.`;
}
