// Brand assets are used to identify products in draw.io architecture diagrams.
export const communicationProjects = [
  ['wechat','WeChat','antdesign','https://www.wechat.com','commercial',['微信','weixin'],['IM','即时通讯']],
  ['wecom','WeCom','antdesign','https://work.weixin.qq.com','commercial',['企业微信','wechat work'],['IM','企业协作']],
  ['dingtalk','DingTalk','antdesign','https://www.dingtalk.com','commercial',['钉钉','dingding'],['IM','企业协作']],
  ['qq','QQ','antdesign','https://im.qq.com','commercial',['腾讯QQ','腾讯 QQ'],['IM','即时通讯']],
  ['lark','Feishu / Lark','dashboard','https://www.feishu.cn','commercial',['飞书','feishu'],['IM','企业协作']],
  ['microsoft-teams','Microsoft Teams','dashboard','https://www.microsoft.com/microsoft-teams','commercial',['teams','微软Teams','微软 Teams'],['IM','办公协作']],
  ['slack','Slack','dashboard','https://slack.com','commercial',[],['IM','企业协作']],
  ['discord','Discord','dashboard','https://discord.com','commercial',[],['IM','社群','community']],
  ['telegram','Telegram','dashboard','https://telegram.org','commercial',['电报'],['IM','即时通讯','open-source clients']],
  ['signal','Signal','dashboard','https://signal.org','open-source',[],['IM','即时通讯'], 'https://github.com/signalapp/Signal-Desktop'],
  ['whatsapp','WhatsApp','dashboard','https://www.whatsapp.com','commercial',[],['IM','即时通讯']],
  ['zoom','Zoom','dashboard','https://www.zoom.com','commercial',['Zoom Workplace'],['IM','视频会议','video conferencing']],
  ['webex','Cisco Webex','dashboard','https://www.webex.com','commercial',['webex'],['IM','视频会议','video conferencing']],
  ['element','Element','dashboard','https://element.io','open-source',['element chat'],['IM','Matrix','即时通讯'],'https://github.com/element-hq/element-web'],
  ['rocket-chat','Rocket.Chat','dashboard','https://www.rocket.chat','unverified',['rocketchat'],['IM','企业协作'],'https://github.com/RocketChat/Rocket.Chat'],
  ['zulip','Zulip','dashboard','https://zulip.com','open-source',[],['IM','企业协作'],'https://github.com/zulip/zulip'],
  ['servicenow','ServiceNow','vendor','https://www.servicenow.com','commercial',['service now'],['ITSM','IT 服务管理','工单','workflow']],
].map(([id,name,source,homepage,softwareType,aliases,tags,repository])=>({id,name,source,homepage,softwareType,aliases,tags,repository:repository??null}));

export const communicationMetadata = new Map(communicationProjects.map(project=>[project.id,project]));
