import { useEffect, useRef, useState } from "react";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import { TOUR_STEPS } from "@/Config/TourSteps";

export default function useTourGuide({ 
    menuData, 
    selectedArea, 
    lastExpandedNode, 
    isDesktopSidebarOpen, 
    setIsDesktopSidebarOpen,
}) {
    const driverObj = useRef(null);
    const [tourActive, setTourActive] = useState(false);
    const [activeStepId, setActiveStepId] = useState(null); 
    
    // Track explicit completion of current step
    const stepCompleteRef = useRef(false);

    const [targets, setTargets] = useState({ parentId: null, childId: null });

    // 1. FIND TARGETS
    useEffect(() => {
        if (!menuData || menuData.length === 0) return;

        let foundParentId = null;
        let foundChildId = null;

        if (menuData[0]) {
            foundParentId = menuData[0].id;
            for (const root of menuData) {
                if (root.children) {
                    for (const child of root.children) {
                        if (child) {
                             foundChildId = child.id; 
                             break;
                        }
                    }
                }
                if (foundChildId) break;
            }
        }
        setTargets({ parentId: foundParentId, childId: foundChildId });
    }, [menuData]);

    // --- HELPER: Visuals Only ---
    const updateNextBtnVisuals = (disabled) => {
        setTimeout(() => {
            const nextBtn = document.querySelector('.driver-popover-next-btn');
            if (nextBtn) {
                if (disabled) {
                    nextBtn.style.opacity = '0.4';
                    nextBtn.style.cursor = 'not-allowed';
                    nextBtn.innerText = 'Lakukan aksi...';
                } else {
                    nextBtn.style.opacity = '1';
                    nextBtn.style.cursor = 'pointer';
                    nextBtn.innerText = 'Lanjut →';
                }
            }
        }, 50);
    };

    // 2. INITIALIZE DRIVER
    useEffect(() => {
        if (!targets.parentId) return;

        const dynamicSteps = TOUR_STEPS.map(step => {
            // ... (Same mapping logic) ...
            if (step.id === 'step_expand_tree') {
                return { ...step, element: `#sidebar-arrow-${targets.parentId}` };
            }
            if (step.id === 'step_pick_area') {
                return { ...step, element: `#sidebar-item-${targets.parentId}` };
            }
            if (step.id === 'step_pick_child') {
                 return { ...step, element: targets.childId ? `#sidebar-item-${targets.childId}` : '#sidebar-tree' };
            }
            return step;
        });

        const activeSteps = dynamicSteps.filter(s => true);

        driverObj.current = driver({
            showProgress: true,
            animate: true,
            allowClose: true,
            overlayOpacity: 0.6,
            nextBtnText: 'Lanjut →',
            prevBtnText: '← Kembali',
            doneBtnText: 'Selesai',
            steps: activeSteps,
            
            // LOGIC BLOCKER
            onNextClick: (element, step) => {
                // Check if current step requires interaction
                const configStep = TOUR_STEPS.find(s => s.id === step.id);
                if (configStep && configStep.interaction) {
                    if (!stepCompleteRef.current) {
                        // BLOCK MOVEMENT if interaction not done
                        return; 
                    }
                }
                
                // Allow movement via global instance
                if (driverObj.current) {
                    driverObj.current.moveNext();
                }
            },

            onHighlightStarted: (element, step) => {
                if (step && step.id) {
                    setActiveStepId(step.id);
                    
                    const configStep = TOUR_STEPS.find(s => s.id === step.id); 
                    if (configStep && configStep.interaction) {
                        // Reset completion status for new interactive step
                        stepCompleteRef.current = false;
                        updateNextBtnVisuals(true); // Visually Disable
                    } else {
                        // Non-interactive steps are always complete
                        stepCompleteRef.current = true;
                        updateNextBtnVisuals(false);
                    }
                }
            },
            onDestroyed: () => {
                setTourActive(false);
                setActiveStepId(null);
                localStorage.setItem("tour_completed_v4", "true");
            }
        });



        // Cleanup on unmount
        return () => {
            if (driverObj.current) {
                driverObj.current.destroy();
            }
        };

    }, [targets, menuData]); 

    // 3. REACTIVE LISTENERS (Unlock Only)
    useEffect(() => {
        if (!tourActive || !driverObj.current) return;
        
        const unlockStep = () => {
            stepCompleteRef.current = true;
            updateNextBtnVisuals(false); // Visually Enable
        };

        // LOGIC A: SELECTION (Step 1)
        if (activeStepId === 'step_pick_area') {
             if (selectedArea && selectedArea.id === targets.parentId) {
                 unlockStep();
             }
        }

        // LOGIC B: EXPANSION (Step 2)
        if (activeStepId === 'step_expand_tree') {
            if (lastExpandedNode === targets.parentId) {
                unlockStep();
            }
        }

        // LOGIC C: CHILD SELECTION (Step 3)
        if (activeStepId === 'step_pick_child') {
             if (selectedArea && (selectedArea.id === targets.childId || selectedArea.parent_id === targets.parentId)) {
                 unlockStep();
             }
        }

    }, [selectedArea, lastExpandedNode, tourActive, targets, activeStepId]);


    const startTour = () => {
        if (driverObj.current && targets.parentId) {
            setTourActive(true);
            setIsDesktopSidebarOpen(true); 
            driverObj.current.drive();
        }
    };

    return { startTour };
}
