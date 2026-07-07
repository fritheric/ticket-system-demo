import { create } from 'zustand'
import { persist, type PersistStorage } from 'zustand/middleware'
import type {
  View,
  Ticket,
  User,
  Interception,
  IncidentRecord,
  MajorCase,
  MajorCaseFollowUp,
  KnowledgeArticle,
  Notification,
  AuditLog,
  SystemSettings,
} from '../types'

// ==================== LocalStorage 存储 ====================
const DEMO_PREFIX = 'demo_'

const storage: PersistStorage<unknown> = {
  getItem: (name: string) => {
    const value = localStorage.getItem(name)
    if (value === null) return null
    return JSON.parse(value)
  },
  setItem: (name: string, value: unknown) => {
    localStorage.setItem(name, JSON.stringify(value))
  },
  removeItem: (name: string) => {
    localStorage.removeItem(name)
  },
}

// ==================== 编号计数器（按日期每日重置） ====================
interface CounterState {
  date: string
  ticketSeq: number
  caseSeq: number
}

function getTodayStr(): string {
  const d = new Date()
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
}

function loadCounter(): CounterState {
  const raw = localStorage.getItem(`${DEMO_PREFIX}counters`)
  const today = getTodayStr()
  if (raw) {
    try {
      const parsed: CounterState = JSON.parse(raw)
      if (parsed.date === today) return parsed
    } catch { /* ignore */ }
  }
  return { date: today, ticketSeq: 0, caseSeq: 0 }
}

function saveCounter(state: CounterState): void {
  localStorage.setItem(`${DEMO_PREFIX}counters`, JSON.stringify(state))
}

function generateTicketNo(): string {
  const counter = loadCounter()
  counter.ticketSeq += 1
  saveCounter(counter)
  return `GD-${counter.date}-${String(counter.ticketSeq).padStart(3, '0')}`
}

function generateCaseNo(): string {
  const counter = loadCounter()
  counter.caseSeq += 1
  saveCounter(counter)
  return `ZD-${counter.date}-${String(counter.caseSeq).padStart(3, '0')}`
}

// ==================== 脱敏函数 ====================
function maskIdCard(idCard: string): string {
  if (idCard.length < 8) return idCard
  return idCard.slice(0, 3) + '*'.repeat(idCard.length - 7) + idCard.slice(-4)
}

function maskPhone(phone: string): string {
  if (phone.length < 8) return phone
  return phone.slice(0, 3) + '****' + phone.slice(-4)
}

function maskRiderId(riderId: string): string {
  if (riderId.length < 6) return riderId
  return riderId.slice(0, 2) + '****' + riderId.slice(-4)
}

