
import React, { useState, useEffect, useRef } from 'react';

interface Segment {
  value: string;
  speed?: number;
}

interface TypewriterProps {
  segments: Segment[];
  defaultTypingSpeed?: number;
  onComplete?: () => void;
}

const Typewriter: React.FC<TypewriterProps> = ({ segments, defaultTypingSpeed = 60, onComplete }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);
  const [currentCharIndex, setCurrentCharIndex] = useState(0);
  const cursorRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (currentSegmentIndex < segments.length) {
      const currentSegment = segments[currentSegmentIndex];
      const segmentText = currentSegment.value;
      const segmentSpeed = currentSegment.speed || defaultTypingSpeed;

      if (currentCharIndex < segmentText.length) {
        const typingTimer = setTimeout(() => {
          setDisplayedText(prev => prev + segmentText[currentCharIndex]);
          setCurrentCharIndex(prev => prev + 1);
        }, segmentSpeed);
        return () => clearTimeout(typingTimer);
      } else {
        // Current segment finished, move to next
        setCurrentSegmentIndex(prev => prev + 1);
        setCurrentCharIndex(0); // Reset char index for next segment
      }
    } else {
      // All segments typed, activate blinking and call onComplete
      if (cursorRef.current) {
        cursorRef.current.classList.add('blink-active');
      }
      if (onComplete) {
        onComplete();
      }
    }
  }, [currentSegmentIndex, currentCharIndex, segments, defaultTypingSpeed, onComplete]);

  return (
    <span className="typewriter-text font-display">
      {displayedText}
      <span ref={cursorRef} className="cursor">
        █
      </span>
    </span>
  );
};

export default Typewriter;
