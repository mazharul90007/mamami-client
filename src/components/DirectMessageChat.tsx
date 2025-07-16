import React, { useState, useEffect, useRef } from 'react';
import { DirectMessage, User } from '../types';
import { directMessageAPI } from '../services/api';
import WebSocketService from '../services/websocket';
import { useAuth } from '../contexts/AuthContext';
import CallButton from './CallButton';
import { Send, Mic, Play, Pause, Loader2, ArrowLeft, MoreVertical, RotateCcw } from 'lucide-react';

interface DirectMessageChatProps {
  friend: User;
  onBack: () => void;
  onSendMessage: (receiverId: string, content?: string) => Promise<void>;
  onSendVoiceMessage: (receiverId: string, voiceData: string, fileName: string, duration?: number) => void;
  wsService: WebSocketService | null;
}

const DirectMessageChat: React.FC<DirectMessageChatProps> = ({
  friend,
  onBack,
  onSendMessage,
  onSendVoiceMessage,
  wsService
}) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordedAudio, setRecordedAudio] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [tempMessages, setTempMessages] = useState<DirectMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    loadMessages();
  }, [friend.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup recording on unmount
  useEffect(() => {
    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
      if (mediaRecorder && isRecording) {
        mediaRecorder.stop();
      }
    };
  }, [mediaRecorder, isRecording]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Set up WebSocket listeners for real-time messages
  useEffect(() => {
    console.log('🔧 Setting up WebSocket listeners for friend:', friend.id, 'wsService:', !!wsService);
    if (!wsService) {
      console.log('❌ No WebSocket service available');
      return;
    }

    const handleNewDirectMessage = (message: DirectMessage) => {
      console.log('📨 NEW DIRECT MESSAGE RECEIVED:', message);
      console.log('🔍 Message structure:', {
        id: message.id,
        content: message.content,
        messageType: message.messageType,
        senderId: message.senderId,
        receiverId: message.receiverId,
        createdAt: message.createdAt,
        createdAtType: typeof message.createdAt,
        hasCreatedAt: !!message.createdAt,
        fullMessage: message
      });
      
      // Only add message if it belongs to the current conversation
      if (message.senderId === friend.id || message.receiverId === friend.id) {
        setMessages(prev => {
          // Check if message already exists to avoid duplicates
          const exists = prev.some(m => m.id === message.id);
          if (exists) {
            console.log('⚠️ Message already exists, not adding duplicate');
            return prev;
          }
          
          console.log('➕ Adding new message to conversation');
          return [...prev, message];
        });
      } else {
        console.log('⚠️ Message not for current conversation:', message.senderId, 'vs', friend.id);
      }
    };

    const handleDirectMessageSent = (message: DirectMessage) => {
      console.log('✅ Direct message sent confirmation:', message);
      console.log('📅 Sent message createdAt:', message.createdAt, 'Type:', typeof message.createdAt);
      // Add the sent message to the list if it's not already there
      setMessages(prev => {
        const exists = prev.some(m => m.id === message.id);
        if (exists) {
          console.log('⚠️ Sent message already exists, skipping');
          return prev;
        }
        console.log('➕ Adding sent message to conversation');
        return [...prev, message];
      });
      
      // Remove temporary message if it exists
      setTempMessages(prev => prev.filter(m => m.content !== message.content));
    };

    // Register event listeners
    console.log('📡 Registering WebSocket event listeners');
    wsService.on('new-direct-message', handleNewDirectMessage);
    wsService.on('direct-message-sent', handleDirectMessageSent);

    // Cleanup function
    return () => {
      console.log('🧹 Cleaning up WebSocket event listeners');
      wsService.off('new-direct-message', handleNewDirectMessage);
      wsService.off('direct-message-sent', handleDirectMessageSent);
    };
  }, [wsService, friend.id]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await directMessageAPI.getConversation(friend.id);
      if (response.success) {
        console.log('Loaded messages:', response.data);
        // Debug: Check date formats
        response.data.forEach((msg, index) => {
          console.log(`Message ${index + 1} createdAt:`, msg.createdAt, 'Type:', typeof msg.createdAt);
        });
        setMessages(response.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    setSending(true);
    try {
      // Create temporary message for immediate display
      const tempMessage: DirectMessage = {
        id: `temp-${Date.now()}`,
        content: newMessage.trim(),
        messageType: 'TEXT',
        senderId: user?.id || '',
        receiverId: friend.id,
        isRead: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        sender: user || { id: '', name: '', email: '', createdAt: '', updatedAt: '' },
        receiver: friend
      };
      
      // Add temporary message immediately
      setTempMessages(prev => [...prev, tempMessage]);
      
      // Send text message via WebSocket
      if (wsService) {
        wsService.sendDirectMessage(friend.id, newMessage.trim());
      } else {
        // Fallback to HTTP API if WebSocket not available
        await onSendMessage(friend.id, newMessage.trim());
      }
      
      setNewMessage('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const startRecording = async () => {
    try {
      console.log('Starting audio recording...');
      
      // Start timer immediately when user clicks mic button
      console.log('Starting timer immediately');
      setIsRecording(true);
      setIsPreviewing(false);
      setRecordingDuration(0);
      setRecordedAudio(null);
      setAudioUrl(null);
      setError('');
      
      // Clear any existing interval
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
      
      // Start duration timer immediately - simple approach
      recordingIntervalRef.current = setInterval(() => {
        setRecordingDuration(prev => {
          const newDuration = prev + 1;
          console.log('Recording duration updated:', newDuration, 'seconds');
          return newDuration;
        });
      }, 1000);
      
      console.log('Timer started immediately');
      
      // Check if MediaRecorder is supported
      if (!window.MediaRecorder) {
        throw new Error('MediaRecorder is not supported in this browser');
      }

      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('getUserMedia is not supported in this browser');
      }

      console.log('Browser supports recording');

      // Request microphone permission with simpler constraints
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: true
      });

      console.log('Microphone access granted, stream tracks:', stream.getTracks().length);

      // Get supported MIME types with fallback
      let mimeType = 'audio/webm';
      if (!MediaRecorder.isTypeSupported('audio/webm')) {
        if (MediaRecorder.isTypeSupported('audio/mp4')) {
          mimeType = 'audio/mp4';
        } else if (MediaRecorder.isTypeSupported('audio/wav')) {
          mimeType = 'audio/wav';
        } else {
          mimeType = '';
        }
      }

      console.log('Using MIME type:', mimeType);

      // Create MediaRecorder with or without MIME type
      const recorder = mimeType 
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      const chunks: Blob[] = [];

      recorder.ondataavailable = (event) => {
        console.log('Data available, size:', event.data.size);
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      recorder.onstart = () => {
        console.log('MediaRecorder started successfully');
        // Timer is already running, no need to start it again
      };

      recorder.onstop = () => {
        console.log('Recording stopped, chunks:', chunks.length);
        setIsRecording(false);
        
        // Clear duration timer
        if (recordingIntervalRef.current) {
          clearInterval(recordingIntervalRef.current);
          recordingIntervalRef.current = null;
          console.log('Timer stopped');
        }

        if (chunks.length === 0) {
          console.error('No audio data recorded');
          setError('No audio data recorded. Please try again.');
          stream.getTracks().forEach(track => track.stop());
          return;
        }

        const blob = new Blob(chunks, { type: mimeType || 'audio/webm' });
        const url = URL.createObjectURL(blob);
        
        console.log('Audio blob created, size:', blob.size, 'bytes');
        
        if (blob.size === 0) {
          console.error('Blob is empty');
          setError('Recording failed. Please try again.');
          stream.getTracks().forEach(track => track.stop());
          return;
        }
        
        setRecordedAudio(blob);
        setAudioUrl(url);
        setIsPreviewing(true);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        const errorMessage = (event as any).error?.message || 'Unknown recording error';
        setError('Recording failed: ' + errorMessage);
        setIsRecording(false);
        stream.getTracks().forEach(track => track.stop());
      };

      // Start recording without timeslice for better compatibility
      recorder.start();
      setMediaRecorder(recorder);
      
    } catch (error) {
      console.error('Failed to start recording:', error);
      // Stop timer if recording fails
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
      setIsRecording(false);
      
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          setError('Microphone access denied. Please allow microphone access and try again.');
        } else if (error.name === 'NotFoundError') {
          setError('No microphone found. Please connect a microphone and try again.');
        } else {
          setError('Failed to start recording: ' + error.message);
        }
      } else {
        setError('Failed to start recording: Unknown error');
      }
    }
  };

  // Test function to check browser support
  const testRecordingSupport = () => {
    console.log('=== Recording Support Test ===');
    console.log('MediaRecorder supported:', !!window.MediaRecorder);
    console.log('getUserMedia supported:', !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia));
    console.log('Audio/webm supported:', MediaRecorder.isTypeSupported('audio/webm'));
    console.log('Audio/mp4 supported:', MediaRecorder.isTypeSupported('audio/mp4'));
    console.log('Audio/wav supported:', MediaRecorder.isTypeSupported('audio/wav'));
    console.log('=============================');
  };

  // Call test function on component mount
  useEffect(() => {
    testRecordingSupport();
  }, []);

  // Monitor recording duration changes
  useEffect(() => {
    console.log('Recording duration state changed to:', recordingDuration);
  }, [recordingDuration]);

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      console.log('Stopping recording...');
      mediaRecorder.stop();
    }
  };

  const cancelRecording = () => {
    if (mediaRecorder && isRecording) {
      console.log('Canceling recording...');
      mediaRecorder.stop();
      setIsRecording(false);
      setIsPreviewing(false);
      setRecordingDuration(0);
      setRecordedAudio(null);
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
        setAudioUrl(null);
      }
      
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
    }
  };

  const playPreview = () => {
    if (audioRef.current) {
      console.log('Playing preview audio');
      audioRef.current.play().catch(error => {
        console.error('Failed to play audio:', error);
        setError('Failed to play audio preview');
      });
      setIsPlaying(true);
    }
  };

  const pausePreview = () => {
    if (audioRef.current) {
      console.log('Pausing preview audio');
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const sendVoiceMessage = () => {
    if (!recordedAudio) return;

    const fileName = `voice-message-${Date.now()}.webm`;
    
    // Use the actual recording duration instead of trying to extract from audio
    const duration = recordingDuration;
    console.log('Using recording duration:', duration, 'seconds');
    
    // Convert blob to base64
    const reader = new FileReader();
    reader.onload = () => {
      const base64Data = reader.result as string;
      const voiceData = base64Data.split(',')[1]; // Remove data URL prefix
      console.log('Sending voice message, data length:', voiceData.length, 'duration:', duration);
      
      // Pass duration to the backend
      onSendVoiceMessage(friend.id, voiceData, fileName, duration);
      
      // Reset recording state
      setIsPreviewing(false);
      setRecordedAudio(null);
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
        setAudioUrl(null);
      }
    };
    
    reader.onerror = () => {
      console.error('Failed to read audio file');
      setError('Failed to process audio file');
    };
    
    reader.readAsDataURL(recordedAudio);
  };

  const reRecord = () => {
    setIsPreviewing(false);
    setRecordedAudio(null);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    setRecordingDuration(0);
  };

  const handleAudioEnded = () => {
    console.log('Audio playback ended');
    setIsPlaying(false);
  };

  const handleAudioError = (event: any) => {
    console.error('Audio playback error:', event);
    setError('Failed to play audio. The file may be corrupted or unsupported.');
    setIsPlaying(false);
  };

  const formatTime = (dateString: string) => {
    console.log('🕐 Formatting time for:', dateString, 'Type:', typeof dateString);
    
    if (!dateString) {
      console.error('❌ Date string is empty or null');
      return '--:--';
    }
    
    try {
      const date = new Date(dateString);
      
      // Check if the date is valid
      if (isNaN(date.getTime())) {
        console.error('❌ Invalid date string:', dateString);
        return '--:--';
      }
      
      const formattedTime = date.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      
      console.log('✅ Formatted time:', formattedTime, 'from date:', date);
      return formattedTime;
    } catch (error) {
      console.error('❌ Error formatting date:', error, 'Date string:', dateString);
      return '--:--';
    }
  };

  // Group messages by sender for WhatsApp-like display
  const groupMessages = (messages: DirectMessage[]) => {
    // First, sort messages by timestamp to ensure correct order
    const sortedMessages = [...messages].sort((a, b) => {
      try {
        const dateA = new Date(a.createdAt);
        const dateB = new Date(b.createdAt);
        
        // Handle invalid dates by putting them at the end
        if (isNaN(dateA.getTime()) && isNaN(dateB.getTime())) return 0;
        if (isNaN(dateA.getTime())) return 1;
        if (isNaN(dateB.getTime())) return -1;
        
        return dateA.getTime() - dateB.getTime();
      } catch (error) {
        console.error('Error sorting messages by date:', error);
        return 0;
      }
    });
    
    const groups: DirectMessage[][] = [];
    let currentGroup: DirectMessage[] = [];
    let currentSender: string | null = null;

    sortedMessages.forEach((message, index) => {
      const isSameSender = message.senderId === currentSender;
      const isLastMessage = index === sortedMessages.length - 1;
      
      // Check if this message should start a new group
      // Only group if it's the same sender AND the previous message was from the same sender
      if (isSameSender && currentGroup.length > 0) {
        currentGroup.push(message);
      } else {
        // Start a new group
        if (currentGroup.length > 0) {
          groups.push(currentGroup);
        }
        currentGroup = [message];
        currentSender = message.senderId;
      }
      
      if (isLastMessage && currentGroup.length > 0) {
        groups.push(currentGroup);
      }
    });

    return groups;
  };



  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center p-4 border-b border-gray-200 bg-white">
        <button
          onClick={onBack}
          className="flex items-center text-gray-600 hover:text-gray-800 mr-3"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex items-center flex-1">
          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center mr-3">
            {friend.profilePhotoUrl ? (
              <img
                src={friend.profilePhotoUrl}
                alt={friend.name}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <span className="text-lg font-bold text-gray-500">
                {friend.name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{friend.name}</h3>
            <p className="text-sm text-gray-600">Online</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <CallButton
            receiverId={friend.id}
            receiverName={friend.name}
            variant="icon"
            size="sm"
          />
          <button className="text-gray-600 hover:text-gray-800">
            <MoreVertical className="h-5 w-5" />
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-2 text-sm">
          {error}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          groupMessages([...messages, ...tempMessages]).map((messageGroup, groupIndex) => (
            <div
              key={`group-${groupIndex}`}
              className={`flex ${messageGroup[0].senderId === user?.id ? 'justify-end' : 'justify-start'}`}
            >
              <div className="flex flex-col space-y-1">
                {messageGroup.map((message, messageIndex) => {
                  const isFirstInGroup = messageIndex === 0;
                  const isLastInGroup = messageIndex === messageGroup.length - 1;
                  const isFromCurrentUser = message.senderId === user?.id;
                  
                  return (
                    <div
                      key={message.id}
                      className={`max-w-xs lg:max-w-md px-4 py-2 ${
                        isFromCurrentUser
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      } ${
                        isFirstInGroup && isLastInGroup
                          ? 'rounded-lg'
                          : isFirstInGroup
                          ? 'rounded-t-lg'
                          : isLastInGroup
                          ? 'rounded-b-lg'
                          : 'rounded-none'
                      } ${
                        !isLastInGroup ? 'mb-1' : ''
                      }`}
                    >
                      {message.messageType === 'TEXT' && message.content && (
                        <p className="text-sm">{message.content}</p>
                      )}
                      
                      {message.messageType === 'VOICE' && message.voiceMessageUrl && (
                        <div className="flex items-center space-x-2">
                          <audio
                            controls
                            preload="metadata"
                            src={message.voiceMessageUrl}
                            onError={(e) => {
                              console.error('Audio playback error:', e);
                              console.error('Audio URL:', message.voiceMessageUrl);
                              setError('Audio playback failed. The file may be corrupted or unsupported.');
                            }}
                            onLoadStart={() => console.log('Loading audio from:', message.voiceMessageUrl)}
                            onCanPlay={() => console.log('Audio can play from:', message.voiceMessageUrl)}
                            onLoadedMetadata={() => console.log('Audio metadata loaded')}
                            style={{ maxWidth: 200, minWidth: 150 }}
                          />
                          {message.duration && (
                            <span className="text-xs text-gray-500">
                              {Math.floor(message.duration / 60)}:{(message.duration % 60).toString().padStart(2, '0')}
                            </span>
                          )}
                        </div>
                      )}
                      
                      {isLastInGroup && (
                        <p className={`text-xs mt-1 ${
                          isFromCurrentUser
                            ? 'text-primary-200'
                            : 'text-gray-500'
                        }`}>
                          {(() => {
                            console.log('🕐 Rendering timestamp for message:', message.id, 'createdAt:', message.createdAt, 'Type:', typeof message.createdAt);
                            const result = message.createdAt ? formatTime(message.createdAt) : 'Now';
                            console.log('🕐 Timestamp result:', result);
                            return result;
                          })()}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Type a message..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            disabled={sending}
          />
          
          {!isRecording && !isPreviewing ? (
            <button
              onClick={startRecording}
              className="p-2 text-red-600 hover:text-red-700 transition-colors"
              disabled={sending}
              title="Start voice recording"
            >
              <Mic className="h-5 w-5" />
            </button>
          ) : isRecording ? (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-red-600 font-medium">
                {Math.floor(recordingDuration / 60)}:{(recordingDuration % 60).toString().padStart(2, '0')}
              </span>
              <button
                onClick={stopRecording}
                className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                title="Stop recording"
              >
                <Mic className="h-5 w-5" />
              </button>
              <button
                onClick={cancelRecording}
                className="p-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                title="Cancel recording"
              >
                ✕
              </button>
            </div>
          ) : isPreviewing && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600 font-medium">
                {Math.floor(recordingDuration / 60)}:{(recordingDuration % 60).toString().padStart(2, '0')}
              </span>
              {isPlaying ? (
                <button
                  onClick={pausePreview}
                  className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  title="Pause preview"
                >
                  <Pause className="h-4 w-4" />
                </button>
              ) : (
                <button
                  onClick={playPreview}
                  className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  title="Play preview"
                >
                  <Play className="h-4 w-4" />
                </button>
              )}
              <button
                onClick={sendVoiceMessage}
                className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                title="Send voice message"
              >
                <Send className="h-4 w-4" />
              </button>
              <button
                onClick={reRecord}
                className="p-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                title="Re-record"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            </div>
          )}
          
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || sending}
            className="p-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
          >
            {sending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </button>
        </div>
        
        {/* Hidden audio element for preview */}
        {audioUrl && (
          <audio
            ref={audioRef}
            src={audioUrl}
            onEnded={handleAudioEnded}
            onPause={() => setIsPlaying(false)}
            onPlay={() => setIsPlaying(true)}
            onError={handleAudioError}
            style={{ display: 'none' }}
          />
        )}
      </div>
    </div>
  );
};

export default DirectMessageChat; 