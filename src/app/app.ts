import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DemoPlaygroundComponent } from './components/demo/demo-playground';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DemoPlaygroundComponent
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {}
