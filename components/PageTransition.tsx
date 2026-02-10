import React from 'react';
import { motion } from 'framer-motion';

interface PageTransitionProps {
    children: React.ReactNode;
    className?: string;
}

export const PageTransition: React.FC<PageTransitionProps> = ({ children, className = '' }) => {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.98, filter: 'blur(4px)' }}
            animate={{
                opacity: 1,
                scale: 1,
                filter: 'blur(0px)',
                transition: {
                    duration: 0.4,
                    ease: [0.22, 1, 0.36, 1] 
                }
            }}
            exit={{
                opacity: 0,
                scale: 1.02,
                filter: 'blur(2px)',
                transition: {
                    duration: 0.3,
                    ease: 'easeInOut'
                }
            }}
            className={`w-full h-full ${className}`}
        >
            {children}
        </motion.div>
    );
};