// ==================== 拼音首字母映射 ====================
const PY: Record<string, string> = {
  '张':'z',
  '王':'w',
  '李':'l',
  '赵':'z',
  '刘':'l',
  '陈':'c',
  '杨':'y',
  '黄':'h',
  '周':'z',
  '吴':'w',
  '徐':'x',
  '孙':'s',
  '马':'m',
  '朱':'z',
  '胡':'h',
  '郭':'g',
  '何':'h',
  '高':'g',
  '林':'l',
  '罗':'l',
  '郑':'z',
  '梁':'l',
  '谢':'x',
  '宋':'s',
  '唐':'t',
  '许':'x',
  '韩':'h',
  '冯':'f',
  '邓':'d',
  '曹':'c',
  '彭':'p',
  '曾':'z',
  '肖':'x',
  '田':'t',
  '董':'d',
  '袁':'y',
  '潘':'p',
  '于':'y',
  '蒋':'j',
  '蔡':'c',
  '余':'y',
  '杜':'d',
  '叶':'y',
  '程':'c',
  '魏':'w',
  '苏':'s',
  '吕':'l',
  '丁':'d',
  '任':'r',
  '沈':'s',
  '姚':'y',
  '卢':'l',
  '姜':'j',
  '崔':'c',
  '钟':'z',
  '谭':'t',
  '陆':'l',
  '汪':'w',
  '范':'f',
  '金':'j',
  '石':'s',
  '廖':'l',
  '贾':'j',
  '夏':'x',
  '韦':'w',
  '付':'f',
  '方':'f',
  '白':'b',
  '邹':'z',
  '孟':'m',
  '熊':'x',
  '秦':'q',
  '邱':'q',
  '江':'j',
  '尹':'y',
  '薛':'x',
  '闫':'y',
  '雷':'l',
  '侯':'h',
  '龙':'l',
  '史':'s',
  '陶':'t',
  '黎':'l',
  '贺':'h',
  '顾':'g',
  '毛':'m',
  '郝':'h',
  '龚':'g',
  '邵':'s',
  '万':'w',
  '钱':'q',
  '严':'y',
  '覃':'q',
  '武':'w',
  '戴':'d',
  '莫':'m',
  '孔':'k',
  '向':'x',
  '常':'c',
  '温':'w',
  '康':'k',
  '施':'s',
  '文':'w',
  '牛':'n',
  '洪':'h',
  '岳':'y',
  '段':'d',
  '路':'l',
  '房':'f',
  '童':'t',
  '颜':'y',
  '齐':'q',
  '兰':'l',
  '聂':'n',
  '褚':'c',
  '卫':'w',
  '昌':'c',
  '鲁':'l',
  '尤':'y',
  '毕':'b',
  '季':'j',
  '麻':'m',
  '项':'x',
  '祝':'z',
  '阮':'r',
  '闵':'m',
  '席':'x',
  '强':'q',
  '骆':'l',
  '舒':'s',
  '柯':'k',
  '管':'g',
  '凌':'l',
  '甄':'z',
  '曲':'q',
  '纪':'j',
  '庞':'p',
  '倪':'n',
  '盛':'s',
  '刁':'d',
  '樊':'f',
  '霍':'h',
  '虞':'y',
  '支':'z',
  '昝':'z',
  '缪':'m',
  '干':'g',
  '解':'x',
  '应':'y',
  '宗':'z',
  '宣':'x',
  '郁':'y',
  '单':'s',
  '杭':'h',
  '包':'b',
  '诸':'z',
  '左':'z',
  '吉':'j',
  '钮':'n',
  '邢':'x',
  '滑':'h',
  '裴':'p',
  '荣':'r',
  '翁':'w',
  '荀':'x',
  '羊':'y',
  '於':'y',
  '惠':'h',
  '家':'j',
  '封':'f',
  '芮':'r',
  '羿':'y',
  '储':'c',
  '靳':'j',
  '汲':'j',
  '邴':'b',
  '糜':'m',
  '松':'s',
  '井':'j',
  '富':'f',
  '巫':'w',
  '乌':'w',
  '焦':'j',
  '巴':'b',
  '弓':'g',
  '牧':'m',
  '隗':'w',
  '谷':'g',
  '车':'c',
  '宓':'m',
  '蓬':'p',
  '全':'q',
  '郗':'x',
  '班':'b',
  '仰':'y',
  '秋':'q',
  '仲':'z',
  '伊':'y',
  '宫':'g',
  '宁':'n',
  '仇':'c',
  '栾':'l',
  '暴':'b',
  '甘':'g',
  '钭':'t',
  '厉':'l',
  '戎':'r',
  '祖':'z',
  '符':'f',
  '景':'j',
  '詹':'z',
  '束':'s',
  '幸':'x',
  '司':'s',
  '韶':'s',
  '郜':'g',
  '蓟':'j',
  '溥':'p',
  '印':'y',
  '宿':'s',
  '怀':'h',
  '蒲':'p',
  '邰':'t',
  '从':'c',
  '鄂':'e',
  '索':'s',
  '咸':'x',
  '籍':'j',
  '赖':'l',
  '卓':'z',
  '蔺':'l',
  '屠':'t',
  '蒙':'m',
  '池':'c',
  '乔':'q',
  '胥':'x',
  '能':'n',
  '苍':'c',
  '双':'s',
  '闻':'w',
  '莘':'s',
  '党':'d',
  '翟':'z',
  '贡':'g',
  '劳':'l',
  '逄':'p',
  '姬':'j',
  '申':'s',
  '扶':'f',
  '堵':'d',
  '冉':'r',
  '宰':'z',
  '郦':'l',
  '雍':'y',
  '却':'q',
  '璩':'q',
  '桑':'s',
  '桂':'g',
  '濮':'p',
  '寿':'s',
  '通':'t',
  '边':'b',
  '扈':'h',
  '燕':'y',
  '冀':'j',
  '郏':'j',
  '浦':'p',
  '尚':'s',
  '农':'n',
  '晏':'y',
  '瞿':'q',
  '饶':'r',
  '毋':'w',
  '连':'l',
  '习':'x',
  '易':'y',
  '慎':'s',
  '戈':'g',
  '庾':'y',
  '终':'z',
  '暨':'j',
  '衡':'h',
  '步':'b',
  '都':'d',
  '耿':'g',
  '满':'m',
  '弘':'h',
  '匡':'k',
  '国':'g',
  '寇':'k',
  '广':'g',
  '禄':'l',
  '阙':'q',
  '东':'d',
  '欧':'o',
  '殳':'s',
  '沃':'w',
  '利':'l',
  '蔚':'w',
  '越':'y',
  '夔':'k',
  '隆':'l',
  '师':'s',
  '巩':'g',
  '厍':'s',
  '晁':'c',
  '勾':'g',
  '敖':'a',
  '融':'r',
  '冷':'l',
  '訾':'z',
  '辛':'x',
  '阚':'k',
  '那':'n',
  '简':'j',
  '空':'k',
  '母':'m',
  '沙':'s',
  '乜':'n',
  '养':'y',
  '鞠':'j',
  '须':'x',
  '丰':'f',
  '巢':'c',
  '关':'g',
  '蒯':'k',
  '相':'x',
  '查':'c',
  '后':'h',
  '荆':'j',
  '红':'h',
  '游':'y',
  '竺':'z',
  '权':'q',
  '逯':'l',
  '盖':'g',
  '益':'y',
  '桓':'h',
  '公':'g',
  '牟':'m',
  '哈':'h',
  '福':'f',
  '爱':'a',
  '阳':'y',
  '佟':'t',
  '言':'y',
  '第':'d',
  '安':'a',
  '伟':'w',
  '芳':'f',
  '娜':'n',
  '敏':'m',
  '静':'j',
  '丽':'l',
  '磊':'l',
  '军':'j',
  '洋':'y',
  '勇':'y',
  '艳':'y',
  '杰':'j',
  '娟':'j',
  '涛':'t',
  '明':'m',
  '超':'c',
  '秀':'x',
  '英':'y',
  '华':'h',
  '平':'p',
  '刚':'g',
  '云':'y',
  '鑫':'x',
  '玲':'l',
  '飞':'f',
  '辉':'h',
  '建':'j',
  '庆':'q',
  '德':'d',
  '峰':'f',
  '波':'b',
  '亮':'l',
  '成':'c',
  '旭':'x',
  '晨':'c',
  '浩':'h',
  '然':'r',
  '宇':'y',
  '轩':'x',
  '子':'z',
  '涵':'h',
  '雨':'y',
  '思':'s',
  '佳':'j',
  '欣':'x',
  '怡':'y',
  '悦':'y',
  '梦':'m',
  '雪':'x',
  '婷':'t',
  '妍':'y',
  '瑶':'y',
  '萱':'x',
  '琳':'l',
  '琪':'q',
  '瑞':'r',
  '鹏':'p',
  '昊':'h',
  '航':'h',
  '天':'t',
  '祥':'x',
  '虎':'h',
  '斌':'b',
  '威':'w',
  '凯':'k',
  '博':'b',
  '远':'y',
  '翔':'x',
  '逸':'y',
  '睿':'r',
  '哲':'z',
  '宏':'h',
  '达':'d',
  '良':'l',
  '兴':'x',
  '海':'h',
  '河':'h',
  '山':'s',
  '柏':'b',
  '青':'q',
  '梅':'m',
  '竹':'z',
  '菊':'j',
  '莲':'l',
  '春':'c',
  '冬':'d',
  '风':'f',
  '冰':'b',
  '光':'g',
  '星':'x',
  '日':'r',
  '南':'n',
  '小':'x',
  '大':'d',
  '心':'x',
  '志':'z',
  '乐':'l',
  '健':'j',
  '俊':'j',
  '贤':'x',
  '慧':'h',
  '毅':'y',
  '谦':'q',
  '豪':'h',
  '义':'y',
  '信':'x',
  '仁':'r',
  '智':'z',
  '忠':'z',
  '孝':'x',
  '和':'h',
  '顺':'s',
  '正':'z',
  '清':'q',
  '廉':'l',
  '朗':'l',
  '晴':'q',
  '霞':'x',
  '露':'l',
  '霜':'s',
  '虹':'h',
  '珊':'s',
  '珠':'z',
  '宝':'b',
  '玉':'y',
  '翠':'c',
  '花':'h',
  '芝':'z',
  '芬':'f',
  '馨':'x',
  '香':'x',
  '美':'m',
  '善':'s',
  '淑':'s',
  '雅':'y',
  '洁':'j',
  '丹':'d',
  '彤':'t',
  '紫':'z',
  '蓝':'l',
  '绿':'l',
  '银':'y',
  '彩':'c',
  '影':'y',
  '映':'y',
  '含':'h',
  '念':'n',
  '忆':'y',
  '语':'y',
  '诗':'s',
  '章':'z',
  '书':'s',
  '画':'h',
  '琴':'q',
  '音':'y',
  '律':'l',
  '歌':'g',
  '舞':'w',
  '嘉':'j',
  '熙':'x',
  '一':'y',
  '亦':'y',
  '其':'q',
  '永':'y',
  '辰':'c',
  '煜':'y',
  '霖':'l',
  '翰':'h',
  '铭':'m',
  '瑜':'y',
  '玥':'y',
  '珂':'k',
  '珩':'h',
  '璐':'l',
  '璇':'x',
  '璧':'b',
  '璨':'c',
  '莹':'y',
  '菲':'f',
  '薇':'w',
  '蕾':'l',
  '萌':'m',
  '蕊':'r',
  '荷':'h',
  '菱':'l',
  '萍':'p',
  '莎':'s',
  '莉':'l',
  '茜':'q',
  '茵':'y',
  '茹':'r',
  '芷':'z',
  '芸':'y',
  '彦':'y',
  '儒':'r',
  '腾':'t',
  '耀':'y',
  '冠':'g',
  '垚':'y',
  '彪':'b',
  '祺':'q',
  '泰':'t',
  '如':'r',
  '意':'y',
  '足':'z',
  '欢':'h',
  '愿':'y',
  '望':'w',
  '盼':'p',
  '情':'q',
  '恩':'e',
  '慈':'c',
  '悲':'b',
  '怜':'l',
  '恤':'x',
  '惜':'x',
  '珍':'z',
  '贵':'g',
  '尊':'z',
  '敬':'j',
  '畏':'w',
  '惧':'j',
  '恐':'k',
  '怕':'p',
  '怒':'n',
  '愤':'f',
  '恨':'h',
  '怨':'y',
  '愁':'c',
  '忧':'y',
  '虑':'l',
  '烦':'f',
  '闷':'m',
  '道':'d',
  '礼':'l',
  '勤':'q',
  '俭':'j',
  '恕':'s',
  '宽':'k',
  '容':'r',
  '忍':'r',
  '让':'r',
  '恭':'g',
  '睦':'m',
  '等':'d',
  '直':'z',
  '坚':'j',
  '贞':'z',
  '豁':'h',
  '开':'k',
  '畅':'c',
  '流':'l',
  '快':'k',
  '速':'s',
  '急':'j',
  '迅':'x',
  '猛':'m',
  '烈':'l',
  '壮':'z',
  '旺':'w',
  '茂':'m',
  '繁':'f',
  '俏':'q',
  '帅':'s',
  '优':'y',
  '灵':'l',
  '巧':'q',
  '妙':'m',
  '奇':'q',
  '异':'y',
  '特':'t',
  '独':'d',
  '稀':'x',
  '罕':'h',
  '缺':'q',
  '乏':'f',
  '穷':'q',
  '困':'k',
  '难':'n',
  '艰':'j',
  '苦':'k',
  '痛':'t',
  '疼':'t',
  '痒':'y',
  '累':'l',
  '疲':'p',
  '倦':'j',
  '梓':'z',
  '宸':'c',
  '二':'e',
  '三':'s',
  '四':'s',
  '五':'w',
  '六':'l',
  '七':'q',
  '八':'b',
  '九':'j',
  '十':'s',
  '百':'b',
  '千':'q',
  '亿':'y',
  '凤':'f',
  '鹤':'h',
  '鹰':'y',
  '狮':'s',
  '豹':'b',
  '狼':'l',
  '狐':'h',
  '狸':'l',
  '鹿':'l',
  '象':'x',
  '猴':'h',
  '猿':'y',
  '蛇':'s',
  '鱼':'y',
  '龟':'g',
  '虾':'x',
  '蟹':'x',
  '猪':'z',
  '狗':'g',
  '鸡':'j',
  '鸭':'y',
  '鹅':'e',
  '鸟':'n',
  '鸽':'g',
  '猫':'m',
  '兔':'t',
  '鼠':'s',
  '草':'c',
  '树':'s',
  '杏':'x',
  '梨':'l',
  '枣':'z',
  '柳':'l',
  '枫':'f',
  '樱':'y',
  '铜':'t',
  '铁':'t',
  '钢':'g',
  '碧':'b',
  '琅':'l',
  '瑾':'j',
  '璟':'j',
  '璎':'y',
  '锋':'f',
  '锐':'r',
  '键':'j',
  '铃':'l',
  '铄':'s',
  '铎':'d',
  '钰':'y',
  '中':'z',
  '人':'r',
  '民':'m',
  '生':'s',
  '时':'s',
  '代':'d',
  '世':'s',
  '界':'j',
  '社':'s',
  '会':'h',
  '主':'z',
  '政':'z',
  '府':'f',
  '法':'f',
  '院':'y',
  '校':'x',
  '企':'q',
  '业':'y',
  '经':'j',
  '营':'y',
  '理':'l',
  '科':'k',
  '技':'j',
  '发':'f',
  '展':'z',
  '设':'s',
  '教':'j',
  '育':'y',
  '化':'h',
  '体':'t',
  '保':'b',
  '险':'x',
  '行':'h',
  '息':'x',
  '网':'w',
  '电':'d',
  '话':'h',
  '讯':'x',
  '邮':'y',
  '物':'w',
  '运':'y',
  '输':'s',
  '仓':'c',
  '加':'j',
  '工':'g',
  '制':'z',
  '造':'z',
  '产':'c',
  '品':'p',
  '商':'s',
  '贸':'m',
  '零':'l',
  '售':'s',
  '批':'p',
  '饮':'y',
  '食':'s',
  '餐':'c',
  '馆':'g',
  '酒':'j',
  '店':'d',
  '宾':'b',
  '旅':'l',
  '区':'q',
  '观':'g',
  '娱':'y',
  '休':'x',
  '闲':'x',
  '度':'d',
  '假':'j',
  '村':'c',
  '园':'y',
  '点':'d',
  '植':'z',
  '虫':'c',
  '宠':'c',
  '医':'y',
  '诊':'z',
  '所':'s',
  '药':'y',
  '型':'x',
  '计':'j',
  '装':'z',
  '修':'x',
  '饰':'s',
  '具':'j',
  '数':'s',
  '码':'m',
  '脑':'n',
  '手':'s',
  '机':'j',
  '办':'b',
  '用':'y',
  '材':'c',
  '图':'t',
  '报':'b',
  '刊':'k',
  '杂':'z',
  '像':'x',
  '玩':'w',
  '艺':'y',
  '收':'s',
  '藏':'c',
  '鉴':'j',
  '定':'d',
  '拍':'p',
  '卖':'m',
  '览':'l',
  '演':'y',
  '出':'c',
  '比':'b',
  '赛':'s',
  '动':'d',
  '身':'s',
  '培':'p',
  '训':'x',
  '考':'k',
  '试':'s',
  '招':'z',
  '就':'j',
  '创':'c',
  '投':'t',
  '资':'z',
  '财':'c',
  '贷':'d',
  '款':'k',
  '地':'d',
  '租':'z',
  '赁':'l',
  '婚':'h',
  '摄':'s',
  '喜':'x',
  '事':'s',
  '服':'f',
  '务':'w',
  '搬':'b',
  '维':'w',
  '洗':'x',
  '汽':'q',
  '甲':'j',
  '睫':'j',
  '纹':'w',
  '绣':'x',
  '按':'a',
  '摩':'m',
  '推':'t',
  '拿':'n',
  '疗':'l',
  '护':'h',
  '寄':'j',
  '介':'j',
  '托':'t',
  '幼':'y',
  '儿':'e',
  '学':'x',
  '研':'y',
  '究':'j',
  '留':'l',
  '翻':'f',
  '译':'y',
  '版':'b',
  '纸':'z',
  '视':'s',
  '台':'t',
  '播':'b',
  '站':'z',
  '媒':'m',
  '告':'g',
  '刷':'s',
  '箱':'x',
  '塑':'s',
  '料':'l',
  '属':'s',
  '矿':'k',
  '煤':'m',
  '炭':'t',
  '力':'l',
  '厂':'c',
  '水':'s',
  '热':'r',
  '燃':'r',
  '气':'q',
  '环':'h',
  '渔':'y',
  '种':'z',
  '殖':'z',
  '饲':'s',
  '肥':'f',
  '果':'g',
  '蔬':'s',
  '菜':'c',
  '卉':'h',
  '苗':'m',
  '木':'m',
  '膜':'m',
  '油':'y',
  '脂':'z',
  '肉':'r',
  '类':'l',
  '奶':'n',
  '蛋':'d',
  '调':'t',
  '味':'w',
  '婴':'y',
  '算':'s',
  '软':'r',
  '件':'j',
  '硬':'y',
  '备':'b',
  '仪':'y',
  '器':'q',
  '表':'b',
  '瓷':'c',
  '玻':'b',
  '璃':'l',
  '铝':'l',
  '交':'j',
  '原':'y',
  '精':'j',
  '细':'x',
  '纺':'f',
  '织':'z',
  '皮':'p',
  '革':'g',
  '居':'j',
  '械':'x',
  '首':'s',
  '眼':'y',
  '镜':'j',
  '鞋':'x',
  '帽':'m',
  '染':'r',
  '面':'m',
  '辅':'f',
  '纤':'x',
  '橡':'x',
  '胶':'j',
  '泥':'n',
  '混':'h',
  '凝':'n',
  '土':'t',
  '预':'y',
  '结':'j',
  '构':'g',
  '轻':'q',
  '幕':'m',
  '墙':'q',
  '门':'m',
  '窗':'c',
  '筑':'z',
  '咨':'z',
  '询':'x',
  '监':'j',
  '价':'j',
  '标':'b',
  '承':'c',
  '总':'z',
  '专':'z',
  '分':'f',
  '勘':'k',
  '察':'c',
  '规':'g',
  '划':'h',
  '目':'m',
  '室':'s',
  '内':'n',
  '市':'s',
  '桥':'q',
  '隧':'s',
  '港':'g',
  '口':'k',
  '场':'c',
  '冶':'y',
  '自':'z',
  '消':'x',
  '防':'f',
  '古':'g',
  '基':'j',
  '腐':'f',
  '节':'j',
}


