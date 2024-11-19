import { motion } from 'framer-motion';
import { Button } from '../ui/button';
import { Mic, ArrowLeft, Volume2 } from 'lucide-react';
import { useState, useRef } from 'react';

const phrases = [
  {
    hebrew: 'שלום',
    translation: 'Hello',
    transliteration: 'Shalom',
    audioUrl: '/audio/shalom.mp3'
  },
  {
    hebrew: 'מה שלומך',
    translation: 'How are you?',
    transliteration: 'Ma shlomcha/shlomech',
    audioUrl: '/audio/ma-shlomcha.mp3'
  },
  {
    hebrew: 'תודה רבה',
    translation: 'Thank you very much',
    transliteration: 'Toda raba',
    audioUrl: '/audio/toda-raba.mp3'
  }
];

interface Props {
  onBack: () => void;
}

export function SpeakingPractice({ onBack }: Props) {
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const currentPhrase = phrases[currentPhraseIndex];

  const handlePlayAudio = async () => {
    if (!audioRef.current) {
      audioRef.current = new Audio(currentPhrase.audioUrl);
    }

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      await audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleNext = () => {
    if (currentPhraseIndex < phrases.length - 1) {
      setCurrentPhraseIndex(currentPhraseIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentPhraseIndex > 0) {
      setCurrentPhraseIndex(currentPhraseIndex - 1);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
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
            <h2 className="text-2xl font-bold">Speaking Practice</h2>
          </div>

          <div className="text-center mb-12">
            <div className="text-4xl font-bold mb-4">{currentPhrase.hebrew}</div>
            <div className="text-xl text-gray-600 mb-2">{currentPhrase.transliteration}</div>
            <div className="text-lg text-gray-500">{currentPhrase.translation}</div>
          </div>

          <div className="flex justify-center gap-4 mb-8">
            <Button
              variant="outline"
              onClick={handlePlayAudio}
              className="flex items-center"
            >
              <Volume2 className="h-5 w-5 mr-2" />
              Listen
            </Button>
            <Button className="flex items-center">
              <Mic className="h-5 w-5 mr-2" />
              Practice Speaking
            </Button>
          </div>

          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentPhraseIndex === 0}
            >
              Previous
            </Button>
            <Button
              onClick={handleNext}
              disabled={currentPhraseIndex === phrases.length - 1}
            >
              Next
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}