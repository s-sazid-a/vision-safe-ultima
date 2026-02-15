import { useEffect, useState } from "react";
import { motion, useSpring } from "framer-motion";

const MouseFollower = () => {
    const [isHovering, setIsHovering] = useState(false);
    const springConfig = { damping: 25, stiffness: 200 };
    const cursorX = useSpring(0, springConfig);
    const cursorY = useSpring(0, springConfig);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            cursorX.set(e.clientX);
            cursorY.set(e.clientY);
        };

        const handleMouseOver = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (
                target.tagName === "BUTTON" ||
                target.tagName === "A" ||
                target.closest("button") ||
                target.closest("a") ||
                target.dataset.hover === "true"
            ) {
                setIsHovering(true);
            } else {
                setIsHovering(false);
            }
        };

        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseover", handleMouseOver);

        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseover", handleMouseOver);
        };
    }, [cursorX, cursorY]);

    // Hide on mobile/touch devices
    const [isTouchDevice, setIsTouchDevice] = useState(false);
    useEffect(() => {
        setIsTouchDevice("ontouchstart" in window);
    }, []);

    if (isTouchDevice) return null;

    return (
        <>
            {/* Main cursor */}
            <motion.div
                className="fixed top-0 left-0 pointer-events-none z-[9999] mix-blend-difference"
                style={{
                    x: cursorX,
                    y: cursorY,
                }}
            >
                <motion.div
                    animate={{
                        scale: isHovering ? 1.5 : 1,
                    }}
                    transition={{ duration: 0.2 }}
                    className="relative -translate-x-1/2 -translate-y-1/2"
                >
                    {/* Outer ring */}
                    <div className="w-8 h-8 rounded-full border-2 border-primary/50" />

                    {/* Inner dot */}
                    <motion.div
                        animate={{
                            scale: isHovering ? 0 : 1,
                        }}
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-primary"
                    />
                </motion.div>
            </motion.div>

            {/* Trail effect */}
            <motion.div
                className="fixed top-0 left-0 pointer-events-none z-[9998]"
                style={{
                    x: cursorX,
                    y: cursorY,
                }}
            >
                <div className="relative -translate-x-1/2 -translate-y-1/2">
                    <motion.div
                        animate={{
                            scale: isHovering ? 2 : 1,
                            opacity: isHovering ? 0.3 : 0.1,
                        }}
                        transition={{ duration: 0.3 }}
                        className="w-32 h-32 rounded-full"
                        style={{
                            background: `radial-gradient(circle, hsl(var(--primary) / 0.3) 0%, hsl(var(--accent) / 0.1) 50%, transparent 70%)`,
                        }}
                    />
                </div>
            </motion.div>
        </>
    );
};

export default MouseFollower;