/** 将汉字转换为拼音首字母 */
function charToInitial(ch: string): string {
  return PY[ch] || ''
}

/** 将字符串转换为拼音首字母序列 */
function toPinyinInitials(str: string): string {
  let result = ''
  for (const ch of str) {
    const i = charToInitial(ch)
    if (i) result += i
  }
  return result
}

/**
 * 拼音匹配：输入拼音首字母序列，匹配中文姓名
 * 支持前缀匹配和子序列跳跃匹配
 */
function pinyinMatch(query: string, name: string): boolean {
  if (!query || !name) return false
  const q = query.toLowerCase().trim()
  const initials = toPinyinInitials(name)
  if (initials.startsWith(q)) return true
  // 子序列跳跃匹配
  let qi = 0
  for (let i = 0; i < initials.length && qi < q.length; i++) {
    if (initials[i] === q[qi]) qi++
  }
  return qi === q.length
}

// ==================== 默认系统设置 ====================
const defaultSettings: SystemSettings = {
  timeoutRules: { low: 48, medium: 24, high: 12, urgent: 4 },
  interceptTypes: [],
  handleMethods: [],
  fraudTypes: ['A类', 'B类', 'C类', 'D类', 'E类'],
  insuranceTypes: ['意外险', '三者险', '职伤险'],
  accidentParties: ['骑手方', '对方', '双方'],
  liabilities: ['骑手全责', '骑手主责', '同等责任', '对方主责', '对方全责', '无法认定'],
  causes: ['交通事故', '摔倒', '碰撞', '疾病', '其他'],
  accidentTypes: ['单方事故', '双方事故', '多方事故'],
  caseTypes: ['意外', '三者'],
  stages: ['发现', '上报', '处置中', '结案'],
  knowledgeCategories: [],
  priorities: ['低', '中', '高', '紧急'],
  ticketStatuses: ['待处理', '已超时', '已完成'],
}

