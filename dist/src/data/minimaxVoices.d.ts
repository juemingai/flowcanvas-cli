/**
 * MiniMax TTS 系统音色数据（327 个系统音色）
 * 数据来源: MiniMax 官方文档，与前端保持一致
 */
export interface SystemVoice {
    id: string;
    name: string;
    lang: string;
}
export declare const VOICE_LANG_GROUPS: readonly ["中文 (普通话)", "中文 (粤语)", "英文", "日文", "韩文", "西班牙文", "葡萄牙文", "法文", "印尼文", "德文", "俄文", "意大利文", "阿拉伯文", "土耳其文", "乌克兰文", "荷兰文", "越南文", "泰文", "波兰文", "罗马尼亚文", "希腊文", "捷克文", "芬兰文", "印地文"];
export declare const MINIMAX_VOICES: SystemVoice[];
