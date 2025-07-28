import { persistentMap } from '@nanostores/persistent';
import { computed } from 'nanostores';

// Animation phase enumeration for type safety
export enum AnimationPhase {
  INITIAL = 'initial',
  INTRO_PLAYING = 'intro-playing', 
  INTRO_SKIPPED = 'intro-skipped',
  ANIMATIONS_ACTIVE = 'animations-active',
  NAVIGATING = 'navigating'
}

// Core animation state interface
export interface AnimationState {
  phase: AnimationPhase;
  gridAnimationStarted: boolean;
  introCompleted: boolean;
  isNavigating: boolean;
  hasSkippedIntro: boolean;
  frameCount: number;
  animationFrameId: number | null;
}

// Initial state values
const initialState: AnimationState = {
  phase: AnimationPhase.INITIAL,
  gridAnimationStarted: false,
  introCompleted: false,
  isNavigating: false,
  hasSkippedIntro: false,
  frameCount: 0,
  animationFrameId: null,
};

// Persistent store that survives page navigation and browser refresh
export const $animationStore = persistentMap<AnimationState>(
  'augur-animation-state:', 
  initialState,
  {
    encode: JSON.stringify,
    decode: JSON.parse,
  }
);

// Computed values for convenient access
export const $currentPhase = computed($animationStore, (state) => state.phase);
export const $isGridAnimating = computed($animationStore, (state) => state.gridAnimationStarted);
export const $shouldShowIntro = computed($animationStore, (state) => 
  state.phase === AnimationPhase.INITIAL || state.phase === AnimationPhase.INTRO_PLAYING
);
export const $shouldSkipAnimations = computed($animationStore, (state) => 
  state.phase === AnimationPhase.INTRO_SKIPPED || state.hasSkippedIntro
);

// Helper function to get current state snapshot
export const getAnimationState = (): AnimationState => $animationStore.get();

// Helper function to check if animations should be skipped based on URL
export const shouldSkipFromURL = (): boolean => {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  return params.get('intro') === 'false';
};

// Action functions for state management
export const animationActions = {
  // Initialize state based on URL parameters and current conditions
  initializeFromURL(): void {
    const currentState = getAnimationState();
    const shouldSkip = shouldSkipFromURL();
    
    if (shouldSkip) {
      $animationStore.setKey('phase', AnimationPhase.INTRO_SKIPPED);
      $animationStore.setKey('hasSkippedIntro', true);
      $animationStore.setKey('introCompleted', true);
      $animationStore.setKey('gridAnimationStarted', true);
    } else {
      // For clean homepage visits (no ?intro=false), always show intro
      // Reset to initial state regardless of persistent storage
      $animationStore.setKey('phase', AnimationPhase.INTRO_PLAYING);
      $animationStore.setKey('hasSkippedIntro', false);
      $animationStore.setKey('introCompleted', false);
      $animationStore.setKey('gridAnimationStarted', false);
    }
  },

  // Transition from intro completion to animations
  startAnimations(): void {
    $animationStore.setKey('phase', AnimationPhase.ANIMATIONS_ACTIVE);
    $animationStore.setKey('introCompleted', true);
    $animationStore.setKey('gridAnimationStarted', true);
  },

  // Skip directly to final animation state
  skipAnimations(): void {
    $animationStore.setKey('phase', AnimationPhase.INTRO_SKIPPED);
    $animationStore.setKey('hasSkippedIntro', true);
    $animationStore.setKey('introCompleted', true);
    $animationStore.setKey('gridAnimationStarted', true);
  },

  // Handle view transition events
  handleNavigation(): void {
    const wasNavigating = getAnimationState().isNavigating;
    $animationStore.setKey('isNavigating', false);
    
    // Re-evaluate state based on current URL after navigation
    this.initializeFromURL();
  },

  // Mark navigation start
  startNavigation(): void {
    $animationStore.setKey('isNavigating', true);
    $animationStore.setKey('phase', AnimationPhase.NAVIGATING);
  },

  // Update grid animation frame data
  updateGridFrame(frameCount: number, animationFrameId: number | null): void {
    $animationStore.setKey('frameCount', frameCount);
    $animationStore.setKey('animationFrameId', animationFrameId);
  },

  // Reset to initial state (for development/testing)
  reset(): void {
    $animationStore.set(initialState);
  }
};