// ==================== 默认用户 ====================
function createDefaultUsers(): User[] {
  return [
    {
      id: 'user-001',
      username: 'admin',
      password: 'admin123',
      name: '管理员',
      role: 'admin',
      isPrimary: true,
      isLocked: false,
      isDeleted: false,
      mustChangePassword: true,
      createdAt: new Date().toISOString(),
    },
  ]
}

// ==================== Store 类型 ====================
interface StoreState {
  currentUser: User | null
  view: View
  users: User[]
  tickets: Ticket[]
  interceptions: Interception[]
  incidents: IncidentRecord[]
  majorCases: MajorCase[]
  articles: KnowledgeArticle[]
  notifications: Notification[]
  auditLogs: AuditLog[]
  settings: SystemSettings

  login: (username: string, password: string) => boolean
  logout: () => void
  getCurrentUser: () => User | null
  setView: (view: View) => void

  createTicket: (data: Omit<Ticket, 'id' | 'ticketNo' | 'createdAt' | 'updatedAt' | 'isDeleted' | 'transferStatus'>) => Ticket
  updateTicket: (id: string, data: Partial<Ticket>) => void
  deleteTicket: (id: string) => void
  restoreTicket: (id: string) => void

  createInterception: (data: Omit<Interception, 'id' | 'createdAt' | 'updatedAt' | 'isDeleted'>) => Interception
  updateInterception: (id: string, data: Partial<Interception>) => void
  deleteInterception: (id: string) => void
  restoreInterception: (id: string) => void

