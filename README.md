# Reproducible case of OpenTelemetry + Bun

Uses OpenTelemetry with three exporters:

  - Console trace exporter
  - Console metrics exporter
  - Prometheus exporter

Also it uses the Google Cloud Platform detector

The issues exists in the reproduction are listed below.

You can run the repro with the following command:

- Prometheus enabled: `ENABLE_PROMETHEUS=true npm run dev`
- Prometheus enabled in Node.js: `ENABLE_PROMETHEUS=true npm run dev:node`
- Prometheus disabled: `ENABLE_PROMETHEUS=false npm run dev`
- Prometheus disabled in Node.js: `ENABLE_PROMETHEUS=false npm run dev:node`

## gcp resource detector

The Google Cloud Platform resource detector fails due some socket issue:

```
> OTEL_SERVICE_NAME=bun-opentelemetry bun run --target node ./telemetry.mjs

262 |                         'ECONNREFUSED',
263 |                     ].includes(err.code))) {
264 |                 let code = 'UNKNOWN';
265 |                 if (err.code)
266 |                     code = err.code;
267 |                 process.emitWarning(`received unexpected error = ${err.message} code = ${code}`, 'MetadataLookupWarning');
                    ^
warn: received unexpected error = Was there a typo in the url or port? code = FailedToOpenSocket
      at /Users/weyert/Development/Projects/Reproductions/bun-opentelemetry/node_modules/gcp-metadata/build/src/index.js:267:16
```

If you comment out the gcpDetector on line 23 it will run

## Prometheus Exporter can't be used to runtime error

If you run the script with the environment variable `ENABLE_PROMETHEUS` to set to `true` the
application will not run due the following error:

```
88 |         this._appendTimestamp =
89 |             typeof config.appendTimestamp === 'boolean'
90 |                 ? config.appendTimestamp
91 |                 : PrometheusExporter.DEFAULT_OPTIONS.appendTimestamp;
92 |         // unref to prevent prometheus exporter from holding the process open on exit
93 |         this._server = (0, http_1.createServer)(this._requestHandler).unref();
                ^
TypeError: (0, http_1.createServer)(this._requestHandler).unref is not a function. (In '(0, http_1.createServer)(this._requestHandler).unref()', '(0, http_1.createServer)(this._requestHandler).unref' is undefined)
      at new PrometheusExporter (/Users/weyert/Development/Projects/Reproductions/bun-opentelemetry/node_modules/@opentelemetry/exporter-prometheus/build/src/PrometheusExporter.js:93:13)
      at /Users/weyert/Development/Projects/Reproductions/bun-opentelemetry/telemetry.mjs:39:6
```

If you run the script in Bun with the `ENABLE_PROMETHEUS`
 set to `false` it appears to work.


### Expectations

I would expect that I can use the GCP resource detector without errors

I would expect to be able to use the `PrometheusExporter` in Bun so that I
can access the endpoint: <http://127.0.0.1:9464/metrics>

If you navigate this link you should have some output similar (timestamps might differ):

```
# HELP target_info Target metadata
# TYPE target_info gauge
target_info{service_name="unknown_service:node",telemetry_sdk_language="nodejs",telemetry_sdk_name="opentelemetry",telemetry_sdk_version="1.15.2"} 1
# HELP http_server_duration Measures the duration of inbound HTTP requests.
# UNIT http_server_duration ms
# TYPE http_server_duration histogram
http_server_duration_count{http_scheme="http",http_method="GET",net_host_name="127.0.0.1",http_flavor="1.1",http_status_code="200",net_host_port="9464"} 1
http_server_duration_sum{http_scheme="http",http_method="GET",net_host_name="127.0.0.1",http_flavor="1.1",http_status_code="200",net_host_port="9464"} 15.560375
http_server_duration_bucket{http_scheme="http",http_method="GET",net_host_name="127.0.0.1",http_flavor="1.1",http_status_code="200",net_host_port="9464",le="0"} 0
http_server_duration_bucket{http_scheme="http",http_method="GET",net_host_name="127.0.0.1",http_flavor="1.1",http_status_code="200",net_host_port="9464",le="5"} 0
http_server_duration_bucket{http_scheme="http",http_method="GET",net_host_name="127.0.0.1",http_flavor="1.1",http_status_code="200",net_host_port="9464",le="10"} 0
http_server_duration_bucket{http_scheme="http",http_method="GET",net_host_name="127.0.0.1",http_flavor="1.1",http_status_code="200",net_host_port="9464",le="25"} 1
http_server_duration_bucket{http_scheme="http",http_method="GET",net_host_name="127.0.0.1",http_flavor="1.1",http_status_code="200",net_host_port="9464",le="50"} 1
http_server_duration_bucket{http_scheme="http",http_method="GET",net_host_name="127.0.0.1",http_flavor="1.1",http_status_code="200",net_host_port="9464",le="75"} 1
http_server_duration_bucket{http_scheme="http",http_method="GET",net_host_name="127.0.0.1",http_flavor="1.1",http_status_code="200",net_host_port="9464",le="100"} 1
http_server_duration_bucket{http_scheme="http",http_method="GET",net_host_name="127.0.0.1",http_flavor="1.1",http_status_code="200",net_host_port="9464",le="250"} 1
http_server_duration_bucket{http_scheme="http",http_method="GET",net_host_name="127.0.0.1",http_flavor="1.1",http_status_code="200",net_host_port="9464",le="500"} 1
http_server_duration_bucket{http_scheme="http",http_method="GET",net_host_name="127.0.0.1",http_flavor="1.1",http_status_code="200",net_host_port="9464",le="750"} 1
http_server_duration_bucket{http_scheme="http",http_method="GET",net_host_name="127.0.0.1",http_flavor="1.1",http_status_code="200",net_host_port="9464",le="1000"} 1
http_server_duration_bucket{http_scheme="http",http_method="GET",net_host_name="127.0.0.1",http_flavor="1.1",http_status_code="200",net_host_port="9464",le="2500"} 1
http_server_duration_bucket{http_scheme="http",http_method="GET",net_host_name="127.0.0.1",http_flavor="1.1",http_status_code="200",net_host_port="9464",le="5000"} 1
http_server_duration_bucket{http_scheme="http",http_method="GET",net_host_name="127.0.0.1",http_flavor="1.1",http_status_code="200",net_host_port="9464",le="7500"} 1
http_server_duration_bucket{http_scheme="http",http_method="GET",net_host_name="127.0.0.1",http_flavor="1.1",http_status_code="200",net_host_port="9464",le="10000"} 1
http_server_duration_bucket{http_scheme="http",http_method="GET",net_host_name="127.0.0.1",http_flavor="1.1",http_status_code="200",net_host_port="9464",le="+Inf"} 1
# HELP http_client_duration Measures the duration of outbound HTTP requests.
# UNIT http_client_duration ms
# TYPE http_client_duration histogram
# HELP requests_total Counter of http requests
# TYPE requests_total counter
requests_total{initial="true"} 1
```
