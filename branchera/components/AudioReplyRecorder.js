'use client';

import { useState, useRef, useCallback } from 'react';
import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth } from '@/contexts/AuthContext';
import { useDatabase } from '@/hooks/useDatabase';

export default function AudioReplyRecorder({ discussionId, onReplyAdded, onCancel }) {
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [hasRecording, setHasRecording] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  
  const MAX_RECORDING_TIME = 30; // 30 seconds
  
  const { user } = useAuth();
  const { addReply } = useDatabase();

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

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      stopTimer();
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

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
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
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  // stopRecording is now defined above with useCallback

  const uploadReply = async () => {
    if (audioChunksRef.current.length === 0) {
      alert('Please record some audio first.');
      return;
    }

    setIsUploading(true);
    console.log('Starting reply upload process...');
    
    try {
      // Create audio blob
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      console.log('Created audio blob:', audioBlob.size, 'bytes');
      
      // Create unique filename for reply
      const timestamp = Date.now();
      const filename = `replies/${user.uid}/${timestamp}.webm`;
      console.log('Uploading reply to:', filename);
      
      // Upload to Firebase Storage
      const storageRef = ref(storage, filename);
      const snapshot = await uploadBytes(storageRef, audioBlob);
      const downloadURL = await getDownloadURL(snapshot.ref);
      console.log('Reply upload successful, URL:', downloadURL);
      
      // Save reply to discussion
      const replyData = {
        audioUrl: downloadURL,
        duration: recordingTime,
        authorId: user.uid,
        authorName: user.displayName || user.email,
        authorPhoto: user.photoURL
      };
      
      console.log('Adding reply with data:', replyData);
      const createdReply = await addReply(discussionId, replyData);
      console.log('Reply added successfully:', createdReply);
      
      // Reset form
      setRecordingTime(0);
      setHasRecording(false);
      audioChunksRef.current = [];
      
      // Clean up preview URL
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
      
      // Notify parent component
      if (onReplyAdded) {
        onReplyAdded(createdReply);
      }
      
      console.log('Reply upload process completed successfully');
      
    } catch (error) {
      console.error('Error uploading reply:', error);
      alert('Failed to upload reply. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancel = () => {
    // Stop recording if active
    if (isRecording) {
      stopRecording();
    }
    
    // Clean up
    setRecordingTime(0);
    setHasRecording(false);
    audioChunksRef.current = [];
    
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    
    if (onCancel) {
      onCancel();
    }
  };

  return (
    <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-blue-500">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium text-gray-900">Record Reply</h4>
        <button
          onClick={handleCancel}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Recording Controls */}
      <div className="flex items-center gap-3 mb-3">
        {!hasRecording ? (
          <button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isUploading}
            className={`flex items-center justify-center w-10 h-10 rounded-full transition-colors ${
              isRecording 
                ? 'bg-red-500 hover:bg-red-600 text-white' 
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isRecording ? (
              <div className="w-3 h-3 bg-white rounded-sm"></div>
            ) : (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
              </svg>
            )}
          </button>
        ) : (
          <button
            onClick={() => {
              setHasRecording(false);
              setRecordingTime(0);
              audioChunksRef.current = [];
              if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
                setPreviewUrl(null);
              }
            }}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-500 hover:bg-gray-600 text-white transition-colors"
            title="Record new reply"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
            </svg>
          </button>
        )}

        <div className="flex-1">
          <div className="text-sm text-gray-600">
            {isRecording ? (
              <span className="text-red-500 font-medium">Recording: {formatTime(recordingTime)}</span>
            ) : hasRecording ? (
              <span className="text-green-600 font-medium">Recorded: {formatTime(recordingTime)}</span>
            ) : (
              <span>Click to start recording your reply</span>
            )}
          </div>
          {isRecording && (
            <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
              <div 
                className="bg-red-500 h-1 rounded-full transition-all duration-1000"
                style={{ width: `${(recordingTime / MAX_RECORDING_TIME) * 100}%` }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Preview and Upload */}
      {hasRecording && (
        <div className="space-y-3">
          {/* Audio Preview */}
          {previewUrl && (
            <div className="bg-white rounded p-2">
              <audio controls src={previewUrl} className="w-full h-8" />
            </div>
          )}

          {/* Upload Button */}
          <div className="flex gap-2">
            <button
              onClick={uploadReply}
              disabled={isUploading}
              className="flex-1 px-4 py-2 bg-green-500 text-white text-sm font-medium rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isUploading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Posting Reply...
                </span>
              ) : (
                'Post Reply'
              )}
            </button>
          </div>
        </div>
      )}

      {/* Recording Limit Warning */}
      {recordingTime > MAX_RECORDING_TIME * 0.8 && (
        <div className="text-xs text-amber-600 mt-2">
          {MAX_RECORDING_TIME - recordingTime} seconds remaining
        </div>
      )}
    </div>
  );
}