  createIncident: (data: Omit<IncidentRecord, 'id' | 'createdAt' | 'updatedAt' | 'isDeleted'>) => IncidentRecord
  updateIncident: (id: string, data: Partial<IncidentRecord>) => void
  deleteIncident: (id: string) => void
  restoreIncident: (id: string) => void

  createMajorCase: (data: Omit<MajorCase, 'id' | 'caseNo' | 'createdAt' | 'updatedAt' | 'isDeleted' | 'followUps'>) => MajorCase
  updateMajorCase: (id: string, data: Partial<MajorCase>) => void
  deleteMajorCase: (id: string) => void
  restoreMajorCase: (id: string) => void
  addFollowUp: (caseId: string, content: string) => void

  createArticle: (data: Omit<KnowledgeArticle, 'id' | 'createdAt' | 'updatedAt'>) => KnowledgeArticle
  updateArticle: (id: string, data: Partial<KnowledgeArticle>) => void
  deleteArticle: (id: string) => void

  markRead: (id: string) => void
  markAllRead: (userId: string) => void
  addAuditLog: (userId: string, userName: string, action: string, module: string, detail: Record<string, unknown>) => void
  updateSettings: (data: Partial<SystemSettings>) => void

  createUser: (data: Omit<User, 'id' | 'createdAt'>) => User
  updateUser: (id: string, data: Partial<User>) => void
  updateCurrentUser: (data: Partial<User>) => void
  deleteUser: (id: string) => void
  resetPassword: (id: string, newPassword: string) => void
  lockUser: (id: string, locked: boolean) => void

