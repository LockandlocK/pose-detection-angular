import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PoseDetectionComponent } from './pose-detection.component';

describe('PoseDetectionComponent', () => {
  let component: PoseDetectionComponent;
  let fixture: ComponentFixture<PoseDetectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PoseDetectionComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PoseDetectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
