
import { useState, useEffect } from 'react';
import CrtDisplay from './CrtDisplay.tsx';
import TypewriterSequence from './TypewriterSequence.tsx';

const bootSentences: string[] = [
  "", // Start with a blank line for the "warm-up"
  "BOOT SEQUENCE INITIATED",
  "PERFORMING SYSTEM CHECKS... UPDATE REQUIRED",
  "SYSTEM REBOOT INITIATED"
];

const Intro: React.FC = () => {
  const [isVisible, setIsVisible] = useState(() => {
    // Check URL params immediately on initialization
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('intro') !== 'false';
    }
    return true;
  });
  const [isPoweredOn, setIsPoweredOn] = useState(true);

  const handleSequenceComplete = () => {
    setTimeout(() => {
      setIsPoweredOn(false);
      setTimeout(() => {
        setIsPoweredOn(true);
        setTimeout(() => {
          setIsVisible(false);
        }, 500);
      }, 200);
    }, 1000);
  };

  const handleSkip = () => {
    setIsVisible(false);
  };

  const handleSkipClick = () => {
    const params = new URLSearchParams(window.location.search);
    params.set('intro', 'false');
    window.history.pushState({}, '', `${window.location.pathname}?${params.toString()}`);
    handleSkip();
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('intro') === 'false') {
      handleSkip();
      // Ensure the event is dispatched immediately for view transitions
      document.dispatchEvent(new CustomEvent('introFinished'));
    }
  }, []);

  useEffect(() => {
    if (!isVisible) {
      document.dispatchEvent(new CustomEvent('introFinished'));
    }
  }, [isVisible]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleSkip();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleSkip]);

  if (!isVisible) {
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
