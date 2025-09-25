'use client';

import { useState, useRef, useCallback } from 'react';
import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth } from '@/contexts/AuthContext';
import { useDatabase } from '@/hooks/useDatabase';

export default function AudioRecorder({ onDiscussionCreated }) {
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [title, setTitle] = useState('');
  const [voiceActivity, setVoiceActivity] = useState(0);
  const [hasRecording, setHasRecording] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const analyserRef = useRef(null);
  const animationRef = useRef(null);
  
  const MAX_RECORDING_TIME = 30; // 30 seconds
  
  const { user } = useAuth();
  const { createDiscussion } = useDatabase();

  const startTimer = useCallback(() => {
    timerRef.current = setInterval(() => {
      setRecordingTime(prev => {
        const newTime = prev + 1;
        if (newTime >= MAX_RECORDING_TIME) {
          stopRecording();
        }
        return newTime;
      });
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startVoiceActivityDetection = useCallback((stream) => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    const microphone = audioContext.createMediaStreamSource(stream);
    
    analyser.fftSize = 512;
    analyser.minDecibels = -90;
    analyser.maxDecibels = -10;
    analyser.smoothingTimeConstant = 0.85;
    
    microphone.connect(analyser);
    analyserRef.current = analyser;
    
    const detectVoiceActivity = () => {
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(dataArray);
      
      // Calculate average volume
      const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
      const normalizedActivity = Math.min(average / 50, 1); // Normalize to 0-1
      
      setVoiceActivity(normalizedActivity);
      
      if (isRecording) {
        animationRef.current = requestAnimationFrame(detectVoiceActivity);
      }
    };
    
    detectVoiceActivity();
  }, [isRecording]);

  const stopVoiceActivityDetection = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    setVoiceActivity(0);
  }, []);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      startTimer();
      startVoiceActivityDetection(stream);
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      stopTimer();
      stopVoiceActivityDetection();
      setHasRecording(true);
      
      // Create preview URL for playback
      if (audioChunksRef.current.length > 0) {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setPreviewUrl(url);
      }
      
      // Stop all tracks to release microphone
      const stream = mediaRecorderRef.current.stream;
      stream.getTracks().forEach(track => track.stop());
    }
  };

  const uploadAudio = async () => {
    if (audioChunksRef.current.length === 0 || !title.trim()) {
      alert('Please provide a title and record some audio first.');
      return;
    }

    setIsUploading(true);
    console.log('Starting upload process...');
    
    try {
      // Create audio blob
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      console.log('Created audio blob:', audioBlob.size, 'bytes');
      
      // Create unique filename
      const timestamp = Date.now();
      const filename = `discussions/${user.uid}/${timestamp}.webm`;
      console.log('Uploading to:', filename);
      
      // Upload to Firebase Storage
      const storageRef = ref(storage, filename);
      const snapshot = await uploadBytes(storageRef, audioBlob);
      const downloadURL = await getDownloadURL(snapshot.ref);
      console.log('Upload successful, URL:', downloadURL);
      
      // Save discussion metadata to Firestore
      const discussionData = {
        title: title.trim(),
        audioUrl: downloadURL,
        duration: recordingTime,
        authorId: user.uid,
        authorName: user.displayName || user.email,
        authorPhoto: user.photoURL
      };
      
      console.log('Creating discussion with data:', discussionData);
      const createdDiscussion = await createDiscussion(discussionData);
      console.log('Discussion created successfully:', createdDiscussion);
      
      // Reset form
      setTitle('');
      setRecordingTime(0);
      setHasRecording(false);
      audioChunksRef.current = [];
      
      // Clean up preview URL
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
      
      // Notify parent component
      if (onDiscussionCreated) {
        console.log('Notifying parent component...');
        onDiscussionCreated(createdDiscussion);
      }
      
      console.log('Upload process completed successfully');
      alert('Discussion posted successfully!');
    } catch (error) {
      console.error('Error uploading audio:', error);
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        code: error.code,
        stack: error.stack
      });
      alert(`Failed to upload discussion: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const discardRecording = () => {
    audioChunksRef.current = [];
    setRecordingTime(0);
    setTitle('');
    setHasRecording(false);
    
    // Clean up preview URL
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
      <h2 className="text-lg font-semibold mb-4">Start a Discussion</h2>
      
      {/* Title Input */}
      <div className="mb-4">
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
          Discussion Title
        </label>
        <input
          type="text"
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What would you like to discuss?"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isRecording || isUploading}
        />
      </div>

      {/* Audio Preview */}
      {previewUrl && hasRecording && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Preview Your Recording
          </label>
          <audio 
            controls 
            src={previewUrl}
            className="w-full"
            style={{ height: '40px' }}
          >
            Your browser does not support the audio element.
          </audio>
        </div>
      )}

      {/* Recording Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {!isRecording && !hasRecording && (
            <button
              onClick={startRecording}
              disabled={isUploading}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="w-3 h-3 bg-white rounded-full"></div>
              Record
            </button>
          )}
          
          {isRecording && (
            <button
              onClick={stopRecording}
              className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
            >
              <div className="w-3 h-3 bg-white"></div>
              Stop
            </button>
          )}
          
          {!isRecording && hasRecording && (
            <>
              <button
                onClick={uploadAudio}
                disabled={isUploading || !title.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Uploading...
                  </>
                ) : (
                  'Post Discussion'
                )}
              </button>
              
              <button
                onClick={discardRecording}
                disabled={isUploading}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                Discard
              </button>
            </>
          )}
        </div>
        
        {/* Recording Timer and Voice Activity */}
        {(isRecording || recordingTime > 0) && (
          <div className="flex items-center gap-3 text-sm text-gray-600">
            {isRecording && (
              <>
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                {/* Voice Activity Indicator */}
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className={`w-1 h-4 rounded-full transition-all duration-100 ${
                        voiceActivity > i * 0.01 ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                      style={{
                        height: `${Math.max(4, 16 * Math.min(voiceActivity - i * 0.01, 0.01) * 5)}px`
                      }}
                    ></div>
                  ))}
                </div>
              </>
            )}
            <span className="font-mono">
              {formatTime(recordingTime)}
              {isRecording && ` / ${formatTime(MAX_RECORDING_TIME)}`}
            </span>
          </div>
        )}
      </div>
      
      {isRecording && (
        <div className="mt-4 text-sm text-gray-500">
          Recording... Click "Stop" when you're done or wait for the 30-second limit.
        </div>
      )}
      
      {recordingTime >= MAX_RECORDING_TIME && !isRecording && hasRecording && (
        <div className="mt-4 text-sm text-amber-600">
          Maximum recording time reached (30 seconds). Please add a title and post your discussion.
        </div>
      )}
    </div>
  );
}
