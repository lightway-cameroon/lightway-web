import { Directive, effect, inject, input, TemplateRef, ViewContainerRef } from '@angular/core';
import { Permission, PERMISSION_POLICY } from './permission-policy.port';

@Directive({
  selector: '[appHasPermission]',
  standalone: true,
})
export class HasPermissionDirective {
  private readonly templateRef = inject(TemplateRef<unknown>);
  private readonly viewContainer = inject(ViewContainerRef);
  private readonly permissionPolicy = inject(PERMISSION_POLICY);

  readonly appHasPermission = input.required<Permission>();

  private hasView = false;

  constructor() {
    effect(() => {
      const permission = this.appHasPermission();
      const can = this.permissionPolicy.can(permission);

      if (can && !this.hasView) {
        this.viewContainer.createEmbeddedView(this.templateRef);
        this.hasView = true;
      } else if (!can && this.hasView) {
        this.viewContainer.clear();
        this.hasView = false;
      }
    });
  }
}
