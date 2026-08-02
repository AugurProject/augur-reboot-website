import { useEffect, useRef, useState } from "react";
import Typewriter from "./typewriter";

interface Segment {
	value: string;
	speed?: number;
}

interface TypewriterSequenceProps {
	sentences: string[];
	defaultTypingSpeed?: number;
	delayBetweenSentences?: number;
	holdDuration?: number;
	loop?: boolean;
	onSequenceComplete?: () => void;
}

const TypewriterSequence: React.FC<TypewriterSequenceProps> = ({
	sentences,
	defaultTypingSpeed = 60,
	delayBetweenSentences = 300,
	holdDuration = 2500,
	loop = false,
	onSequenceComplete,
}) => {
	const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
	const [showTypewriter, setShowTypewriter] = useState(true);
	const transitionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
		null,
	);
	const nextSentenceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
		null,
	);

	const getSegmentsForSentence = (sentence: string): Segment[] => {
		const parts = sentence.split(/(\.\.\.)/);
		if (parts.length > 1) {
			return parts
				.filter((part) => part)
				.map((part) => {
					if (part === "...") {
						return { value: part, speed: defaultTypingSpeed * 12 };
					}
					return { value: part, speed: defaultTypingSpeed };
				});
		}
		return [{ value: sentence, speed: defaultTypingSpeed }];
	};

	const handleComplete = () => {
		if (transitionTimeoutRef.current !== null) return;

		// Keep the current sentence visible for holdDuration
		transitionTimeoutRef.current = setTimeout(() => {
			transitionTimeoutRef.current = null;
			setShowTypewriter(false); // Hide current Typewriter
			nextSentenceTimeoutRef.current = setTimeout(() => {
				nextSentenceTimeoutRef.current = null;
				setCurrentSentenceIndex((prevIndex) => {
					const nextIndex = prevIndex + 1;
					return loop && nextIndex >= sentences.length ? 0 : nextIndex;
				});
				setShowTypewriter(true); // Show next Typewriter
			}, delayBetweenSentences);
		}, holdDuration);
	};

	useEffect(() => {
		return () => {
			if (transitionTimeoutRef.current !== null) {
				clearTimeout(transitionTimeoutRef.current);
			}
			if (nextSentenceTimeoutRef.current !== null) {
				clearTimeout(nextSentenceTimeoutRef.current);
			}
		};
	}, []);

	useEffect(() => {
		if (currentSentenceIndex >= sentences.length) {
			if (onSequenceComplete) {
				onSequenceComplete();
			}
		}
	}, [currentSentenceIndex, sentences.length, onSequenceComplete]);

	if (currentSentenceIndex >= sentences.length) {
		return null; // All sentences typed
	}

	return (
		<span className="uppercase">
			{showTypewriter && (
				<Typewriter
					segments={getSegmentsForSentence(sentences[currentSentenceIndex])}
					defaultTypingSpeed={defaultTypingSpeed}
					onComplete={handleComplete}
				/>
			)}
		</span>
	);
};

export default TypewriterSequence;
