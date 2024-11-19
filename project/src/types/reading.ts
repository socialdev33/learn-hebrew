export interface ReadingLevel {
  id: string;
  title: string;
  description: string;
  stories: Story[];
}

export interface Story {
  id: string;
  hebrew: string;
  transliteration: string;
  english: string;
  questions: Question[];
}

export interface Question {
  id: string;
  hebrew: string;
  transliteration: string;
  english: string;
  options: Answer[];
}

export interface Answer {
  hebrew: string;
  transliteration: string;
  english: string;
  isCorrect: boolean;
}