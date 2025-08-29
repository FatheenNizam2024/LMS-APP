import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, DimensionValue, Modal, Pressable, BackHandler  } from 'react-native';
import Video, { OnProgressData, OnLoadData, VideoRef, VideoTrack, SelectedVideoTrack } from 'react-native-video';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';
import { setStatusBarHidden } from 'expo-status-bar';
import * as ScreenOrientation from 'expo-screen-orientation';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = {
  hlsUrl: string;
  username: string;
};

type SelectedTrackState = {
    type: 'auto' | 'disabled' | 'resolution' | 'language' | 'index';
    value?: number | string;
};

// This is the core player content, which will be rendered either inline or in a modal
const PlayerContent = ({ hlsUrl, username, isFullscreen, onToggleFullscreen }: Props & { isFullscreen: boolean, onToggleFullscreen: () => void }) => {
  const videoRef = useRef<VideoRef>(null);
  const [isPaused, setIsPaused] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isBuffering, setIsBuffering] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [volume, setVolume] = useState(1.0);
  const [videoTracks, setVideoTracks] = useState<VideoTrack[]>([]);
  const [selectedTrack, setSelectedTrack] = useState<SelectedTrackState>({ type: 'auto' });
  const [showQualityModal, setShowQualityModal] = useState(false);
  
  const [watermark, setWatermark] = useState({ 
    top: '10%' as DimensionValue, 
    left: '10%' as DimensionValue, 
    text: username 
  });

  const insets = useSafeAreaInsets();
  
  useEffect(() => {
    let controlsTimeout: ReturnType<typeof setTimeout>;
    if (showControls && !isPaused) {
      controlsTimeout = setTimeout(() => setShowControls(false), 5000);
    }
    return () => clearTimeout(controlsTimeout);
  }, [showControls, isPaused]);

  useEffect(() => {
    const watermarkInterval = setInterval(() => {
      const top = `${Math.floor(Math.random() * 70) + 10}%` as DimensionValue;
      const left = `${Math.floor(Math.random() * 70) + 10}%` as DimensionValue;
      setWatermark(prev => ({ ...prev, top, left }));
    }, 5000);
    return () => clearInterval(watermarkInterval);
  }, []);

  // Android back button handler for exiting fullscreen
  useEffect(() => {
      const backAction = () => {
          if (isFullscreen) {
              onToggleFullscreen();
              return true; // Prevents default back button behavior
          }
          return false;
      };
      const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
      return () => backHandler.remove();
  }, [isFullscreen, onToggleFullscreen]);


  const formatTime = (seconds: number) => {
    const secs = Math.floor(seconds);
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m < 10 ? '0' + m : m}:${s < 10 ? '0' + s : s}`;
  };

  const playbackRates = [0.5, 1.0, 1.5, 2.0];
  const cyclePlaybackRate = () => {
    const currentIndex = playbackRates.indexOf(playbackRate);
    const nextIndex = (currentIndex + 1) % playbackRates.length;
    setPlaybackRate(playbackRates[nextIndex]);
  };

  const handleProgress = (data: OnProgressData) => {
    if (!isLoading) {
      setCurrentTime(data.currentTime);
    }
  };

  const handleLoad = (data: OnLoadData) => {
    setDuration(data.duration);
    if (data.videoTracks && data.videoTracks.length > 0) {
      setVideoTracks(data.videoTracks.filter(track => track.height));
    }
    setIsLoading(false);
  };
  
  const handleSeek = (value: number) => {
    videoRef.current?.seek(value);
    setCurrentTime(value);
  };

  const handleSelectTrack = (track: VideoTrack | 'auto') => {
      if (track === 'auto') {
          setSelectedTrack({ type: 'auto' });
      } else {
          const trackIndex = videoTracks.findIndex(vt => vt.height === track.height && vt.bitrate === track.bitrate);
          if (trackIndex !== -1) {
              setSelectedTrack({ type: 'index', value: trackIndex });
          }
      }
      setShowQualityModal(false);
  };

  const handlePlayPause = () => {
      if (currentTime >= duration && duration > 0) {
          videoRef.current?.seek(0);
          setCurrentTime(0);
      }
      setIsPaused(!isPaused);
  }

  return (
    <View style={styles.videoWrapper}>
        <Video
          ref={videoRef}
          source={{ uri: hlsUrl }}
          style={StyleSheet.absoluteFill}
          paused={isPaused}
          resizeMode={isFullscreen ? "contain" : "contain"}
          onLoad={handleLoad}
          onProgress={handleProgress}
          onEnd={() => setIsPaused(true)}
          onLoadStart={() => setIsLoading(true)}
          onBuffer={({ isBuffering }) => setIsBuffering(isBuffering)}
          rate={playbackRate}
          volume={volume}
          selectedVideoTrack={selectedTrack as SelectedVideoTrack}
          playInBackground={false}
          playWhenInactive={false}
        />
        
        <Text style={[styles.watermark, { top: watermark.top, left: watermark.left }]} pointerEvents="none">{username}</Text>

        {(isLoading || isBuffering) && <ActivityIndicator style={StyleSheet.absoluteFill} size="large" color="#FFF" />}

        <Pressable style={styles.touchableOverlay} onPress={() => setShowControls(prev => !prev)}>
        {showControls && (
          <View style={[styles.controlsOverlay, { paddingBottom: isFullscreen ? insets.bottom + 5 : 5, paddingLeft: isFullscreen ? insets.left + 15 : 15, paddingRight: isFullscreen ? insets.right + 15 : 15 }]}>
            <View style={styles.mainControls}>
              <TouchableOpacity onPress={() => handleSeek(currentTime - 10)}><Ionicons name="play-back" size={30} color="#FFF" /></TouchableOpacity>
              <TouchableOpacity onPress={handlePlayPause} style={styles.playPauseButton}><Ionicons name={isPaused ? 'play-circle-outline' : 'pause-circle-outline'} size={60} color="#FFF" /></TouchableOpacity>
              <TouchableOpacity onPress={() => handleSeek(currentTime + 10)}><Ionicons name="play-forward" size={30} color="#FFF" /></TouchableOpacity>
            </View>
            <View style={[styles.controlsBar, { paddingBottom: isFullscreen ? insets.bottom + 5 : 5, paddingLeft: isFullscreen ? insets.left + 15 : 15, paddingRight: isFullscreen ? insets.right + 15 : 15 }]}>
              <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
              <Slider
                style={{ flex: 1, marginHorizontal: 10 }}
                minimumValue={0}
                maximumValue={duration}
                value={currentTime}
                onSlidingComplete={handleSeek}
                minimumTrackTintColor="#FFFFFF"
                maximumTrackTintColor="rgba(255, 255, 255, 0.5)"
                thumbTintColor="#FFFFFF"
              />
              <Text style={styles.timeText}>{formatTime(duration)}</Text>
              <TouchableOpacity onPress={() => setVolume(v => (v > 0 ? 0 : 1))} style={styles.controlButton}><Ionicons name={volume > 0 ? "volume-medium-outline" : "volume-mute-outline"} size={24} color="#FFF" /></TouchableOpacity>
              <TouchableOpacity onPress={cyclePlaybackRate} style={styles.controlButton}><Text style={styles.controlButtonText}>{playbackRate.toFixed(1)}x</Text></TouchableOpacity>
              {videoTracks.length > 0 && (<TouchableOpacity onPress={() => setShowQualityModal(true)} style={styles.controlButton}><Ionicons name="settings-outline" size={24} color="#FFF" /></TouchableOpacity>)}
              <TouchableOpacity onPress={onToggleFullscreen} style={styles.controlButton}><Ionicons name={isFullscreen ? "contract" : "expand"} size={24} color="#FFF" /></TouchableOpacity>
            </View>
          </View>
        )}
        </Pressable>

        <Modal visible={showQualityModal} transparent={true} animationType="fade">
            <Pressable style={styles.modalContainer} onPress={() => setShowQualityModal(false)}>
                <View style={styles.modalContent}>
                    <Text style={styles.modalHeader}>Select Quality</Text>
                    <TouchableOpacity style={styles.qualityOption} onPress={() => handleSelectTrack('auto')}>
                        <Text style={styles.qualityText}>Auto</Text>
                    </TouchableOpacity>
                    {videoTracks.map((track, index) => (
                        <TouchableOpacity key={index} style={styles.qualityOption} onPress={() => handleSelectTrack(track)}>
                            <Text style={styles.qualityText}>{track.height}p</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </Pressable>
        </Modal>
    </View>
  );
};


// This is the main component that manages the fullscreen modal state
const CustomVideoPlayer = ({ hlsUrl, username }: Props) => {
    const [isFullscreen, setIsFullscreen] = useState(false);
    // const windowDimensions = useWindowDimensions();

    const handleToggleFullscreen = async () => {
        const newIsFullscreen = !isFullscreen;
        setStatusBarHidden(newIsFullscreen, 'fade');
        if (newIsFullscreen) {
            await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE_RIGHT);
        } else {
            await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
        }
        setIsFullscreen(newIsFullscreen);
    };

    // const onLayout = (event: LayoutChangeEvent) => {
    //     const { width, height } = event.nativeEvent.layout;
    //     setScreenDimensions({ width, height });
    // };

    return (
        <>
            <View style={styles.container}>
              <PlayerContent 
                hlsUrl={hlsUrl} 
                username={username} 
                isFullscreen={false} 
                onToggleFullscreen={handleToggleFullscreen} 
                />
            </View>
            <Modal 
                visible={isFullscreen} 
                supportedOrientations={['landscape', 'portrait']}
                onRequestClose={handleToggleFullscreen}
            >
                {/* THE FIX: The fullscreen container now takes up the entire screen,
                    and PlayerContent inside it will fill this space. */}
                <View style={styles.fullscreenContainer}>
                    <PlayerContent 
                        hlsUrl={hlsUrl} 
                        username={username} 
                        isFullscreen={true} 
                        onToggleFullscreen={handleToggleFullscreen}
                    />
                </View>
            </Modal>
        </>
    );
};

const styles = StyleSheet.create({
    container: { width: '100%', aspectRatio: 16/9, backgroundColor: '#000' },
    fullscreenContainer: { flex: 1,  padding: 'auto', backgroundColor: '#000' },
    videoWrapper: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    touchableOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
    controlsOverlay: { 
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'space-between', 
        backgroundColor: 'rgba(0,0,0,0.3)' 
    },
    // This style was removed in your code, but is needed for the ActivityIndicator
    loadingOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
    mainControls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', flex: 1 },
    playPauseButton: { marginHorizontal: 30 },
    controlsBar: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        backgroundColor: 'rgba(0,0,0,0.6)', 
        borderRadius: 8, 
        paddingVertical: 5,
        paddingHorizontal: 10,
    },
    timeText: { color: '#FFF', fontWeight: '600', paddingHorizontal: 6 },
    watermark: { position: 'absolute', color: 'rgba(255, 255, 255, 0.25)', fontSize: 16, fontWeight: 'bold' },
    controlButton: { paddingHorizontal: 8, justifyContent: 'center' },
    controlButtonText: { color: '#FFF', fontWeight: 'bold' },
    modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)' },
    modalContent: { backgroundColor: '#212121', borderRadius: 10, padding: 20, width: '60%' },
    modalHeader: { color: '#FFF', fontSize: 18, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
    qualityOption: { paddingVertical: 12, alignItems: 'center' },
    qualityText: { color: '#FFF', fontSize: 16 }
});

export default CustomVideoPlayer;