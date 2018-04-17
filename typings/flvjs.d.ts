/*
 * Copyright (C) 2016 Bilibili. All Rights Reserved.
 *
 * @author zheng qian <xqq@xqq.im>
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// flv.js TypeScript definition file
declare module 'flv.js' {

  export interface MediaSegment {
    duration: number,
    filesize?: number,
    url: string
  }

  export interface MediaDataSource {
    type: string,
    isLive?: boolean,
    cors?: boolean,
    withCredentials?: boolean,

    hasAudio?: boolean,
    hasVideo?: boolean,

    duration?: number;
    filesize?: number;
    url?: string;

    segments?: Array<MediaSegment>
  }

  export interface Config {
    enableWorker?: boolean,
    enableStashBuffer?: boolean,
    stashInitialSize?: number,

    isLive?: boolean,

    lazyLoad?: boolean,
    lazyLoadMaxDuration?: number,
    lazyLoadRecoverDuration?: number,
    deferLoadAfterSourceOpen?: boolean,

    autoCleanupSourceBuffer?: boolean,
    autoCleanupMaxBackwardDuration?: number,
    autoCleanupMinBackwardDuration?: number,

    statisticsInfoReportInterval?: number,

    fixAudioTimestampGap?: boolean,

    accurateSeek?: boolean,
    seekType?: string,  // [range, param, custom]
    seekParamStart?: string,
    seekParamEnd?: string,
    rangeLoadZeroStart?: boolean,
    customSeekHandler?: any,
    reuseRedirectedURL?: boolean,
    referrerPolicy?: string
  }

  export interface FeatureList {
    mseFlvPlayback: boolean,
    mseLiveFlvPlayback: boolean,
    networkStreamIO: boolean,
    networkLoaderName: string,
    nativeMP4H264Playback: boolean,
    nativeWebmVP8Playback: boolean,
    nativeWebmVP9Playback: boolean
  }

  export interface PlayerConstructor {
    new (mediaDataSource: MediaDataSource, config?: Config): Player;
  }

  export interface Player {
    constructor: PlayerConstructor;
    destroy(): void;
    on(event: string, listener: Function): void;
    off(event: string, listener: Function): void;
    attachMediaElement(mediaElement: HTMLMediaElement): void;
    detachMediaElement(): void;
    load(): void;
    unload(): void;
    play(): Promise<void>;
    pause(): void;
    type: string;
    buffered: TimeRanges;
    duration: number;
    volume: number;
    muted: boolean;
    currentTime: number;
    mediaInfo: Object;
    statisticsInfo: Object;
  }

  export interface FlvPlayer extends Player {
  }

  export interface NativePlayer extends Player {
  }

  export interface LoggingControl {
    forceGlobalTag: boolean;
    globalTag: string;
    enableAll: boolean;
    enableDebug: boolean;
    enableVerbose: boolean;
    enableInfo: boolean;
    enableWarn: boolean;
    enableError: boolean;
    getConfig(): Object;
    applyConfig(config: Object): void;
    addLogListener(listener: Function): void;
    removeLogListener(listener: Function): void;
  }

  export interface Events {
    ERROR: string,
    LOADING_COMPLETE: string,
    RECOVERED_EARLY_EOF: string,
    MEDIA_INFO: string,
    STATISTICS_INFO: string
  }

  export interface ErrorTypes {
    NETWORK_ERROR: string,
    MEDIA_ERROR: string,
    OTHER_ERROR: string
  }

  export interface ErrorDetails {
    NETWORK_EXCEPTION: string,
    NETWORK_STATUS_CODE_INVALID: string,
    NETWORK_TIMEOUT: string,
    NETWORK_UNRECOVERABLE_EARLY_EOF: string,

    MEDIA_MSE_ERROR: string,

    MEDIA_FORMAT_ERROR: string,
    MEDIA_FORMAT_UNSUPPORTED: string,
    MEDIA_CODEC_UNSUPPORTED: string
  }
  const flvjs: {
    createPlayer(mediaDataSource: MediaDataSource, config?: Config): Player,
    isSupported(): boolean,
    getFeatureList(): FeatureList,

    Events: Events,
    ErrorTypes: ErrorTypes,
    ErrorDetails: ErrorDetails,

    FlvPlayer: PlayerConstructor,
    NativePlayer: PlayerConstructor,
    LoggingControl: LoggingControl
  };
  export default flvjs;
}
