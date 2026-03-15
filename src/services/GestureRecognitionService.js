/**
 * GestureRecognitionService.js
 * Gesture recognition and body language tracking for the AI companion
 */

export class GestureRecognitionService {
    constructor() {
        this.isTracking = false;
        this.videoElement = null;
        this.canvasElement = null;
        this.ctx = null;
        this.gestureHistory = [];
        this.bodyLandmarks = null;
        this.handLandmarks = null;
        this.faceLandmarks = null;
        
        // Gesture models
        this.models = {
            pose: null,
            hands: null,
            face: null
        };
        
        // Gesture definitions
        this.gestures = {
            // Hand gestures
            wave: { name: 'Wave', confidence: 0.7, duration: 500 },
            thumbsUp: { name: 'Thumbs Up', confidence: 0.8, duration: 300 },
            peace: { name: 'Peace Sign', confidence: 0.7, duration: 400 },
            point: { name: 'Pointing', confidence: 0.6, duration: 200 },
            grab: { name: 'Grabbing', confidence: 0.7, duration: 300 },
            
            // Body gestures
            waveBody: { name: 'Body Wave', confidence: 0.6, duration: 800 },
            nod: { name: 'Nodding', confidence: 0.7, duration: 400 },
            shake: { name: 'Head Shake', confidence: 0.7, duration: 400 },
            shrug: { name: 'Shrugging', confidence: 0.6, duration: 600 },
            crossArms: { name: 'Crossed Arms', confidence: 0.7, duration: 500 },
            
            // Face gestures
            smile: { name: 'Smiling', confidence: 0.6, duration: 300 },
            frown: { name: 'Frowning', confidence: 0.6, duration: 300 },
            surprise: { name: 'Surprised', confidence: 0.7, duration: 400 },
            wink: { name: 'Winking', confidence: 0.8, duration: 200 },
            
            // Complex gestures
            hello: { name: 'Hello Wave', confidence: 0.7, duration: 1000 },
            goodbye: { name: 'Goodbye Wave', confidence: 0.7, duration: 1000 },
            thinking: { name: 'Thinking Pose', confidence: 0.6, duration: 800 },
            listening: { name: 'Listening Pose', confidence: 0.6, duration: 500 }
        };
        
        // Body language patterns
        this.bodyLanguagePatterns = {
            open: { indicators: ['arms_uncrossed', 'upright_posture', 'eye_contact'], confidence: 0.6 },
            closed: { indicators: ['arms_crossed', 'slumped_posture', 'avoiding_eye'], confidence: 0.6 },
            engaged: { indicators: ['leaning_forward', 'nodding', 'eye_contact'], confidence: 0.7 },
            distracted: { indicators: ['looking_away', 'fidgeting', 'slumped_posture'], confidence: 0.6 },
            confident: { indicators: ['upright_posture', 'open_gestures', 'steady_gaze'], confidence: 0.7 },
            nervous: { indicators: ['fidgeting', 'avoiding_eye', 'closed_posture'], confidence: 0.6 }
        };
        
        // Current state
        this.currentState = {
            gesture: null,
            bodyLanguage: 'neutral',
            confidence: 0,
            emotion: 'neutral',
            attention: 'focused'
        };
        
        // Initialize
        this.initializeGestureRecognition();
    }
    
