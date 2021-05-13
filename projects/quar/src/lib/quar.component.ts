import {
    Component,
    ElementRef,
    EventEmitter,
    OnDestroy,
    OnInit,
    Output,
    ViewChild
} from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { QRCode } from 'jsqr';
import { QuarErrors } from './quar-errors';
import {debounceTime, filter, switchMap, takeUntil} from 'rxjs/operators';
import { QuarService } from './quar.service';

@Component({
    selector: 'quar-scanner',
    template: ` <video #video autoplay muted playsinline style="width: 100%; height: 100%"></video> `,
    styleUrls: ['./quar.component.scss']
})
export class QuarComponent implements OnInit, OnDestroy {
    @ViewChild('video') video!: ElementRef;
    @Output() scanSuccess: EventEmitter<QRCode> = new EventEmitter<QRCode>();
    @Output() scanError: EventEmitter<QuarErrors> = new EventEmitter<QuarErrors>();
    private trigger$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(true);
    private destroy$: Subject<any> = new Subject<any>();
    constructor(private quarService: QuarService) {}

    ngOnInit(): void {
        this.trigger$
            .pipe(
                debounceTime(100),
                switchMap(() => this.quarService.requestPermissions()),
                filter(Boolean),
                switchMap(() => this.quarService.decodeFromCamera(this.video.nativeElement)),
                takeUntil(this.destroy$)
            )
            .subscribe(
                (result: QRCode) => {
                    this.scanSuccess.emit(result);
                },
                (error: QuarErrors) => {
                    this.scanError.emit(error);
                }
            );
    }

    restart(): void {
        this.trigger$.next(true);
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
        this.quarService.stop();
    }
}