  generateTicketNo: () => string
  generateCaseNo: () => string
  maskIdCard: (idCard: string) => string
  maskPhone: (phone: string) => string
  maskRiderId: (riderId: string) => string
  pinyinMatch: (query: string, name: string) => boolean
}

function genId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      view: 'dashboard',
      users: createDefaultUsers(),
      tickets: [],
      interceptions: [],
      incidents: [],
      majorCases: [],
      articles: [],
      notifications: [],
      auditLogs: [],
      settings: defaultSettings,

      // ========== 认证 ==========
      login: (username: string, password: string): boolean => {
        const user = get().users.find(
          (u) => u.username === username && u.password === password && !u.isDeleted && !u.isLocked,
        )
        if (user) { set({ currentUser: user }); return true }
        return false
      },
      logout: (): void => { set({ currentUser: null }) },
      getCurrentUser: (): User | null => get().currentUser,
      setView: (view: View): void => { set({ view }) },

      // ========== 工单 CRUD ==========
      createTicket: (
        data: Omit<Ticket, 'id' | 'ticketNo' | 'createdAt' | 'updatedAt' | 'isDeleted' | 'transferStatus'>,
      ): Ticket => {
        const now = new Date().toISOString()
        const ticket: Ticket = {
          ...data, id: genId(), ticketNo: generateTicketNo(),
          status: 'pending', createdAt: now, updatedAt: now,
          isDeleted: false, transferStatus: 'none',
        }
        set((s) => ({ tickets: [...s.tickets, ticket] }))
        const cu = get().currentUser
        if (cu) get().addAuditLog(cu.id, cu.name, '新增工单', '工单', { ticketId: ticket.id, ticketNo: ticket.ticketNo })
        return ticket
      },
      updateTicket: (id: string, data: Partial<Ticket>): void => {
        const cu = get().currentUser
        set((s) => ({
          tickets: s.tickets.map((t) =>
            t.id === id ? { ...t, ...data, updatedAt: new Date().toISOString(),
              ...(data.status === 'completed' && !t.completedAt ? { completedAt: new Date().toISOString() } : {}),
            } : t),
        }))
        if (cu) get().addAuditLog(cu.id, cu.name, '修改工单', '工单', { ticketId: id })
      },
      deleteTicket: (id: string): void => {
        const cu = get().currentUser
        set((s) => ({ tickets: s.tickets.map((t) => t.id === id ? { ...t, isDeleted: true, updatedAt: new Date().toISOString() } : t) }))
        if (cu) get().addAuditLog(cu.id, cu.name, '删除工单', '工单', { ticketId: id })
      },
      restoreTicket: (id: string): void => {
        const cu = get().currentUser
        set((s) => ({ tickets: s.tickets.map((t) => t.id === id ? { ...t, isDeleted: false, updatedAt: new Date().toISOString() } : t) }))
        if (cu) get().addAuditLog(cu.id, cu.name, '恢复工单', '工单', { ticketId: id })
      },

      // ========== 拦截记录 CRUD ==========
      createInterception: (
        data: Omit<Interception, 'id' | 'createdAt' | 'updatedAt' | 'isDeleted'>,
      ): Interception => {
        const now = new Date().toISOString()
        const item: Interception = { ...data, id: genId(), createdAt: now, updatedAt: now, isDeleted: false }
        set((s) => ({ interceptions: [...s.interceptions, item] }))
        const cu = get().currentUser
        if (cu) get().addAuditLog(cu.id, cu.name, '新增拦截记录', '拦截记录', { interceptionId: item.id })
        return item
      },
      updateInterception: (id: string, data: Partial<Interception>): void => {
        const cu = get().currentUser
        set((s) => ({ interceptions: s.interceptions.map((i) => i.id === id ? { ...i, ...data, updatedAt: new Date().toISOString() } : i) }))
        if (cu) get().addAuditLog(cu.id, cu.name, '修改拦截记录', '拦截记录', { interceptionId: id })
      },
      deleteInterception: (id: string): void => {
        const cu = get().currentUser
        set((s) => ({ interceptions: s.interceptions.map((i) => i.id === id ? { ...i, isDeleted: true, updatedAt: new Date().toISOString() } : i) }))
        if (cu) get().addAuditLog(cu.id, cu.name, '删除拦截记录', '拦截记录', { interceptionId: id })
      },
      restoreInterception: (id: string): void => {
        const cu = get().currentUser
        set((s) => ({ interceptions: s.interceptions.map((i) => i.id === id ? { ...i, isDeleted: false, updatedAt: new Date().toISOString() } : i) }))
        if (cu) get().addAuditLog(cu.id, cu.name, '恢复拦截记录', '拦截记录', { interceptionId: id })
      },

      // ========== 出险记录 CRUD ==========
      createIncident: (
        data: Omit<IncidentRecord, 'id' | 'createdAt' | 'updatedAt' | 'isDeleted'>,
      ): IncidentRecord => {
        const now = new Date().toISOString()
        const item: IncidentRecord = { ...data, id: genId(), createdAt: now, updatedAt: now, isDeleted: false }
        set((s) => ({ incidents: [...s.incidents, item] }))
        const cu = get().currentUser
        if (cu) get().addAuditLog(cu.id, cu.name, '新增出险记录', '出险记录', { incidentId: item.id })
        return item
      },
      updateIncident: (id: string, data: Partial<IncidentRecord>): void => {
        const cu = get().currentUser
        set((s) => ({ incidents: s.incidents.map((i) => i.id === id ? { ...i, ...data, updatedAt: new Date().toISOString() } : i) }))
        if (cu) get().addAuditLog(cu.id, cu.name, '修改出险记录', '出险记录', { incidentId: id })
      },
      deleteIncident: (id: string): void => {
        const cu = get().currentUser
        set((s) => ({ incidents: s.incidents.map((i) => i.id === id ? { ...i, isDeleted: true, updatedAt: new Date().toISOString() } : i) }))
        if (cu) get().addAuditLog(cu.id, cu.name, '删除出险记录', '出险记录', { incidentId: id })
      },
      restoreIncident: (id: string): void => {
        const cu = get().currentUser
        set((s) => ({ incidents: s.incidents.map((i) => i.id === id ? { ...i, isDeleted: false, updatedAt: new Date().toISOString() } : i) }))
        if (cu) get().addAuditLog(cu.id, cu.name, '恢复出险记录', '出险记录', { incidentId: id })
      },

      // ========== 重大案件 CRUD ==========
      createMajorCase: (
        data: Omit<MajorCase, 'id' | 'caseNo' | 'createdAt' | 'updatedAt' | 'isDeleted' | 'followUps'>,
      ): MajorCase => {
        const now = new Date().toISOString()
        const mc: MajorCase = { ...data, id: genId(), caseNo: generateCaseNo(), createdAt: now, updatedAt: now, isDeleted: false, followUps: [] }
        set((s) => ({ majorCases: [...s.majorCases, mc] }))
        const cu = get().currentUser
        if (cu) get().addAuditLog(cu.id, cu.name, '新增重大案件', '重大案件', { caseId: mc.id, caseNo: mc.caseNo })
        return mc
      },
      updateMajorCase: (id: string, data: Partial<MajorCase>): void => {
        const cu = get().currentUser
        set((s) => ({ majorCases: s.majorCases.map((m) => m.id === id ? { ...m, ...data, updatedAt: new Date().toISOString() } : m) }))
        if (cu) get().addAuditLog(cu.id, cu.name, '修改重大案件', '重大案件', { caseId: id })
      },
      deleteMajorCase: (id: string): void => {
        const cu = get().currentUser
        set((s) => ({ majorCases: s.majorCases.map((m) => m.id === id ? { ...m, isDeleted: true, updatedAt: new Date().toISOString() } : m) }))
        if (cu) get().addAuditLog(cu.id, cu.name, '删除重大案件', '重大案件', { caseId: id })
      },
      restoreMajorCase: (id: string): void => {
        const cu = get().currentUser
        set((s) => ({ majorCases: s.majorCases.map((m) => m.id === id ? { ...m, isDeleted: false, updatedAt: new Date().toISOString() } : m) }))
        if (cu) get().addAuditLog(cu.id, cu.name, '恢复重大案件', '重大案件', { caseId: id })
      },
      addFollowUp: (caseId: string, content: string): void => {
        const cu = get().currentUser
        const fu: MajorCaseFollowUp = {
          id: genId(), caseId, followTime: new Date().toISOString(),
          followerId: cu?.id || '', followerName: cu?.name || '', content, createdAt: new Date().toISOString(),
        }
        set((s) => ({
          majorCases: s.majorCases.map((m) => m.id === caseId ? { ...m, followUps: [...m.followUps, fu], updatedAt: new Date().toISOString() } : m),
        }))
        if (cu) get().addAuditLog(cu.id, cu.name, '添加跟进记录', '重大案件', { caseId, followUpId: fu.id })
      },

      // ========== 知识库 CRUD ==========
      createArticle: (data: Omit<KnowledgeArticle, 'id' | 'createdAt' | 'updatedAt'>): KnowledgeArticle => {
        const now = new Date().toISOString()
        const art: KnowledgeArticle = { ...data, id: genId(), createdAt: now, updatedAt: now }
        set((s) => ({ articles: [...s.articles, art] }))
        const cu = get().currentUser
        if (cu) get().addAuditLog(cu.id, cu.name, '新增知识库文章', '知识库', { articleId: art.id, title: art.title })
        return art
      },
      updateArticle: (id: string, data: Partial<KnowledgeArticle>): void => {
        const cu = get().currentUser
        set((s) => ({ articles: s.articles.map((a) => a.id === id ? { ...a, ...data, updatedAt: new Date().toISOString() } : a) }))
        if (cu) get().addAuditLog(cu.id, cu.name, '修改知识库文章', '知识库', { articleId: id })
      },
      deleteArticle: (id: string): void => {
        const cu = get().currentUser
        set((s) => ({ articles: s.articles.filter((a) => a.id !== id) }))
        if (cu) get().addAuditLog(cu.id, cu.name, '删除知识库文章', '知识库', { articleId: id })
      },

      // ========== 通知 ==========
      markRead: (id: string): void => {
        set((s) => ({ notifications: s.notifications.map((n) => n.id === id ? { ...n, isRead: true } : n) }))
      },
      markAllRead: (userId: string): void => {
        set((s) => ({ notifications: s.notifications.map((n) => n.userId === userId ? { ...n, isRead: true } : n) }))
      },

      // ========== 操作日志 ==========
      addAuditLog: (userId: string, userName: string, action: string, module: string, detail: Record<string, unknown>): void => {
        const log: AuditLog = { id: genId(), userId, userName, action, module, detail, createdAt: new Date().toISOString() }
        set((s) => ({ auditLogs: [...s.auditLogs, log] }))
      },

      // ========== 系统设置 ==========
      updateSettings: (data: Partial<SystemSettings>): void => {
        const cu = get().currentUser
        set((s) => ({ settings: { ...s.settings, ...data } }))
        if (cu) get().addAuditLog(cu.id, cu.name, '修改系统设置', '系统设置', { changes: data })
      },

      // ========== 用户管理 ==========
      createUser: (data: Omit<User, 'id' | 'createdAt'>): User => {
        const user: User = { ...data, id: genId(), createdAt: new Date().toISOString() }
        set((s) => ({ users: [...s.users, user] }))
        const cu = get().currentUser
        if (cu) get().addAuditLog(cu.id, cu.name, '新增用户', '用户管理', { userId: user.id, username: user.username, role: user.role })
        return user
      },
      updateUser: (id: string, data: Partial<User>): void => {
        const cu = get().currentUser
        set((s) => ({ users: s.users.map((u) => u.id === id ? { ...u, ...data } : u) }))
        if (cu && cu.id === id) { set({ currentUser: { ...cu, ...data } }) }
        if (cu) get().addAuditLog(cu.id, cu.name, '修改用户', '用户管理', { userId: id })
      },
      updateCurrentUser: (data: Partial<User>): void => {
        const cu = get().currentUser
        if (cu) {
          set((s) => ({
            users: s.users.map((u) => u.id === cu.id ? { ...u, ...data } : u),
            currentUser: { ...cu, ...data }
          }))
        }
      },
      deleteUser: (id: string): void => {
        const cu = get().currentUser
        set((s) => ({ users: s.users.map((u) => u.id === id ? { ...u, isDeleted: true } : u) }))
        if (cu) get().addAuditLog(cu.id, cu.name, '删除用户', '用户管理', { userId: id })
      },
      resetPassword: (id: string, newPassword: string): void => {
        const cu = get().currentUser
        set((s) => ({ users: s.users.map((u) => u.id === id ? { ...u, password: newPassword } : u) }))
        if (cu) get().addAuditLog(cu.id, cu.name, '重置密码', '用户管理', { userId: id })
      },
      lockUser: (id: string, locked: boolean): void => {
        const cu = get().currentUser
        set((s) => ({ users: s.users.map((u) => u.id === id ? { ...u, isLocked: locked } : u) }))
        if (cu) get().addAuditLog(cu.id, cu.name, locked ? '锁定用户' : '解锁用户', '用户管理', { userId: id })
      },

      // ========== 工具函数 ==========
      generateTicketNo,
      generateCaseNo,
      maskIdCard,
      maskPhone,
      maskRiderId,
      pinyinMatch,
    }),
    {
      name: `${DEMO_PREFIX}store`,
      storage,
      partialize: (state) => ({
        ...state,
        currentUser: null,
        view: 'dashboard' as View,
      }),
    },
  ),
)

// ==================== 导出工具函数 ====================
export { generateTicketNo, generateCaseNo, maskIdCard, maskPhone, maskRiderId, pinyinMatch }
export type { StoreState }
