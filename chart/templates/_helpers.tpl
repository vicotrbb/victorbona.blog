{{- define "app-template.name" -}}
{{- default .Chart.Name .Values.global.nameOverride | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "app-template.fullname" -}}
{{- if .Values.global.fullnameOverride -}}
{{- .Values.global.fullnameOverride | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- printf "%s-%s" .Release.Name (include "app-template.name" .) | trunc 63 | trimSuffix "-" -}}
{{- end -}}
{{- end -}}

{{- define "app-template.componentFullname" -}}
{{- $root := index . 0 -}}
{{- $component := index . 1 -}}
{{- printf "%s-%s" (include "app-template.fullname" $root) $component | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "app-template.commonLabels" -}}
app.kubernetes.io/name: {{ include "app-template.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end -}}

{{- define "app-template.selectorLabels" -}}
{{- $root := index . 0 -}}
{{- $component := index . 1 -}}
app.kubernetes.io/name: {{ include "app-template.name" $root }}
app.kubernetes.io/instance: {{ $root.Release.Name }}
app.kubernetes.io/component: {{ $component }}
{{- end -}}

{{- define "app-template.serviceAccountName" -}}
{{- if .Values.serviceAccount.create -}}
{{- if .Values.serviceAccount.name -}}
{{ .Values.serviceAccount.name }}
{{- else -}}
{{ include "app-template.fullname" . }}
{{- end -}}
{{- else -}}
{{- default "default" .Values.serviceAccount.name -}}
{{- end -}}
{{- end -}}

{{- define "app-template.kvToList" -}}
{{- $pairs := list -}}
{{- range $k, $v := . -}}
{{- $pairs = append $pairs (printf "%s=%v" $k $v) -}}
{{- end -}}
{{- join "," $pairs -}}
{{- end -}}

{{- define "app-template.otelEnv" -}}
{{- if .Values.observability.otel.enabled -}}
- name: OTEL_SERVICE_NAME
  value: "{{ default (include "app-template.name" .) .Values.observability.otel.serviceName }}"
{{- if .Values.observability.otel.endpoint }}
- name: OTEL_EXPORTER_OTLP_ENDPOINT
  value: "{{ .Values.observability.otel.endpoint }}"
{{- end }}
{{- if .Values.observability.otel.protocol }}
- name: OTEL_EXPORTER_OTLP_PROTOCOL
  value: "{{ .Values.observability.otel.protocol }}"
{{- end }}
{{- if .Values.observability.otel.headers }}
- name: OTEL_EXPORTER_OTLP_HEADERS
  value: "{{ .Values.observability.otel.headers }}"
{{- end }}
{{- if .Values.observability.otel.resourceAttributes }}
- name: OTEL_RESOURCE_ATTRIBUTES
  value: "{{ include "app-template.kvToList" .Values.observability.otel.resourceAttributes }}"
{{- end }}
{{- end -}}
{{- end -}}

{{- define "app-template.externalEnv" -}}
{{- $ext := .Values.externalServices -}}

{{- if and $ext.postgres.enabled $ext.postgres.injectEnv -}}
{{- if $ext.postgres.host }}
- name: POSTGRES_HOST
  value: "{{ $ext.postgres.host }}"
{{- end }}
{{- if $ext.postgres.port }}
- name: POSTGRES_PORT
  value: "{{ $ext.postgres.port }}"
{{- end }}
{{- if $ext.postgres.database }}
- name: POSTGRES_DB
  value: "{{ $ext.postgres.database }}"
{{- end }}
{{- if $ext.postgres.user }}
- name: POSTGRES_USER
  value: "{{ $ext.postgres.user }}"
{{- end }}
{{- if $ext.postgres.existingSecret }}
- name: POSTGRES_PASSWORD
  valueFrom:
    secretKeyRef:
      name: {{ $ext.postgres.existingSecret }}
      key: {{ $ext.postgres.passwordKey | default "password" }}
{{- if $ext.postgres.urlKey }}
- name: DATABASE_URL
  valueFrom:
    secretKeyRef:
      name: {{ $ext.postgres.existingSecret }}
      key: {{ $ext.postgres.urlKey }}
{{- end }}
{{- end }}
{{- end }}

{{- if and $ext.redis.enabled $ext.redis.injectEnv -}}
{{- if $ext.redis.host }}
- name: REDIS_HOST
  value: "{{ $ext.redis.host }}"
{{- end }}
{{- if $ext.redis.port }}
- name: REDIS_PORT
  value: "{{ $ext.redis.port }}"
{{- end }}
{{- if $ext.redis.existingSecret }}
- name: REDIS_PASSWORD
  valueFrom:
    secretKeyRef:
      name: {{ $ext.redis.existingSecret }}
      key: {{ $ext.redis.passwordKey | default "password" }}
{{- end }}
{{- end }}

{{- if and $ext.minio.enabled $ext.minio.injectEnv -}}
{{- if $ext.minio.endpoint }}
- name: MINIO_ENDPOINT
  value: "{{ $ext.minio.endpoint }}"
{{- end }}
{{- if $ext.minio.bucket }}
- name: MINIO_BUCKET
  value: "{{ $ext.minio.bucket }}"
{{- end }}
{{- if $ext.minio.region }}
- name: MINIO_REGION
  value: "{{ $ext.minio.region }}"
{{- end }}
{{- if $ext.minio.existingSecret }}
- name: MINIO_ACCESS_KEY
  valueFrom:
    secretKeyRef:
      name: {{ $ext.minio.existingSecret }}
      key: {{ $ext.minio.accessKeyKey | default "accessKey" }}
- name: MINIO_SECRET_KEY
  valueFrom:
    secretKeyRef:
      name: {{ $ext.minio.existingSecret }}
      key: {{ $ext.minio.secretKeyKey | default "secretKey" }}
{{- end }}
{{- end }}
{{- end -}}
