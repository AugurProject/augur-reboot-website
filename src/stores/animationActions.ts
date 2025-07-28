import { 
  $animationStore, 
  AnimationPhase, 
  type AnimationState,
  shouldSkipFromURL 
} from './animationStore.js';

// Initialize animation state based on URL parameters and current context
export const initializeFromURL = (): void => {
  const shouldSkip = shouldSkipFromURL();
  const currentState = $animationStore.get();
  
  if (shouldSkip) {
    // Skip intro and show final state immediately
    $animationStore.setKey('phase', AnimationPhase.INTRO_SKIPPED);
    $animationStore.setKey('hasSkippedIntro', true);
    $animationStore.setKey('introCompleted', true);
    $animationStore.setKey('gridAnimationStarted', true);
  } else if (currentState.phase === AnimationPhase.INITIAL) {
    // Fresh start - prepare for intro sequence
    $animationStore.setKey('phase', AnimationPhase.INITIAL);
    $animationStore.setKey('hasSkippedIntro', false);
    $animationStore.setKey('introCompleted', false);
    $animationStore.setKey('gridAnimationStarted', false);
  }
  // If we're in other phases, maintain current state
};

// Start the intro sequence animation
export const startIntroSequence = (): void => {
  const currentState = $animationStore.get();
  
  // Only start if we're in initial phase and haven't skipped
  if (currentState.phase === AnimationPhase.INITIAL && !currentState.hasSkippedIntro) {
    $animationStore.setKey('phase', AnimationPhase.INTRO_PLAYING);
  }
};

// Skip intro sequence and jump to final animation state
export const skipIntroSequence = (): void => {
  $animationStore.setKey('phase', AnimationPhase.INTRO_SKIPPED);
  $animationStore.setKey('hasSkippedIntro', true);
  $animationStore.setKey('introCompleted', true);
  $animationStore.setKey('gridAnimationStarted', true);
  
  // Dispatch custom event for components to react
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('introSkipped'));
  }
};

// Complete intro sequence and transition to active animations
export const completeIntroSequence = (): void => {
  const currentState = $animationStore.get();
  
  // Only complete if intro was playing
  if (currentState.phase === AnimationPhase.INTRO_PLAYING) {
    $animationStore.setKey('phase', AnimationPhase.ANIMATIONS_ACTIVE);
    $animationStore.setKey('introCompleted', true);
    $animationStore.setKey('gridAnimationStarted', true);
    
    // Dispatch custom event for components to react
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('introFinished'));
    }
  }
};

// Handle navigation state during view transitions
export const handleNavigation = (isNavigating: boolean): void => {
  $animationStore.setKey('isNavigating', isNavigating);
  
  if (isNavigating) {
    $animationStore.setKey('phase', AnimationPhase.NAVIGATING);
  } else {
    // Restore appropriate phase after navigation
    const currentState = $animationStore.get();
    if (currentState.introCompleted || currentState.hasSkippedIntro) {
      $animationStore.setKey('phase', AnimationPhase.ANIMATIONS_ACTIVE);
    } else {
      $animationStore.setKey('phase', AnimationPhase.INITIAL);
    }
  }
};

// Update grid animation frame tracking
export const updateGridFrame = (frameCount: number, animationFrameId: number | null): void => {
  $animationStore.setKey('frameCount', frameCount);
  $animationStore.setKey('animationFrameId', animationFrameId);
};

// Reset animation state (useful for development/testing)
export const resetAnimationState = (): void => {
  $animationStore.set({
    phase: AnimationPhase.INITIAL,
    gridAnimationStarted: false,
    introCompleted: false,
    isNavigating: false,
    hasSkippedIntro: false,
    frameCount: 0,
    animationFrameId: null,
  });
};

// Force animation start (useful for components that need to ensure animation is running)
export const forceStartAnimation = (): void => {
  $animationStore.setKey('gridAnimationStarted', true);
  $animationStore.setKey('introCompleted', true);
  
  const currentState = $animationStore.get();
  if (currentState.phase === AnimationPhase.INITIAL) {
    $animationStore.setKey('phase', AnimationPhase.ANIMATIONS_ACTIVE);
  }
};

// Get current animation phase for external checks
export const getCurrentPhase = (): AnimationPhase => {
  return $animationStore.get().phase;
};

// Check if intro should be visible based on current state
export const shouldShowIntro = (): boolean => {
  const state = $animationStore.get();
  return state.phase === AnimationPhase.INITIAL || state.phase === AnimationPhase.INTRO_PLAYING;
};

// Check if animations should be in skipped state
export const shouldSkipAnimations = (): boolean => {
  const state = $animationStore.get();
  return state.phase === AnimationPhase.INTRO_SKIPPED || state.hasSkippedIntro;
};