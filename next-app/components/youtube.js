import React from "react";
import YouTube from "react-youtube";
import styles from '@/styles/youtube.module.css';

export default function YoutubeVideo({ videoId }) {

  const opts = {
    height: "100%",
    width: "100%",
    playerVars: {
      autoplay: 1,
    },
  };

  return (
    <div className={styles.container}>
      <YouTube videoId={videoId} opts={opts} onReady={(e) => e.target.pauseVideo()}/>
    </div>
  );
}