    /**
     * Initialize gesture recognition
     */
    async initializeGestureRecognition() {
        try {
            // Check for camera support
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                console.warn('[GestureRecognitionService] Camera not supported');
                return;
            }
            
            // Initialize models (in production, you'd load actual ML models)
            await this.initializeModels();
            
            console.log('[GestureRecognitionService] ✓ Gesture recognition initialized');
        } catch (error) {
            console.error('[GestureRecognitionService] Failed to initialize:', error);
        }
    }
    
    /**
     * Initialize ML models
     */
    async initializeModels() {
        try {
            // In production, you'd load actual models like:
            // - MediaPipe Pose for body tracking
            // - MediaPipe Hands for hand tracking
            // - MediaPipe Face Mesh for facial expressions
            
            console.log('[GestureRecognitionService] ✓ Models initialized (mock)');
        } catch (error) {
            console.error('[GestureRecognitionService] Failed to initialize models:', error);
        }
    }
    
    /**
     * Start gesture tracking
     */
    async startTracking(videoElement, canvasElement) {
        try {
            if (this.isTracking) {
                throw new Error('Gesture tracking already active');
            }
            
            this.videoElement = videoElement;
            this.canvasElement = canvasElement;
            this.ctx = canvasElement.getContext('2d');
            
            // Get camera stream
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    facingMode: 'user'
                },
                audio: false
            });
            
            // Set video source
            this.videoElement.srcObject = stream;
            
            // Wait for video to load
            await new Promise(resolve => {
                this.videoElement.onloadedmetadata = resolve;
            });
            
            this.videoElement.play();
            
            // Start detection loop
            this.isTracking = true;
            this.startDetectionLoop();
            
            console.log('[GestureRecognitionService] ✓ Gesture tracking started');
            
            return {
                stream: stream,
                videoElement: this.videoElement,
                canvasElement: this.canvasElement
            };
        } catch (error) {
            console.error('[GestureRecognitionService] Failed to start tracking:', error);
            throw error;
        }
    }
    
    /**
     * Stop gesture tracking
     */
    async stopTracking() {
        if (!this.isTracking) {
            return;
        }
        
        try {
            this.isTracking = false;
            
            // Stop video stream
            if (this.videoElement && this.videoElement.srcObject) {
                const stream = this.videoElement.srcObject;
                stream.getTracks().forEach(track => track.stop());
                this.videoElement.srcObject = null;
            }
            
            // Clear canvas
            if (this.ctx && this.canvasElement) {
                this.ctx.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);
            }
            
            // Clear landmarks
            this.bodyLandmarks = null;
            this.handLandmarks = null;
            this.faceLandmarks = null;
            
            console.log('[GestureRecognitionService] ✓ Gesture tracking stopped');
        } catch (error) {
            console.error('[GestureRecognitionService] Failed to stop tracking:', error);
        }
    }
    
    /**
     * Start detection loop
     */
    startDetectionLoop() {
        const detect = async () => {
            if (!this.isTracking) {
                return;
            }
            
            try {
                // Detect landmarks
                await this.detectLandmarks();
                
                // Recognize gestures
                await this.recognizeGestures();
                
                // Analyze body language
                await this.analyzeBodyLanguage();
                
                // Draw results
                this.drawResults();
                
                // Continue loop
                requestAnimationFrame(detect);
            } catch (error) {
                console.error('[GestureRecognitionService] Detection loop error:', error);
                setTimeout(() => requestAnimationFrame(detect), 100);
            }
        };
        
        requestAnimationFrame(detect);
    }
    
    /**
     * Detect landmarks
     */
    async detectLandmarks() {
        if (!this.videoElement || !this.ctx) {
            return;
        }
        
        try {
            // In production, you'd use actual ML models
            // For now, generate mock landmarks
            
            this.bodyLandmarks = this.generateMockBodyLandmarks();
            this.handLandmarks = this.generateMockHandLandmarks();
            this.faceLandmarks = this.generateMockFaceLandmarks();
            
        } catch (error) {
            console.error('[GestureRecognitionService] Failed to detect landmarks:', error);
        }
    }
    
    /**
     * Generate mock body landmarks
     */
    generateMockBodyLandmarks() {
        const landmarks = [];
        const numLandmarks = 33; // MediaPipe Pose has 33 landmarks
        
        for (let i = 0; i < numLandmarks; i++) {
            landmarks.push({
                x: Math.random() * this.videoElement.videoWidth,
                y: Math.random() * this.videoElement.videoHeight,
                z: Math.random() * 0.5,
                visibility: Math.random() * 0.5 + 0.5
            });
        }
        
        return landmarks;
    }
    
    /**
     * Generate mock hand landmarks
     */
    generateMockHandLandmarks() {
        const hands = [];
        const numHands = Math.random() > 0.5 ? 2 : 1; // Sometimes detect 2 hands
        
        for (let h = 0; h < numHands; h++) {
            const landmarks = [];
            const numLandmarks = 21; // MediaPipe Hands has 21 landmarks per hand
            
            for (let i = 0; i < numLandmarks; i++) {
                landmarks.push({
                    x: Math.random() * this.videoElement.videoWidth,
                    y: Math.random() * this.videoElement.videoHeight,
                    z: Math.random() * 0.1
                });
            }
            
            hands.push(landmarks);
        }
        
        return hands;
    }
    
    /**
     * Generate mock face landmarks
     */
    generateMockFaceLandmarks() {
        const landmarks = [];
        const numLandmarks = 468; // MediaPipe Face Mesh has 468 landmarks
        
        for (let i = 0; i < numLandmarks; i++) {
            landmarks.push({
                x: Math.random() * this.videoElement.videoWidth,
                y: Math.random() * this.videoElement.videoHeight,
                z: Math.random() * 0.05
            });
        }
        
        return landmarks;
    }
    
    /**
     * Recognize gestures
     */
    async recognizeGestures() {
        try {
            const detectedGestures = [];
            
            // Recognize hand gestures
            if (this.handLandmarks) {
                for (const hand of this.handLandmarks) {
                    const handGesture = this.recognizeHandGesture(hand);
                    if (handGesture) {
                        detectedGestures.push(handGesture);
                    }
                }
            }
            
            // Recognize body gestures
            if (this.bodyLandmarks) {
                const bodyGesture = this.recognizeBodyGesture(this.bodyLandmarks);
                if (bodyGesture) {
                    detectedGestures.push(bodyGesture);
                }
            }
            
            // Recognize face gestures
            if (this.faceLandmarks) {
                const faceGesture = this.recognizeFaceGesture(this.faceLandmarks);
                if (faceGesture) {
                    detectedGestures.push(faceGesture);
                }
            }
            
            // Update current state
            if (detectedGestures.length > 0) {
                const bestGesture = detectedGestures.reduce((best, current) => 
                    current.confidence > best.confidence ? current : best
                );
                
                this.currentState.gesture = bestGesture.name;
                this.currentState.confidence = bestGesture.confidence;
                
                // Add to history
                this.gestureHistory.push({
                    gesture: bestGesture.name,
                    confidence: bestGesture.confidence,
                    timestamp: Date.now(),
                    landmarks: {
                        body: this.bodyLandmarks,
                        hands: this.handLandmarks,
                        face: this.faceLandmarks
                    }
                });
                
                // Keep only last 100 gestures
                if (this.gestureHistory.length > 100) {
                    this.gestureHistory = this.gestureHistory.slice(-100);
                }
            }
            
        } catch (error) {
            console.error('[GestureRecognitionService] Failed to recognize gestures:', error);
        }
    }
    
    /**
     * Recognize hand gesture
     */
    recognizeHandGesture(landmarks) {
        // In production, you'd use actual gesture recognition algorithms
        // For now, implement simple pattern matching
        
        const gestures = ['wave', 'thumbsUp', 'peace', 'point', 'grab'];
        const randomGesture = gestures[Math.floor(Math.random() * gestures.length)];
        const confidence = Math.random() * 0.5 + 0.5; // 0.5 to 1.0
        
        if (confidence > 0.7) {
            return {
                name: randomGesture,
                confidence: confidence,
                type: 'hand',
                landmarks: landmarks
            };
        }
        
        return null;
    }
    
    /**
     * Recognize body gesture
     */
    recognizeBodyGesture(landmarks) {
        // Simple body gesture recognition
        const gestures = ['waveBody', 'nod', 'shake', 'shrug', 'crossArms'];
        const randomGesture = gestures[Math.floor(Math.random() * gestures.length)];
        const confidence = Math.random() * 0.4 + 0.6; // 0.6 to 1.0
        
        if (confidence > 0.7) {
            return {
                name: randomGesture,
                confidence: confidence,
                type: 'body',
                landmarks: landmarks
            };
        }
        
        return null;
    }
    
    /**
     * Recognize face gesture
     */
    recognizeFaceGesture(landmarks) {
        // Simple facial expression recognition
        const gestures = ['smile', 'frown', 'surprise', 'wink'];
        const randomGesture = gestures[Math.floor(Math.random() * gestures.length)];
        const confidence = Math.random() * 0.3 + 0.7; // 0.7 to 1.0
        
        if (confidence > 0.8) {
            return {
                name: randomGesture,
                confidence: confidence,
                type: 'face',
                landmarks: landmarks
            };
        }
        
        return null;
    }
    
    /**
     * Analyze body language
     */
    async analyzeBodyLanguage() {
        try {
            if (!this.bodyLandmarks) {
                return;
            }
            
            // Analyze posture
            const posture = this.analyzePosture(this.bodyLandmarks);
            
            // Analyze arm position
            const armPosition = this.analyzeArmPosition(this.bodyLandmarks);
            
            // Analyze head movement
            const headMovement = this.analyzeHeadMovement(this.bodyLandmarks);
            
            // Determine body language pattern
            const pattern = this.determineBodyLanguagePattern({
                posture,
                armPosition,
                headMovement,
                currentGesture: this.currentState.gesture
            });
            
            this.currentState.bodyLanguage = pattern;
            
        } catch (error) {
            console.error('[GestureRecognitionService] Failed to analyze body language:', error);
        }
    }
    
    /**
     * Analyze posture
     */
    analyzePosture(landmarks) {
        // Simple posture analysis
        const shoulderLeft = landmarks[11]; // Left shoulder
        const shoulderRight = landmarks[12]; // Right shoulder
        const hipLeft = landmarks[23]; // Left hip
        const hipRight = landmarks[24]; // Right hip
        
        if (!shoulderLeft || !shoulderRight || !hipLeft || !hipRight) {
            return 'unknown';
        }
        
        // Calculate shoulder alignment
        const shoulderSlope = (shoulderRight.y - shoulderLeft.y) / (shoulderRight.x - shoulderLeft.x);
        
        // Calculate spine alignment
        const spineMidX = (shoulderLeft.x + shoulderRight.x) / 2;
        const hipMidX = (hipLeft.x + hipRight.x) / 2;
        const spineAlignment = Math.abs(spineMidX - hipMidX);
        
        if (Math.abs(shoulderSlope) < 0.1 && spineAlignment < 20) {
            return 'upright';
        } else if (spineAlignment > 50) {
            return 'slumped';
        } else {
            return 'leaning';
        }
    }
    
    /**
     * Analyze arm position
     */
    analyzeArmPosition(landmarks) {
        const leftShoulder = landmarks[11];
        const leftElbow = landmarks[13];
        const leftWrist = landmarks[15];
        const rightShoulder = landmarks[12];
        const rightElbow = landmarks[14];
        const rightWrist = landmarks[16];
        
        if (!leftShoulder || !rightShoulder) {
            return 'unknown';
        }
        
        // Check if arms are crossed
        if (leftWrist && rightWrist) {
            const armsCrossed = (leftWrist.x > rightShoulder.x && rightWrist.x < leftShoulder.x) ||
                               (rightWrist.x > leftShoulder.x && leftWrist.x < rightShoulder.x);
            
            if (armsCrossed) {
                return 'crossed';
            }
        }
        
        // Check if arms are raised
        if (leftWrist && rightWrist) {
            const leftRaised = leftWrist.y < leftShoulder.y;
            const rightRaised = rightWrist.y < rightShoulder.y;
            
            if (leftRaised && rightRaised) {
                return 'both_raised';
            } else if (leftRaised || rightRaised) {
                return 'one_raised';
            }
        }
        
        return 'neutral';
    }
    
    /**
     * Analyze head movement
     */
    analyzeHeadMovement(landmarks) {
        const nose = landmarks[0]; // Nose tip
        
        if (!nose) {
            return 'unknown';
        }
        
        // Compare with previous head position
        const previousHeadPosition = this.gestureHistory.length > 0 ? 
            this.gestureHistory[this.gestureHistory.length - 1].landmarks?.body?.[0] : null;
        
        if (previousHeadPosition) {
            const deltaX = Math.abs(nose.x - previousHeadPosition.x);
            const deltaY = Math.abs(nose.y - previousHeadPosition.y);
            
            if (deltaX > 30) {
                return 'shaking'; // Head shake
            } else if (deltaY > 20) {
                return 'nodding'; // Head nod
            }
        }
        
        return 'still';
    }
    
    /**
     * Determine body language pattern
     */
    determineBodyLanguagePattern(analysis) {
        const { posture, armPosition, headMovement, currentGesture } = analysis;
        
        // Check for specific patterns
        if (posture === 'upright' && armPosition === 'neutral' && headMovement === 'nodding') {
            return 'engaged';
        }
        
        if (armPosition === 'crossed' && posture === 'slumped') {
            return 'closed';
        }
        
        if (posture === 'upright' && armPosition === 'neutral') {
            return 'confident';
        }
        
        if (posture === 'slumped' && headMovement === 'still') {
            return 'distracted';
        }
        
        if (currentGesture === 'frown' || currentGesture === 'shrug') {
            return 'nervous';
        }
        
        return 'neutral';
    }
    
    /**
     * Draw results on canvas
     */
    drawResults() {
        if (!this.ctx || !this.canvasElement) {
            return;
        }
        
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);
        
        // Draw landmarks
        if (this.bodyLandmarks) {
            this.drawBodyLandmarks(this.bodyLandmarks);
        }
        
        if (this.handLandmarks) {
            this.handLandmarks.forEach(hand => {
                this.drawHandLandmarks(hand);
            });
        }
        
        if (this.faceLandmarks) {
            this.drawFaceLandmarks(this.faceLandmarks);
        }
        
        // Draw current gesture
        if (this.currentState.gesture) {
            this.drawGestureInfo();
        }
    }
    
    /**
     * Draw body landmarks
     */
    drawBodyLandmarks(landmarks) {
        this.ctx.strokeStyle = '#00ff00';
        this.ctx.lineWidth = 2;
        
        // Draw connections (simplified skeleton)
        const connections = [
            [11, 12], // Shoulders
            [11, 13], [13, 15], // Left arm
            [12, 14], [14, 16], // Right arm
            [11, 23], [12, 24], // Torso
            [23, 24], // Hips
            [23, 25], [25, 27], // Left leg
            [24, 26], [26, 28]  // Right leg
        ];
        
        connections.forEach(([start, end]) => {
            if (landmarks[start] && landmarks[end]) {
                this.ctx.beginPath();
                this.ctx.moveTo(landmarks[start].x, landmarks[start].y);
                this.ctx.lineTo(landmarks[end].x, landmarks[end].y);
                this.ctx.stroke();
            }
        });
        
        // Draw points
        landmarks.forEach(landmark => {
            if (landmark.visibility > 0.5) {
                this.ctx.fillStyle = '#00ff00';
                this.ctx.beginPath();
                this.ctx.arc(landmark.x, landmark.y, 4, 0, 2 * Math.PI);
                this.ctx.fill();
            }
        });
    }
    
    /**
     * Draw hand landmarks
     */
    drawHandLandmarks(landmarks) {
        this.ctx.strokeStyle = '#ff00ff';
        this.ctx.lineWidth = 1;
        
        // Draw hand connections
        const connections = [
            [0, 1], [1, 2], [2, 3], [3, 4], // Thumb
            [0, 5], [5, 6], [6, 7], [7, 8], // Index finger
            [0, 9], [9, 10], [10, 11], [11, 12], // Middle finger
            [0, 13], [13, 14], [14, 15], [15, 16], // Ring finger
            [0, 17], [17, 18], [18, 19], [19, 20], // Pinky
            [5, 9], [9, 13], [13, 17] // Palm
        ];
        
        connections.forEach(([start, end]) => {
            if (landmarks[start] && landmarks[end]) {
                this.ctx.beginPath();
                this.ctx.moveTo(landmarks[start].x, landmarks[start].y);
                this.ctx.lineTo(landmarks[end].x, landmarks[end].y);
                this.ctx.stroke();
            }
        });
        
        // Draw points
        landmarks.forEach(landmark => {
            this.ctx.fillStyle = '#ff00ff';
            this.ctx.beginPath();
            this.ctx.arc(landmark.x, landmark.y, 3, 0, 2 * Math.PI);
            this.ctx.fill();
        });
    }
    
    /**
     * Draw face landmarks
     */
    drawFaceLandmarks(landmarks) {
        this.ctx.fillStyle = '#ffff00';
        
        // Draw key facial points (simplified)
        const keyPoints = [1, 33, 263, 61, 291]; // Eyes, nose, mouth corners
        
        keyPoints.forEach(index => {
            if (landmarks[index]) {
                this.ctx.beginPath();
                this.ctx.arc(landmarks[index].x, landmarks[index].y, 2, 0, 2 * Math.PI);
                this.ctx.fill();
            }
        });
    }
    
    /**
     * Draw gesture info
     */
    drawGestureInfo() {
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '16px Arial';
        this.ctx.fillText(
            `Gesture: ${this.currentState.gesture} (${(this.currentState.confidence * 100).toFixed(1)}%)`,
            10,
            30
        );
        
        this.ctx.fillText(
            `Body Language: ${this.currentState.bodyLanguage}`,
            10,
            50
        );
    }
    
    /**
     * Get current state
     */
    getCurrentState() {
        return { ...this.currentState };
    }
    
    /**
     * Get gesture history
     */
    getGestureHistory(limit = 20) {
        return this.gestureHistory.slice(-limit);
    }
    
    /**
     * Get gesture statistics
     */
    getGestureStatistics() {
        const stats = {
            totalGestures: this.gestureHistory.length,
            gestureCounts: {},
            averageConfidence: 0,
            mostCommonGesture: null
        };
        
        if (this.gestureHistory.length === 0) {
            return stats;
        }
        
        // Count gestures
        this.gestureHistory.forEach(entry => {
            stats.gestureCounts[entry.gesture] = (stats.gestureCounts[entry.gesture] || 0) + 1;
            stats.averageConfidence += entry.confidence;
        });
        
        stats.averageConfidence /= this.gestureHistory.length;
        
        // Find most common gesture
        const entries = Object.entries(stats.gestureCounts);
        if (entries.length > 0) {
            stats.mostCommonGesture = entries.reduce((a, b) => a[1] > b[1] ? a : b)[0];
        }
        
        return stats;
    }
    
    /**
     * Get tracking status
     */
    getTrackingStatus() {
        return {
            isTracking: this.isTracking,
            hasVideo: !!this.videoElement,
            hasCanvas: !!this.canvasElement,
            currentGesture: this.currentState.gesture,
            bodyLanguage: this.currentState.bodyLanguage,
            confidence: this.currentState.confidence
        };
    }
}

export default GestureRecognitionService;
