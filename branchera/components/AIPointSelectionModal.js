'use client';

import { useState, useEffect } from 'react';

export default function AIPointSelectionModal({ 
  isOpen, 
  onClose, 
  aiPoints, 
  onPointSelected,
  discussionTitle 
}) {
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [selectedType, setSelectedType] = useState('agree');

  useEffect(() => {
    if (isOpen) {
      setSelectedPoint(null);
      setSelectedType('agree');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const replyTypes = [
    { value: 'agree', label: 'Agree', icon: '👍', description: 'Support this point' },
    { value: 'challenge', label: 'Challenge', icon: '🤔', description: 'Question or disagree with this point' },
    { value: 'expand', label: 'Expand', icon: '💡', description: 'Add more details or examples' },
    { value: 'clarify', label: 'Clarify', icon: '❓', description: 'Ask for clarification or explanation' }
  ];

  const handleContinue = () => {
    if (selectedPoint) {
      onPointSelected(selectedPoint, selectedType);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              Reply to a Specific Point
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Select a key point from &ldquo;{discussionTitle}&rdquo; to respond to:
          </p>
        </div>

        {/* AI Points Selection */}
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Key Discussion Points
          </h3>
          
          {aiPoints.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400 mb-2">
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <p className="text-gray-500">AI is analyzing this discussion...</p>
              <p className="text-sm text-gray-400 mt-1">Points will appear here once generated</p>
            </div>
          ) : (
            <div className="space-y-3">
              {aiPoints.map((point) => (
                <div
                  key={point.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    selectedPoint?.id === point.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedPoint(point)}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      selectedPoint?.id === point.id
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-gray-300'
                    }`}>
                      {selectedPoint?.id === point.id && (
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-gray-900 font-medium">
                        {point.text}
                      </p>
                      {point.type && (
                        <span className={`inline-block px-2 py-1 text-xs rounded-full mt-2 ${
                          point.type === 'claim' ? 'bg-blue-100 text-blue-800' :
                          point.type === 'evidence' ? 'bg-green-100 text-green-800' :
                          point.type === 'recommendation' ? 'bg-purple-100 text-purple-800' :
                          point.type === 'question' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {point.type}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Reply Type Selection */}
        {selectedPoint && (
          <div className="px-6 pb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              How do you want to respond?
            </h3>
            
            <div className="grid grid-cols-2 gap-3">
              {replyTypes.map((type) => (
                <div
                  key={type.value}
                  className={`p-3 border rounded-lg cursor-pointer transition-all ${
                    selectedType === type.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedType(type.value)}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{type.icon}</span>
                    <div>
                      <p className="font-medium text-gray-900">{type.label}</p>
                      <p className="text-sm text-gray-600">{type.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleContinue}
            disabled={!selectedPoint}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue to Reply
          </button>
        </div>
      </div>
    </div>
  );
}
