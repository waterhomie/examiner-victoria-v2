# Examiner Victoria V3 运行时诊断说明

## 系统检测入口

当前手机端从 `More → System check` 进入现有轻量运行时诊断面板。主页面不再单独显示 `System check` 按钮；该入口不改变主练习流程，也不会调用真实 LLM、STT 或 TTS provider。

## 检测项目含义

### 页面环境

显示当前页面是否为 HTTPS、是否为 secure context、基础 user agent、设备类型、是否为微信内置浏览器、是否为 iOS/iPadOS 或 Android。检测只使用浏览器公开信息，不做复杂指纹追踪。

### 后端连接

前端调用 `GET /api/diagnostics/runtime`，显示 API 是否可达、请求耗时和友好错误提示。该接口只返回非敏感布尔值和服务器时间，不返回 Secret、Token、完整环境变量、内部路径或堆栈。

### 录音能力

系统检测会检查：

- `navigator.mediaDevices` 是否存在。
- `getUserMedia` 是否存在。
- `MediaRecorder` 是否存在。
- 常见音频 MIME 支持情况：`audio/webm`、`audio/webm;codecs=opus`、`audio/mp4`、`audio/ogg`、`audio/wav`。

页面打开时不会自动请求麦克风权限。只有用户点击“测试麦克风权限”后，才会调用 `getUserMedia({ audio: true })`。测试结束后会主动停止所有 `MediaStream` tracks。

### 音频播放能力

“测试声音播放”使用本地 `AudioContext` 生成极短提示音，只验证浏览器能否在用户手势下播放声音。它不调用 TTS provider，不调用任何付费 API，不依赖外部 CDN，也不会自动播放。

### 本地存储

检测 `localStorage` 是否可写。检测只写入临时键 `ev-runtime-diagnostics-test`，随后立即删除，不覆盖真实练习记录。

### 下载或复制能力

检测浏览器是否支持 `Blob` 和 `URL.createObjectURL`。微信内置浏览器中下载可能受限，因此面板提供“复制诊断结果”作为降级路径。

## 不会调用真实 provider 的项目

以下检测不会调用 LLM、STT、TTS 或任何真实付费 API：

- 页面环境检测。
- 录音能力静态检测。
- 麦克风权限测试。
- 本地播放测试。
- localStorage 检测。
- Blob/Object URL 检测。
- 复制诊断结果。
- `GET /api/diagnostics/runtime`。

诊断接口只检查应用自身和配置是否存在，不检查 provider 是否真实可用。

## 复制诊断结果

点击“复制诊断结果”会复制一段文本，包含：

- 时间。
- 浏览器和设备基础信息。
- HTTPS / secure context。
- API 检测状态和耗时。
- 录音能力支持情况。
- 音频播放测试结果。
- localStorage 状态。
- 微信环境判断。

复制内容不得包含：API Key、Cookie、Token、用户语音、用户回答、完整练习记录、内部服务器路径或堆栈。

## 隐私边界

系统检测不采集真实姓名、联系方式、用户语音、用户回答、转写文本、报告内容或完整练习记录。用户可以自愿复制诊断结果并发给开发者排查环境问题。

## 已知限制

- 微信内置浏览器能力差异较大，系统检测只能显示当前设备当前浏览器的能力结果。
- iOS Safari 和微信内置浏览器可能要求用户手势后才能录音或播放。
- 本地播放测试成功不代表 TTS provider 可用，只代表浏览器播放能力可用。
- API 诊断成功不代表 LLM/STT/TTS provider 已完成真实访问测试。
- 文件下载在微信内置浏览器中可能被限制，建议使用复制结果作为降级。