// chartjs-setup.ts
import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  TimeScale,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

let registered = false;

export function registerChartJs() {
  if (!registered) {
    Chart.register(
      LineController,
      LineElement,
      PointElement,
      LinearScale,
      CategoryScale,
      Title,
      Tooltip,
      Legend,
      TimeScale
    );
    registered = true;
  }
}