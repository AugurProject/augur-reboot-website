
import { useState, useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { $shouldShowIntro, animationActions } from '../stores/animationStore';
import CrtDisplay from './CrtDisplay.tsx';
import TypewriterSequence from './TypewriterSequence.tsx';

const bootSentences: string[] = [
  "", // Start with a blank line for the "warm-up"
  "BOOT SEQUENCE INITIATED",
  "PERFORMING SYSTEM CHECKS... UPDATE REQUIRED",
  "SYSTEM REBOOT INITIATED"
];

const Intro: React.FC = () => {
  // Use nanostores to determine visibility instead of local state
  const shouldShowIntro = useStore($shouldShowIntro);
  const [isPoweredOn, setIsPoweredOn] = useState(true);

  const handleSequenceComplete = () => {
    setTimeout(() => {
      setIsPoweredOn(false);
      setTimeout(() => {
        setIsPoweredOn(true);
        setTimeout(() => {
          // Use store action instead of local state
          animationActions.startAnimations();
        }, 500);
      }, 200);
    }, 1000);
  };

  const handleSkipClick = () => {
    const params = new URLSearchParams(window.location.search);
    params.set('intro', 'false');
    window.history.pushState({}, '', `${window.location.pathname}?${params.toString()}`);
    // Use store action instead of local state and events
    animationActions.skipAnimations();
  };

  // Remove the old URL parameter checking - now handled by the store
  // Remove the old event dispatching - now handled by store actions

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleSkipClick(); // Use the same skip logic as clicking skip button
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  if (!shouldShowIntro) {
    return null;
  }

  return (
    <CrtDisplay isPoweredUp={isPoweredOn}>
      <button
        onClick={handleSkipClick}
        className="fixed top-8 right-10 z-50 font-console text-green-500/50 hover:text-foreground/100 focus:text-green-500/100 transition-colors duration-300 cursor-pointer"
      >
        &gt; SKIP INTRO (ESC)
      </button>
      <div className="flex items-center justify-center h-screen font-console uppercase text-green-500">
        <TypewriterSequence
          sentences={bootSentences}
          defaultTypingSpeed={40}
          onSequenceComplete={handleSequenceComplete}
        />
      </div>
    </CrtDisplay>
  );
};

export default Intro;
