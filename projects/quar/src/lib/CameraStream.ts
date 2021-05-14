export class CameraStream {
    private canvasElem!: HTMLCanvasElement;
    private gtx!: CanvasRenderingContext2D;
    get renderingContext(): CanvasRenderingContext2D {
        if (this.gtx) {
            return this.gtx;
        }
        if (!this.canvasElem) {
            this.canvasElem = document.createElement('canvas');
            this.canvasElem.style.width = `${this.videoElem.videoWidth}px`;
            this.canvasElem.style.height = `${this.videoElem.videoHeight}px`;
            this.canvasElem.width = this.videoElem.videoWidth;
            this.canvasElem.height = this.videoElem.videoHeight;
        }
        this.gtx = this.canvasElem.getContext('2d') as CanvasRenderingContext2D;
        return this.gtx;
    }
    getImageData(): ImageData {
        this.renderingContext.clearRect(0, 0, this.videoElem.videoWidth, this.videoElem.videoHeight);
        this.renderingContext.drawImage(
            this.videoElem,
            0,
            0,
            this.videoElem.videoWidth,
            this.videoElem.videoHeight
        );
        return this.renderingContext.getImageData(0, 0, this.canvasElem.width, this.canvasElem.height);
    }
    isVideoReady(): boolean {
        return this.videoElem.readyState === HTMLMediaElement.HAVE_ENOUGH_DATA;
    }
    stop(): CameraStream {
        if (this.stream) {
            const track = this.stream.getTracks()[0];
            track.stop();
            this.stream = null;
            this.videoElem.srcObject = null;
        }
        return this;
    }

    constructor(public videoElem: HTMLVideoElement, public stream: MediaStream | null) {
        this.videoElem.srcObject = stream;
    }
}
