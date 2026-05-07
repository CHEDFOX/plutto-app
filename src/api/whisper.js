import { Audio } from 'expo-av';
import { transcribeAudio } from './backend';

let recording = null;

// Start recording
export const startRecording = async () => {
  try {
    const permission = await Audio.requestPermissionsAsync();
    if (!permission.granted) {
      return { success: false, error: 'Microphone permission denied' };
    }

    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });

    const { recording: newRecording } = await Audio.Recording.createAsync(
      Audio.RecordingOptionsPresets.HIGH_QUALITY
    );
    
    recording = newRecording;
    return { success: true };
  } catch (error) {
    console.error('Start recording error:', error);
    return { success: false, error: error.message };
  }
};

// Stop recording and transcribe via backend
export const stopRecordingAndTranscribe = async () => {
  try {
    if (!recording) {
      return { success: false, error: 'No recording in progress' };
    }

    await recording.stopAndUnloadAsync();
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
    });
    
    const uri = recording.getURI();
    recording = null;

    // Send to backend for transcription
    const result = await transcribeAudio(uri);
    return result;
  } catch (error) {
    console.error('Stop recording error:', error);
    return { success: false, error: error.message };
  }
};

// Cancel recording
export const cancelRecording = async () => {
  try {
    if (recording) {
      await recording.stopAndUnloadAsync();
      recording = null;
    }
    return { success: true };
  } catch (error) {
    console.error('Cancel recording error:', error);
    return { success: false, error: error.message };
  }
};

export default {
  startRecording,
  stopRecordingAndTranscribe,
  cancelRecording,
};