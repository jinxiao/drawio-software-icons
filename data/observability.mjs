// Classifications refer to the linked community projects, not hosted or enterprise editions.
export const observabilityProjects = [
  ['loki','Grafana Loki','official-apps','grafana/loki',['loki'],['grafana','LGTM','logs','logging','日志','日志聚合']],
  ['tempo','Grafana Tempo','official-apps','grafana/tempo',['tempo'],['grafana','LGTM','traces','distributed tracing','链路追踪','分布式追踪']],
  ['mimir','Grafana Mimir','official-apps','grafana/mimir',['mimir'],['grafana','LGTM','metrics','prometheus','time series databases','指标','时序数据库']],
  ['alloy','Grafana Alloy','official-apps','grafana/alloy',['alloy'],['grafana','collector','opentelemetry','otel','采集器','遥测']],
  ['pyroscope','Grafana Pyroscope','official-apps','grafana/pyroscope',['pyroscope'],['grafana','profiling','continuous profiling','持续剖析','性能分析']],
  ['victoriametrics','VictoriaMetrics','dashboard','VictoriaMetrics/VictoriaMetrics',['victoria metrics','vm'],['metrics','prometheus','time series databases','指标','时序数据库']],
  ['victorialogs','VictoriaLogs','dashboard','VictoriaMetrics/VictoriaLogs',['victoria logs','vmlogs'],['victoriametrics','logs','logging','日志','日志存储']],
  ['thanos','Thanos','dashboard','thanos-io/thanos',[],['prometheus','metrics','long term storage','指标','长期存储']],
  ['alertmanager','Prometheus Alertmanager','dashboard','prometheus/alertmanager',['alert manager'],['prometheus','alerting','notifications','告警','通知']],
  ['vector','Vector','dashboard','vectordotdev/vector',['vector dev','vector.dev'],['telemetry','pipeline','logs','metrics','采集器','数据管道','日志']],
  ['signoz','SigNoz','dashboard','SigNoz/signoz',['sig noz'],['opentelemetry','otel','APM','logs','metrics','traces','应用性能监控','日志','链路追踪']],
].map(([id,name,source,repo,aliases,tags])=>({
  id,name,source,homepage:`https://github.com/${repo}`,repository:`https://github.com/${repo}`,
  category:'observability',softwareType:'open-source',softwareLicense:null,
  classificationNote:'Classification refers to the linked open-source community project, not hosted or enterprise editions. Verify edition-specific software terms separately from artwork rights.',
  aliases,tags,
}));

export const observabilityMetadata = new Map([
  ...observabilityProjects.map(project=>[project.id,project]),
  ['grafana',{aliases:['Grafana OSS'],tags:['grafana','LGTM','dashboards','visualization','仪表盘','可视化']}],
  ['k6',{aliases:['Grafana k6'],tags:['grafana','load testing','performance testing','负载测试','性能测试']}],
  ['prometheus',{aliases:['普罗米修斯'],tags:['metrics','time series databases','指标','时序数据库']}],
  ['opentelemetry',{aliases:['otel','OTel'],tags:['telemetry','instrumentation','遥测','可观测性']}],
  ['jaegertracing',{aliases:['jaeger'],tags:['distributed tracing','traces','链路追踪','分布式追踪']}],
]);
