import test from 'node:test';
import assert from 'node:assert/strict';
import {searchSpotlight,spotlightLocation} from '../src/spotlight.mjs';

const categories=[
  {id:'infrastructure',name:'云与基础设施',nameEn:'Cloud & Infrastructure',keywords:['cloud']},
  {id:'alibaba-compute',name:'计算',nameEn:'Compute',keywords:['cloud']},
];
const icon=(id,name,extra={})=>({id,name,aliases:[],tags:[],category:'infrastructure',collection:'software',softwareType:'open-source',...extra});
const icons=[
  icon('gitlab','GitLab'),
  icon('git','Git'),
  icon('a-guide','A Git Guide',{tags:['git']}),
  icon('kubernetes','Kubernetes',{aliases:['k8s','容器编排']}),
  icon('alibaba-ecs','云服务器 ECS',{nameEn:'Elastic Compute Service',collection:'alibaba-cloud',category:'alibaba-compute',softwareType:'commercial'}),
];

test('Spotlight searches both collections and languages, prioritizing exact and prefix matches',()=>{
  assert.deepEqual(searchSpotlight(icons,categories,'ＧＩＴ').map(i=>i.id),['git','gitlab','a-guide']);
  assert.equal(searchSpotlight(icons,categories,' K8S ')[0].id,'kubernetes');
  assert.equal(searchSpotlight(icons,categories,'容器编排')[0].id,'kubernetes');
  for(const query of ['云服务器','Elastic Compute','cloud ECS']) {
    assert.deepEqual(searchSpotlight(icons,categories,query).map(i=>i.id),['alibaba-ecs']);
  }
  assert.equal(searchSpotlight(icons,categories,'cloud').length,icons.length);
  assert.equal(searchSpotlight(icons,categories,'   ').length,icons.length);
  assert.deepEqual(searchSpotlight(icons,categories,'no-such-icon'),[]);
});

test('locating a cross-collection result reveals its page and primary category',()=>{
  const many=Array.from({length:160},(_,index)=>icon(`icon-${index}`,`Icon ${String(index).padStart(3,'0')}`));
  assert.deepEqual(spotlightLocation(many,categories,'icon-0'),{collection:'software',category:'infrastructure',limit:72});
  assert.equal(spotlightLocation(many,categories,'icon-71').limit,72);
  assert.equal(spotlightLocation(many,categories,'icon-72').limit,144);
  assert.equal(spotlightLocation(many,categories,'icon-159').limit,216);
  assert.deepEqual(spotlightLocation([...many,...icons],categories,'alibaba-ecs'),{collection:'alibaba-cloud',category:'alibaba-compute',limit:72});
  assert.equal(spotlightLocation(icons,categories,'missing'),null);
});
