// GestureUtils.js
export const detectPinchGesture = (landmarks) => {
    const thumbTip = landmarks[4];
    const indexTip = landmarks[8];
    
    // Calculate distance between thumb and index finger
    const distance = Math.sqrt(
      Math.pow(thumbTip.x - indexTip.x, 2) + 
      Math.pow(thumbTip.y - indexTip.y, 2)
    );
    
    // Return true if fingers are close enough (pinching)
    return distance < 0.1;
  };
  
  export const detectSwipeGesture = (currentY, lastY) => {
    const threshold = 0.03; // Minimum movement to trigger swipe
    
    if (Math.abs(currentY - lastY) < threshold) {
      return null;
    }
    
    return currentY < lastY ? 'up' : 'down';
  };