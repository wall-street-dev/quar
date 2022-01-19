import { Injectable } from '@angular/core';
import jsQR, { Options } from 'jsqr';
import { QuarErrors } from './quar-errors';
import {
    animationFrameScheduler,
    BehaviorSubject,
    from,
    interval,
    Observable,
    Subject
} from 'rxjs';
import { auditTime, filter, finalize, map, switchMap, take, takeUntil } from 'rxjs/operators';
import { CameraStream } from './CameraStream';

@Injectable({providedIn: 'root'})
export class QuarService {
    private videoConstraints: MediaStreamConstraints = {
        video: { facingMode: 'environment' },
        audio: false
    };
    private defaultOption: Options = { inversionAttempts: 'attemptBoth' };
    private continue$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(true);
    destroy$ = new Subject();

    constructor() {}

    capture$(videoElement: HTMLVideoElement, options: Options = {}): Observable<string> {
        const opts: Options = {
            ...this.defaultOption,
            ...options
        };

        if (!navigator.mediaDevices.getUserMedia) {
            throw new Error(QuarErrors.notSupported);
        }
        return from(navigator.mediaDevices.getUserMedia(this.videoConstraints)).pipe(
            map((stream: MediaStream): CameraStream => new CameraStream(videoElement, stream)),
            switchMap((cameraStream: CameraStream) => {
                return interval(0, animationFrameScheduler).pipe(
                    auditTime(300),
                    switchMap(() => this.continue$),
                    filter(Boolean),
                    map(() => this.decode(cameraStream, opts)),
                    finalize(() => cameraStream.stop())
                );
            }),
            filter((code: string) => !!code),
            takeUntil(this.destroy$)
        );
    }

    private decode(cameraStream: CameraStream, options: Options = {}): string {
        if (cameraStream.isVideoReady()) {
            const imageData: ImageData = cameraStream.getImageData();
            const code = jsQR(imageData.data, imageData.width, imageData.height, options);
            if (code) {
                return code.data;
            }
        }
        return '';
    }

    toggle(): void {
        this.continue$.pipe(take(1)).subscribe((status: boolean) => {
            this.continue$.next(!status);
        });
    }

    pauseScanner(): void {
        this.continue$.next(false);
    }

    resumeScanner(): void {
        this.continue$.next(true);
    }

    isDeviceCapable(): boolean {
        return this.isCanvasSupported() && this.isMediaSupported();
    }

    destroyScanner(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    async requestPermissions(): Promise<boolean> {
        if (this.isDeviceCapable()) {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
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

    private isCanvasSupported(): boolean {
        const elem = document.createElement('canvas');
        return !!(elem.getContext && elem.getContext('2d'));
    }

    private isMediaSupported(): boolean {
        return navigator.mediaDevices && !!navigator.mediaDevices.getUserMedia;
    }
}
