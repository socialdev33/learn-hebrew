import { motion } from 'framer-motion';
import { Button } from '../ui/button';
import { ArrowLeft, Check, HelpCircle, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';

interface Props {
  onBack: () => void;
}

const exercises = [
  {
    id: '1',
    prompt: 'Write the following in Hebrew: "Hello, how are you?"',
    answer: 'שלום, מה שלומך?',
    hint: 'Start with שלום (shalom)'
  },
  {
    id: '2',
    prompt: 'Write the following in Hebrew: "My name is..."',
    answer: 'קוראים לי...',
    hint: 'Use קוראים לי (korim li)'
  }
];

export function WritingPractice({ onBack }: Props) {
  const { width, height } = useWindowSize();
  const [currentExercise, setCurrentExercise] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [result, setResult] = useState<'correct' | 'incorrect' | null>(null);

  const handleSubmit = () => {
    const isCorrect = userInput === exercises[currentExercise].answer;
    setResult(isCorrect ? 'correct' : 'incorrect');
    if (isCorrect) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    }
  };

  const handleNext = () => {
    if (currentExercise < exercises.length - 1) {
      setCurrentExercise(currentExercise + 1);
      setUserInput('');
      setShowHint(false);
      setResult(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      {showConfetti && <Confetti width={width} height={height} />}
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-lg p-8"
        >
          <div className="flex items-center mb-8">
            <Button variant="ghost" onClick={onBack} className="mr-4">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h2 className="text-2xl font-bold">Writing Practice</h2>
          </div>

          <div className="space-y-6">
            <div className="text-lg">{exercises[currentExercise].prompt}</div>

            {showHint && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-brand-50 p-4 rounded-lg text-brand-700"
              >
                <HelpCircle className="inline-block h-5 w-5 mr-2" />
                {exercises[currentExercise].hint}
              </motion.div>
            )}

            <div>
              <textarea
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                className="w-full h-32 p-4 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                placeholder="Type your answer here..."
                dir="rtl"
              />
            </div>

            {result && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 rounded-lg ${
                  result === 'correct'
                    ? 'bg-green-50 text-green-700'
                    : 'bg-red-50 text-red-700'
                }`}
              >
                {result === 'correct' ? (
                  <Check className="inline-block h-5 w-5 mr-2" />
                ) : (
                  <RefreshCw className="inline-block h-5 w-5 mr-2" />
                )}
                {result === 'correct'
                  ? 'Correct! Well done!'
                  : 'Not quite right. Try again!'}
              </motion.div>
            )}

            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => setShowHint(!showHint)}
                className="flex items-center"
              >
                <HelpCircle className="h-5 w-5 mr-2" />
                {showHint ? 'Hide Hint' : 'Show Hint'}
              </Button>

              <div className="space-x-4">
                <Button onClick={handleSubmit}>Check Answer</Button>
                {result === 'correct' && (
                  <Button onClick={handleNext}>Next Exercise</Button>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}