export const databaseProjects = [{
  id:'scylladb',name:'ScyllaDB',source:'official-apps',category:'databases',
  homepage:'https://www.scylladb.com/',repository:'https://github.com/scylladb/scylladb',
  softwareType:'source-available',softwareLicense:null,
  classificationNote:'Current ScyllaDB releases use the ScyllaDB Source Available License; historical AGPL releases and commercial editions have different terms. See https://github.com/scylladb/scylladb/blob/master/LICENSE-ScyllaDB-Source-Available.md. Software terms are separate from artwork rights.',
  aliases:['Scylla','Scylla DB','Scylla 数据库'],
  tags:['NoSQL','CQL','Cassandra compatible','DynamoDB compatible','Alternator','wide-column','distributed database','宽列数据库','分布式数据库'],
}];
export const databaseMetadata = new Map(databaseProjects.map(project=>[project.id,project]));
