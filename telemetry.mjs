import * as http from "node:http";
import { detectResourcesSync, envDetector } from "@opentelemetry/resources";
import { gcpDetector } from "@opentelemetry/resource-detector-gcp";
import { registerInstrumentations } from "@opentelemetry/instrumentation";
import { HttpInstrumentation } from "@opentelemetry/instrumentation-http";
import { PrometheusExporter } from "@opentelemetry/exporter-prometheus";
import {
  SimpleSpanProcessor,
  ConsoleSpanExporter,
} from "@opentelemetry/sdk-trace-base";
import { NodeTracerProvider } from "@opentelemetry/sdk-trace-node";
import {
  MeterProvider,
  PeriodicExportingMetricReader,
  ConsoleMetricExporter,
} from "@opentelemetry/sdk-metrics";
import api from "@opentelemetry/api";

// Detect resources
const resources = detectResourcesSync({
  detectors: [
    // Enable or disable to trigger error
    gcpDetector,
    envDetector,
  ],
});
await resources.waitForAsyncAttributes();

// Add your port and startServer to the Prometheus options
const options = {
  host: "127.0.0.1",
  port: 9464,
  preventServerStart: false,
  resources,
};

const exporter =
  process.env.ENABLE_PROMETHEUS === "true"
    ? new PrometheusExporter(options, () => {
        console.log(
          `Prometheus server has been started at: http://127.0.0.1:9464/metrics`
        );
      })
    : undefined;

// Creates MeterProvider and installs the exporter as a MetricReader
const meterProvider = new MeterProvider({
  resources,
  views: [],
});
if (exporter) {
  meterProvider.addMetricReader(exporter);
}

const metricConsoleExporter = new ConsoleMetricExporter();
meterProvider.addMetricReader(
  new PeriodicExportingMetricReader({
    exporter: metricConsoleExporter,
  })
);
api.metrics.setGlobalMeterProvider(meterProvider);

// Create the trace provider
const provider = new NodeTracerProvider({
  resources,
});
const traceExporter = new ConsoleSpanExporter();
provider.addSpanProcessor(new SimpleSpanProcessor(traceExporter));
api.trace.setGlobalTracerProvider(provider);

registerInstrumentations({
  instrumentations: [
    new HttpInstrumentation({
      requestHook: (span, request) => {
        span.setAttribute("custom request hook attribute", "request");
      },
    }),
  ],
});

await import("./index.mjs");
