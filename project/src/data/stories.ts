import { Story } from '@/types/reading';

export const stories: Story[] = [
  {
    id: 'beginner-1',
    title: 'First Day in Israel',
    level: 'Beginner',
    category: 'Daily Life',
    hebrew: 'שלום! קוראים לי דן. היום הגעתי לישראל. אני גר בתל אביב. העיר יפה מאוד.',
    translation: 'Hello! My name is Dan. Today I arrived in Israel. I live in Tel Aviv. The city is very beautiful.',
    audioUrl: '/audio/stories/first-day.mp3',
    estimatedTime: '5 mins',
    points: 100,
    xpReward: 50,
    vocabulary: [
      { word: 'שלום', translation: 'Hello', transliteration: 'Shalom' },
      { word: 'קוראים לי', translation: 'My name is', transliteration: 'Korim li' },
      { word: 'היום', translation: 'Today', transliteration: 'Hayom' },
      { word: 'הגעתי', translation: 'I arrived', transliteration: 'Higati' },
      { word: 'גר', translation: 'Live', transliteration: 'Gar' }
    ],
    questions: [
      {
        id: 'q1',
        type: 'multiple-choice',
        question: 'Where does Dan live?',
        options: ['Jerusalem', 'Tel Aviv', 'Haifa', 'Eilat'],
        correctAnswer: 'Tel Aviv',
        explanation: 'The text states "אני גר בתל אביב" (I live in Tel Aviv)',
        points: 20
      }
    ],
    bonusChallenge: {
      type: 'no-translation',
      description: 'Complete the reading and questions without using the translation',
      requirement: 'Score 100% without viewing translation',
      reward: 50
    }
  }
];

export const readingLevels = [
  {
    level: 1,
    name: 'Beginner Reader',
    xpRequired: 0,
    benefits: ['Access to beginner stories', 'Basic vocabulary tools']
  },
  {
    level: 2,
    name: 'Developing Reader',
    xpRequired: 100,
    benefits: ['Access to longer stories', 'Audio playback']
  },
  {
    level: 3,
    name: 'Intermediate Reader',
    xpRequired: 300,
    benefits: ['Access to intermediate stories', 'Speed reading challenges']
  },
  {
    level: 4,
    name: 'Advanced Reader',
    xpRequired: 600,
    benefits: ['Access to advanced stories', 'Special achievements']
  },
  {
    level: 5,
    name: 'Expert Reader',
    xpRequired: 1000,
    benefits: ['Access to all content', 'Bonus challenges', 'Community recognition']
  }
];

export const readingAchievements = [
  {
    id: 'first-story',
    name: 'First Steps',
    description: 'Complete your first story',
    xpReward: 50,
    icon: 'award'
  },
  {
    id: 'perfect-score',
    name: 'Perfect Reader',
    description: 'Get 100% on any story',
    xpReward: 100,
    icon: 'star'
  },
  {
    id: 'speed-demon',
    name: 'Speed Demon',
    description: 'Complete a story in under 3 minutes with at least 80% accuracy',
    xpReward: 150,
    icon: 'zap'
  },
  {
    id: 'no-translation',
    name: 'Hebrew Master',
    description: 'Complete a story without using translation',
    xpReward: 200,
    icon: 'award'
  },
  {
    id: 'streak-7',
    name: 'Weekly Warrior',
    description: 'Read stories for 7 days in a row',
    xpReward: 300,
    icon: 'flame'
  }
];

export const difficultyLevels = ['Beginner', 'Intermediate', 'Advanced', 'Expert'] as const;

export type DifficultyLevel = typeof difficultyLevels[number];