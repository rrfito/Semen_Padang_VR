/**
 * useEditorTourGuide Hook
 * Manages the Visual Editor onboarding tour using driver.js
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import { TOUR_FLOWS, TOUR_STORAGE_KEYS } from "@/Config/EditorTourSteps";

export default function useEditorTourGuide({
    // Current state from VisualEditor
    currentView = null, // 'welcome' | 'area' | 'scene' | 'sceneContainer'
    selectedArea = null,
    selectedScene = null,
    isModalOpen = false, // Any modal is open
}) {
    const driverObj = useRef(null);
    const [tourActive, setTourActive] = useState(false);
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const interactiveListenerRef = useRef(null);

    // Check if tour should auto-start
    const shouldAutoStart = useCallback(() => {
        const completed = localStorage.getItem(TOUR_STORAGE_KEYS.EDITOR_TOUR_COMPLETED);
        return completed !== "true";
    }, []);

    // Convert step config to driver.js format
    const convertToDriverStep = useCallback((step, index) => {
        const stepConfig = TOUR_FLOWS.FULL_ONBOARDING[index];
        return {
            element: step.target,
            popover: {
                title: step.title,
                description: step.description,
                side: step.position || "bottom",
                align: "center",
                // For interactive steps: hide Next button, show only Previous and Close
                showButtons: stepConfig?.isInteractive 
                    ? ["previous", "close"] 
                    : ["next", "previous", "close"],
                nextBtnText: "Lanjut",
                prevBtnText: "Kembali",
                doneBtnText: "Selesai",
            },
        };
    }, []);

    // Setup click/input listener for interactive steps
    const setupInteractiveListener = useCallback((stepConfig, stepIndex) => {
        // Clear any existing listener
        if (interactiveListenerRef.current) {
            if (interactiveListenerRef.current.type === "click") {
                document.removeEventListener("click", interactiveListenerRef.current.handler, true);
            } else if (interactiveListenerRef.current.type === "input") {
                const inputEl = document.querySelector(interactiveListenerRef.current.selector);
                if (inputEl) {
                    inputEl.removeEventListener("input", interactiveListenerRef.current.handler);
                }
            }
            interactiveListenerRef.current = null;
        }

        if (!stepConfig?.isInteractive || !stepConfig?.interactionTarget) {
            return;
        }

        const targetSelector = stepConfig.interactionTarget;

        // For input fields that need to be filled
        if (stepConfig.waitForInput) {
            const inputEl = document.querySelector(targetSelector);
            if (!inputEl) return;

            // Function to show/enable the Next button
            const showNextButton = () => {
                const popover = document.querySelector(".driver-popover");
                if (!popover) return;

                // Check if Next button exists, if not create it
                let nextBtn = popover.querySelector(".driver-popover-next-btn");
                if (!nextBtn) {
                    const footer = popover.querySelector(".driver-popover-footer");
                    if (footer) {
                        nextBtn = document.createElement("button");
                        nextBtn.className = "driver-popover-next-btn";
                        nextBtn.textContent = "Lanjut";
                        nextBtn.onclick = () => {
                            if (driverObj.current) {
                                driverObj.current.moveNext();
                            }
                        };
                        footer.appendChild(nextBtn);
                    }
                } else {
                    // Show existing button
                    nextBtn.style.display = "";
                }
            };

            // Function to hide the Next button
            const hideNextButton = () => {
                const nextBtn = document.querySelector(".driver-popover-next-btn");
                if (nextBtn) {
                    nextBtn.style.display = "none";
                }
            };

            // Check if already has value - show Next button
            if (inputEl.value && inputEl.value.trim().length > 0) {
                setTimeout(showNextButton, 100);
                return;
            }

            // Initially hide Next button
            setTimeout(hideNextButton, 100);

            // Listen for input changes
            const handleInput = (e) => {
                const value = e.target.value;
                if (value && value.trim().length > 0) {
                    // User entered text - show Next button
                    showNextButton();
                } else {
                    // Input is empty - hide Next button
                    hideNextButton();
                }
            };

            interactiveListenerRef.current = { type: "input", handler: handleInput, selector: targetSelector };
            inputEl.addEventListener("input", handleInput);
            return;
        }

        // For click-based interactions
        const handleClick = (e) => {
            const target = e.target;
            const clickedElement = target.closest(targetSelector);

            if (clickedElement) {
                // User clicked the target element - advance tour after a delay
                setTimeout(() => {
                    if (driverObj.current) {
                        driverObj.current.moveNext();
                    }
                }, 300);

                // Remove listener
                document.removeEventListener("click", handleClick, true);
                interactiveListenerRef.current = null;
            }
        };

        // Add listener
        interactiveListenerRef.current = { type: "click", handler: handleClick, selector: targetSelector };
        document.addEventListener("click", handleClick, true);
    }, []);

    // Initialize driver.js
    useEffect(() => {
        // Don't initialize if tour is paused or not active
        if (!tourActive) return;

        const steps = TOUR_FLOWS.FULL_ONBOARDING.map((step, index) => convertToDriverStep(step, index));

        driverObj.current = driver({
            showProgress: true,
            progressText: "{{current}} dari {{total}}",
            nextBtnText: "Lanjut",
            prevBtnText: "Kembali",
            doneBtnText: "Selesai",
            animate: true,
            smoothScroll: true,
            stagePadding: 10,
            stageRadius: 8,
            popoverClass: "editor-tour-popover",
            overlayColor: "rgba(0, 0, 0, 0.6)",
            allowClose: true,
            disableActiveInteraction: false, // Allow clicking highlighted elements

            steps: steps,

            onDestroyed: () => {
                // Clean up listener
                if (interactiveListenerRef.current) {
                    if (interactiveListenerRef.current.type === "click") {
                        document.removeEventListener("click", interactiveListenerRef.current.handler, true);
                    } else if (interactiveListenerRef.current.type === "input") {
                        const inputEl = document.querySelector(interactiveListenerRef.current.selector);
                        if (inputEl) {
                            inputEl.removeEventListener("input", interactiveListenerRef.current.handler);
                        }
                    }
                    interactiveListenerRef.current = null;
                }
                setTourActive(false);
                setCurrentStepIndex(0);
            },

            onCloseClick: () => {
                // Mark as completed
                localStorage.setItem(TOUR_STORAGE_KEYS.EDITOR_TOUR_COMPLETED, "true");
                driverObj.current?.destroy();
            },

            onHighlightStarted: (element, step, options) => {
                const stepIndex = options.state.activeIndex;
                const stepConfig = TOUR_FLOWS.FULL_ONBOARDING[stepIndex];
                setCurrentStepIndex(stepIndex);

                // Setup listener for interactive steps
                if (stepConfig?.isInteractive) {
                    setupInteractiveListener(stepConfig, stepIndex);
                }
            },

            onDeselected: () => {
                // Clean up any interactive listener when moving away
                if (interactiveListenerRef.current) {
                    if (interactiveListenerRef.current.type === "click") {
                        document.removeEventListener("click", interactiveListenerRef.current.handler, true);
                    } else if (interactiveListenerRef.current.type === "input") {
                        const inputEl = document.querySelector(interactiveListenerRef.current.selector);
                        if (inputEl) {
                            inputEl.removeEventListener("input", interactiveListenerRef.current.handler);
                        }
                    }
                    interactiveListenerRef.current = null;
                }
            },
        });

        // Start the tour
        driverObj.current.drive();

        // Cleanup
        return () => {
            if (interactiveListenerRef.current) {
                if (interactiveListenerRef.current.type === "click") {
                    document.removeEventListener("click", interactiveListenerRef.current.handler, true);
                } else if (interactiveListenerRef.current.type === "input") {
                    const inputEl = document.querySelector(interactiveListenerRef.current.selector);
                    if (inputEl) {
                        inputEl.removeEventListener("input", interactiveListenerRef.current.handler);
                    }
                }
                interactiveListenerRef.current = null;
            }
            if (driverObj.current) {
                driverObj.current.destroy();
            }
        };
    }, [tourActive, convertToDriverStep, setupInteractiveListener]);

    // Start tour function
    const startTour = useCallback(() => {
        setTourActive(true);
        setIsPaused(false);
        localStorage.removeItem(TOUR_STORAGE_KEYS.EDITOR_TOUR_PAUSED);
    }, []);

    // Pause tour function
    const pauseTour = useCallback(() => {
        if (driverObj.current) {
            localStorage.setItem(TOUR_STORAGE_KEYS.EDITOR_TOUR_STEP, currentStepIndex.toString());
            localStorage.setItem(TOUR_STORAGE_KEYS.EDITOR_TOUR_PAUSED, "true");
            driverObj.current.destroy();
            setIsPaused(true);
        }
    }, [currentStepIndex]);

    // Resume tour function
    const resumeTour = useCallback(() => {
        const savedStep = localStorage.getItem(TOUR_STORAGE_KEYS.EDITOR_TOUR_STEP);
        if (savedStep) {
            setCurrentStepIndex(parseInt(savedStep, 10));
        }
        setTourActive(true);
        setIsPaused(false);
        localStorage.removeItem(TOUR_STORAGE_KEYS.EDITOR_TOUR_PAUSED);
    }, []);

    // Complete current interactive step (can be called manually)
    const completeInteractiveStep = useCallback(() => {
        if (driverObj.current) {
            setTimeout(() => {
                driverObj.current?.moveNext();
            }, 300);
        }
    }, []);

    // Move to specific step
    const goToStep = useCallback((stepIndex) => {
        if (driverObj.current) {
            driverObj.current.drive(stepIndex);
            setCurrentStepIndex(stepIndex);
        }
    }, []);

    // Reset tour
    const resetTour = useCallback(() => {
        localStorage.removeItem(TOUR_STORAGE_KEYS.EDITOR_TOUR_COMPLETED);
        localStorage.removeItem(TOUR_STORAGE_KEYS.EDITOR_TOUR_STEP);
        localStorage.removeItem(TOUR_STORAGE_KEYS.EDITOR_TOUR_PAUSED);
        setCurrentStepIndex(0);
        setIsPaused(false);
    }, []);

    // Don't auto-start - user must click "Ayo Mulai" button
    // (Removed auto-start effect)

    return {
        tourActive,
        isPaused,
        currentStepIndex,
        startTour,
        pauseTour,
        resumeTour,
        completeInteractiveStep,
        goToStep,
        resetTour,
        shouldAutoStart: shouldAutoStart(),
    };
}
