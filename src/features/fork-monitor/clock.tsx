import {
	createContext,
	useContext,
	useEffect,
	useState,
	type ReactNode,
} from "react";

const ForkClockContext = createContext<number | null>(null);

export const useForkClock = (): number => {
	const now = useContext(ForkClockContext);
	return now ?? Date.now();
};

export const ForkClockProvider = ({ children }: { children: ReactNode }) => {
	const [now, setNow] = useState<number>(() => Date.now());

	useEffect(() => {
		const id = setInterval(() => setNow(Date.now()), 1000);
		return () => clearInterval(id);
	}, []);

	return (
		<ForkClockContext.Provider value={now}>
			{children}
		</ForkClockContext.Provider>
	);
};
