import { NgModule } from '@angular/core';
import { QuarComponent } from './quar.component';
import { CommonModule } from '@angular/common';
import { QuarService } from './quar.service';



@NgModule({
  declarations: [
    QuarComponent
  ],
  providers: [QuarService],
  imports: [
    CommonModule
  ],
  exports: [
    QuarComponent
  ]
})
export class QuarModule { }
