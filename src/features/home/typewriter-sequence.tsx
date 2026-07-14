import { useEffect, useState } from "react";
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
	onSequenceComplete?: () => void;
}

const TypewriterSequence: React.FC<TypewriterSequenceProps> = ({
	sentences,
	defaultTypingSpeed = 60,
	delayBetweenSentences = 300,
	holdDuration = 2500,
	onSequenceComplete,
}) => {
	const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
	const [showTypewriter, setShowTypewriter] = useState(true);

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
		// Keep the current sentence visible for holdDuration
		setTimeout(() => {
			setShowTypewriter(false); // Hide current Typewriter
			setTimeout(() => {
				setCurrentSentenceIndex((prevIndex) => prevIndex + 1);
				setShowTypewriter(true); // Show next Typewriter
			}, delayBetweenSentences);
		}, holdDuration);
	};

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
