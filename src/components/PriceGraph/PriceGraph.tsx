import { registerChartJs } from "@/helpers/setup-chartjs";
import { getPriceHistoryForCard } from "@/db/server";
import { Typography } from "@mui/material";
import { Chart } from "chart.js";
import { padStart } from "lodash";
import { useEffect, useRef, useState } from "react";
import styles from "./PriceGraph.module.css";

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function getPriceLabelForValue(value: number): string {
  const euroPrice = Math.floor(value / 100);
  const restPrice = (value % 100).toString();
  return `€${euroPrice},${padStart(restPrice, 2, "0")}`;
}

function getTimeLabelForValue(value: string): string {
  const date = new Date(value);
  return date.getMonth() === 0
    ? date.getFullYear().toString()
    : MONTH_NAMES[date.getMonth()];
}

export function PriceGraph({ cardId }: { cardId: number }) {
  const [data, setData] = useState<
    { timestamp: string; price: number }[] | null
  >(null);
  const chartRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    registerChartJs();
    if (!data?.length) return;

    // Defer to the next animation frame so the MUI Popover Portal has fully
    // committed to the DOM. Chart.js calls getComputedStyle on the canvas
    // parent during construction; if the Portal node isn't attached yet the
    // ownerDocument lookup returns null and the constructor throws.
    let chart: Chart | null = null;
    const frameId = requestAnimationFrame(() => {
      const canvas = chartRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      Chart.getChart(canvas)?.destroy();
      chart = new Chart(ctx, {
        type: "line",
        data: {
          labels: data.map((point) => point.timestamp),
          datasets: [
            {
              label: "Price",
              data: data.map((point) => point.price),
              borderColor: "blue",
              fill: false,
            },
          ],
        },
        options: {
          scales: {
            y: {
              beginAtZero: false,
              ticks: {
                callback: function (value) {
                  return getPriceLabelForValue(value as number);
                },
              },
            },
            x: {
              display: true,
              ticks: {
                callback: function (value, index, ticks) {
                  if (index === 0 || index === ticks.length - 1) {
                    const date = new Date(data[index].timestamp);
                    return `${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;
                  }
                  const label = getTimeLabelForValue(data[index].timestamp);
                  const previousLabel = getTimeLabelForValue(
                    data[index - 1].timestamp,
                  );
                  if (label !== previousLabel) {
                    return label;
                  }
                  return "";
                },
              },
            },
          },
          responsive: true,
          maintainAspectRatio: false,
          resizeDelay: 100,
        },
      });
    });

    return () => {
      cancelAnimationFrame(frameId);
      chart?.destroy();
    };
  }, [data]);

  useEffect(() => {
    getPriceHistoryForCard(cardId).then((fetchedData) => {
      setData(fetchedData);
    });
  }, [cardId]);

  if (!data) {
    return (
      <div className={styles.message}>
        <Typography variant="body1" color="textSecondary">
          Loading...
        </Typography>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className={styles.message}>
        <Typography variant="body1" color="textSecondary">
          No price history available. Price history will be synced mostly in the
          weekend.
        </Typography>
      </div>
    );
  }

  return (
    <div className={styles.chartContainer}>
      <canvas ref={chartRef} id="chart" className={styles.canvas} />
    </div>
  );
}
