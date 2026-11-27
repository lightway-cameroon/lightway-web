import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading-skeleton',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="skeleton-box"
      [style.width]="width()"
      [style.height]="height()"
      [style.border-radius]="borderRadius()"
    ></div>
  `,
  styles: [
    `
      .skeleton-box {
        display: inline-block;
        background: linear-gradient(
          90deg,
          rgba(190, 190, 190, 0.2) 25%,
          rgba(129, 129, 129, 0.24) 37%,
          rgba(190, 190, 190, 0.2) 63%
        );
        background-size: 400% 100%;
        animation: skeleton-loading 1.4s ease infinite;
      }

      @keyframes skeleton-loading {
        0% {
          background-position: 100% 50%;
        }
        100% {
          background-position: 0 50%;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoadingSkeletonComponent {
  readonly width = input<string>('100%');
  readonly height = input<string>('20px');
  readonly borderRadius = input<string>('4px');
}
