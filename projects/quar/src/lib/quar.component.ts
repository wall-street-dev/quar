import {
    Component,
    ElementRef,
    EventEmitter,
    OnDestroy,
    OnInit,
    Output,
    ViewChild
} from '@angular/core';
import { from, Subject } from 'rxjs';
import { QuarErrors } from './quar-errors';
import { filter, switchMap, takeUntil } from 'rxjs/operators';
import { QuarService } from './quar.service';

@Component({
    selector: 'quar-scanner',
    template: `
        <video #video autoplay muted playsinline></video>
    `,
    styleUrls: ['./quar.component.scss']
})
export class QuarComponent implements OnInit, OnDestroy {
    @ViewChild('video') video!: ElementRef;
    @Output() scanSuccess: EventEmitter<string> = new EventEmitter<string>();
    @Output() scanError: EventEmitter<QuarErrors> = new EventEmitter<QuarErrors>();
    private destroy$ = new Subject<void>();
    constructor(private quarService: QuarService) {}

    ngOnInit(): void {
        this.resumeScanner();
        from(this.quarService.requestPermissions())
            .pipe(
                filter(Boolean),
                switchMap(() => this.quarService.capture$(this.video.nativeElement)),
                takeUntil(this.destroy$)
            )
            .subscribe(
                (result: string) => {
                    this.scanSuccess.emit(result);
                    this.pauseScanner();
                },
                (error: QuarErrors) => {
                    this.scanError.emit(error);
                }
            );
    }

    resumeScanner(): void {
        this.quarService.resumeScanner();
    }

    pauseScanner(): void {
        this.quarService.pauseScanner();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
        this.quarService.destroyScanner();
    }
}
