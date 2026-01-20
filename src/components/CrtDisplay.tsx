import type { PropsWithChildren } from "react"
import { cn } from "../lib/utils"

type Props = PropsWithChildren<{ isPoweredUp?: boolean }>

const CrtDisplay = ({ children, isPoweredUp: isPoweredOn = true }: Props) => {
        const animationClass = isPoweredOn ? "display-on" : "display-off"
    return (
        <div className={cn("crt fixed inset-0 w-screen h-screen z-30 p-10", animationClass)}>
            {children}
        </div>
    )
}

export default CrtDisplay