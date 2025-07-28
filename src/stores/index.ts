// Nanostores Animation State Management API
// Created by Infrastructure Agent for multi-agent coordination

// Core Store and Types
export {
  $animationStore,
  $currentPhase,
  $isGridAnimating, 
  $shouldShowIntro,
  $shouldSkipAnimations,
  AnimationPhase,
  getAnimationState,
  shouldSkipFromURL,
  type AnimationState
} from './animationStore.js';

// Action Functions
export {
  initializeFromURL,
  startIntroSequence,
  skipIntroSequence,
  completeIntroSequence,
  handleNavigation,
  updateGridFrame,
  resetAnimationState,
  forceStartAnimation,
  getCurrentPhase,
  shouldShowIntro,
  shouldSkipAnimations
} from './animationActions.js';

// Quick Start Guide for Other Agents:
// 
// 1. Import what you need:
//    import { $shouldShowIntro, initializeFromURL, completeIntroSequence } from '@/stores';
//
// 2. In components, subscribe to reactive values:
//    const shouldShow = useStore($shouldShowIntro);
//
// 3. Call actions to update state:
//    initializeFromURL(); // Call this on component mount
//    completeIntroSequence(); // Call when intro animation finishes
//
// 4. Listen for custom events:
//    window.addEventListener('introFinished', handleIntroFinished);
//    window.addEventListener('introSkipped', handleIntroSkipped);
//
// State persists across:
// - Page navigation (view transitions)
// - Browser refresh
// - Tab switching
//
// Key Integration Points:
// - Layout.astro: Call initializeFromURL() on page load
// - Intro.tsx: Subscribe to $shouldShowIntro, call startIntroSequence/completeIntroSequence  
// - PerspectiveGridTunnel.tsx: Subscribe to $isGridAnimating, use updateGridFrame
// - HeroBanner.astro: Listen for custom events, subscribe to $shouldSkipAnimations