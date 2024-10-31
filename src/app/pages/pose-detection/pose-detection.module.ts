import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PoseDetectionComponent } from './pose-detection.component';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule } from '@angular/forms';

const routes: Routes = [
  {
    path: '',
    component: PoseDetectionComponent,
  }
];

@NgModule({
  declarations: [
    PoseDetectionComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    FormsModule,
  ]
})
export class PoseDetectionModule { }
