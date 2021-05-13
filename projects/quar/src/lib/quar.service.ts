import { Injectable } from '@angular/core';
import jsQR, { Options, QRCode } from 'jsqr';
import { QuarErrors } from './quar-errors';

@Injectable()
export class QuarService {

    private videoConstraints: MediaStreamConstraints = {
        video: true,
        audio: false
    };
    private defaultOption: Options = { inversionAttempts: 'attemptBoth' };
    private timerCapture!: number| null;
    private canvasElem!: HTMLCanvasElement;
    private gCtx!: CanvasRenderingContext2D;
    private stream!: MediaStream | null;
    private videoElem!: HTMLVideoElement;

    constructor() {}

    isDeviceCapable(): boolean {
       return this.isCanvasSupported() && this.isMediaSupported();
    }

    stop(): QuarService {
        if (this.stream) {
            const track = this.stream.getTracks()[0];
            track.stop();
            this.stream = null;
            this.videoElem.srcObject = null;
        }

        if (this.timerCapture) {
            clearTimeout(this.timerCapture);
            this.timerCapture = null;
        }

        return this;
    }

    async requestPermissions(): Promise<boolean> {
        if (this.isDeviceCapable()) {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({video: true, audio: false});
                const track = stream.getTracks()[0];
                track.stop();
                return Promise.resolve(true);
            } catch (e) {
                return Promise.reject(QuarErrors.noPermissions);
            }
        } else {
            return Promise.reject(QuarErrors.noPermissions);
        }
    }

    async getVideoDevices(): Promise<MediaDeviceInfo[]> {
        if (navigator.mediaDevices.enumerateDevices) {
            const devices = await navigator.mediaDevices.enumerateDevices();
            return devices.filter((item: MediaDeviceInfo) => item.kind === 'videoinput');
        } else {
            throw new Error('Current browser doest not support MediaStreamTrack.getSources');
        }
    }

    async decodeFromCamera(videoElem: HTMLVideoElement, options = {}): Promise<QRCode> {
        const opts = {
            ...this.defaultOption,
            ...options
        };

        this.stop();
        if (!navigator.mediaDevices.getUserMedia) {
            throw new Error(QuarErrors.notSupported);
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia(this.videoConstraints);
            videoElem.srcObject = stream;
            this.videoElem = videoElem;
            this.stream = stream;

            return await this.decodeFromVideo(videoElem, opts);
        } catch (e) {
            throw new Error(QuarErrors.noPermissions);
        }
    }

    private isCanvasSupported(): boolean {
        const elem = document.createElement('canvas');
        return !!(elem.getContext && elem.getContext('2d'));
    }

    private isMediaSupported(): boolean {
        return navigator.mediaDevices && !!navigator.mediaDevices.getUserMedia;
    }

    private _createImageData(target: CanvasImageSource, width: number, height: number): ImageData {
        if (!this.canvasElem) {
            this._prepareCanvas(width, height);
        }

        this.gCtx.clearRect(0, 0, width, height);
        this.gCtx.drawImage(target, 0, 0, width, height);

        return this.gCtx.getImageData(
            0,
            0,
            this.canvasElem.width,
            this.canvasElem.height
        );
    }

    private _prepareCanvas(width: number, height: number): void {
        if (!this.canvasElem) {
            this.canvasElem = document.createElement('canvas');
            this.canvasElem.style.width = `${width}px`;
            this.canvasElem.style.height = `${height}px`;
            this.canvasElem.width = width;
            this.canvasElem.height = height;
        }

        this.gCtx = this.canvasElem.getContext('2d') as CanvasRenderingContext2D;
    }

    private async _captureToCanvas(videoElem: HTMLVideoElement, options: Options): Promise<QRCode> {
        if (this.timerCapture) {
            clearTimeout(this.timerCapture);
        }
        const proms = () => {
            return new Promise<QRCode>(async (resolve) => {
                let code;
                if (videoElem.videoWidth && videoElem.videoHeight) {
                    const imageData = this._createImageData(
                        videoElem,
                        videoElem.videoWidth,
                        videoElem.videoHeight
                    );

                    code = jsQR(imageData.data, imageData.width, imageData.height, options);

                    if (code && code.data) {
                        resolve(code);
                    } else {
                        this.timerCapture = setTimeout(async () => {
                            code = await this._captureToCanvas(videoElem, options);
                            resolve(code);
                        }, 500);
                    }
                } else {
                    this.timerCapture = setTimeout(async () => {
                        code = await this._captureToCanvas(videoElem, options);
                        resolve(code);
                    }, 500);
                }
            });
        };

        return await proms();
    }

    private async decodeFromVideo(videoElem: HTMLVideoElement, options = {}): Promise<QRCode> {
        const opts = {
            ...this.defaultOption,
            ...options
        };
        try {
            this.videoElem = videoElem;
            return await this._captureToCanvas(videoElem, opts);
        } catch (e) {
            throw new Error(QuarErrors.noPermissions);
        }
    }

}
