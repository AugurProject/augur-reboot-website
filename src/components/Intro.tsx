
import { useState, useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { $appStore, UIState, appActions } from '../stores/animationStore';
import CrtDisplay from './CrtDisplay';
import TypewriterSequence from './TypewriterSequence';
import Button from './Button';
import Pointer from './Pointer';

const bootSentences: string[] = [
  "", // Start with a blank line for the "warm-up"
  "RESEARCH AND DEVELOPMENT HAS RETURNED TO ETHEREUM'S FIRST ICO",
  "PERFORMING SYSTEM CHECKS... UPDATE REQUIRED",
  "AUGUR REBOOT BEGINS"
];

const Intro: React.FC = () => {
  const appState = useStore($appStore);
  const [isPoweredOn, setIsPoweredOn] = useState(true);

  const handleSequenceComplete = () => {
    setTimeout(() => {
      setIsPoweredOn(false);
      setTimeout(() => {
        setIsPoweredOn(true);
        setTimeout(() => {
          appActions.completeBootSequence();
        }, 500);
      }, 200);
    }, 1000);
  };

  const handleSkipClick = () => {
    appActions.skipToMainContent();
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleSkipClick();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Only render when in boot sequence state
  if (appState.uiState !== UIState.BOOT_SEQUENCE) {
    return null;
  }

  return (
    <CrtDisplay isPoweredUp={isPoweredOn}>
      <Button
        onClick={handleSkipClick}
        variant="link"
        size="lg"
        className="fixed top-8 right-10 z-50 text-muted-foreground hover:no-underline"
      >
        <Pointer animated="auto" direction="right" />
        SKIP INTRO (ESC)
      </Button>
      <div className="flex items-center justify-center h-screen uppercase text-foreground text-2xl">
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
